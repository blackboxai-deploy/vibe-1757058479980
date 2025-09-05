"""
ربات ترید حرفه‌ای - FastAPI Backend
Professional Trading Bot - FastAPI Backend
"""
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional

from .config import settings
from .database import get_db, create_tables, DatabaseManager
from .security import security_manager
from .models.trading import (
    APICredentialsRequest, APICredentialsResponse,
    TradingSettingsRequest, TradingSignal,
    TradeExecutionRequest, TradeExecutionResponse,
    BacktestRequest, BacktestResult
)

# پیکربندی لاگینگ
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ایجاد اپلیکیشن FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="ربات ترید حرفه‌ای با پشتیبانی از صرافی‌های ایرانی",
    docs_url="/docs",
    redoc_url="/redoc"
)

# تنظیمات CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache برای exchange instances
exchange_cache: Dict[str, any] = {}

# استراتژی‌های فعال
active_strategies: Dict[str, any] = {}

@app.on_event("startup")
async def startup_event():
    """راه‌اندازی اولیه برنامه"""
    logger.info("Starting Trading Bot Backend...")
    
    # ایجاد جداول دیتابیس
    await create_tables()
    logger.info("Database tables created/verified")
    
    logger.info("Trading Bot Backend started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """خاموش کردن برنامه"""
    logger.info("Shutting down Trading Bot Backend...")
    
    # بستن اتصالات exchange
    for exchange in exchange_cache.values():
        if hasattr(exchange, '__aexit__'):
            await exchange.__aexit__(None, None, None)
    
    logger.info("Trading Bot Backend shutdown complete")

@app.get("/")
async def root():
    """صفحه اصلی API"""
    return {
        "message": "Professional Trading Bot API",
        "version": settings.VERSION,
        "status": "running",
        "supported_exchanges": settings.SUPPORTED_EXCHANGES,
        "supported_pairs": settings.SUPPORTED_PAIRS,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """بررسی سلامت سیستم"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected",
        "cache_size": len(exchange_cache),
        "active_strategies": len(active_strategies)
    }

# === API Endpoints برای مدیریت کلیدهای API ===

@app.post("/api/set-api", response_model=APICredentialsResponse)
async def set_api_credentials(
    credentials: APICredentialsRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    ذخیره کلیدهای API کاربر برای صرافی انتخابی
    """
    try:
        # اعتبارسنجی کلیدهای API
        if not security_manager.validate_api_credentials(credentials.api_key, credentials.secret):
            raise HTTPException(status_code=400, detail="Invalid API credentials format")
        
        # رمزنگاری کلیدها
        encrypted_key = security_manager.encrypt_api_key(credentials.api_key)
        encrypted_secret = security_manager.encrypt_secret(credentials.secret)
        
        # ذخیره در دیتابیس
        db_manager = DatabaseManager(db)
        
        # بررسی/ایجاد کاربر
        user = await db_manager.get_user_by_id(credentials.user_id)
        if not user:
            user = await db_manager.create_user(credentials.user_id)
        
        # ذخیره credentials
        credential = await db_manager.save_exchange_credentials(
            user_id=credentials.user_id,
            exchange_name=credentials.exchange_name,
            encrypted_api_key=encrypted_key,
            encrypted_secret=encrypted_secret
        )
        
        # حذف از cache تا مجدداً لود شود
        cache_key = f"{credentials.user_id}:{credentials.exchange_name}"
        if cache_key in exchange_cache:
            del exchange_cache[cache_key]
        
        return APICredentialsResponse(
            success=True,
            message="API credentials saved successfully",
            exchange_name=credentials.exchange_name,
            created_at=credential.created_at
        )
        
    except Exception as e:
        logger.error(f"Failed to save API credentials: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save credentials: {str(e)}")

@app.get("/api/test-connection/{user_id}/{exchange_name}")
async def test_exchange_connection(
    user_id: str,
    exchange_name: str,
    db: AsyncSession = Depends(get_db)
):
    """تست اتصال به صرافی"""
    try:
        exchange = await get_exchange_instance(user_id, exchange_name, db)
        is_connected = await exchange.test_connection()
        
        if is_connected:
            # تست دریافت موجودی
            balance = await exchange.get_balance()
            return {
                "success": True,
                "message": "Connection successful",
                "exchange": exchange_name,
                "balance_currencies": list(balance.keys())[:5]  # نمایش ۵ ارز اول
            }
        else:
            raise HTTPException(status_code=400, detail="Connection failed")
            
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")

# === API Endpoints برای سیگنال‌ها و معاملات ===

@app.get("/api/trade-signal/{user_id}/{exchange_name}/{pair}")
async def get_trade_signal(
    user_id: str,
    exchange_name: str,
    pair: str,
    db: AsyncSession = Depends(get_db)
) -> TradingSignal:
    """دریافت سیگنال معاملاتی لحظه‌ای"""
    try:
        # بررسی پشتیبانی از جفت ارز
        if pair not in settings.SUPPORTED_PAIRS:
            raise HTTPException(status_code=400, detail=f"Trading pair {pair} not supported")
        
        # دریافت exchange instance
        exchange = await get_exchange_instance(user_id, exchange_name, db)
        
        # دریافت قیمت فعلی
        market_price = await exchange.get_ticker(pair)
        
        # دریافت یا ایجاد استراتژی
        strategy = await get_strategy_instance(user_id, exchange_name, pair, db)
        
        # دریافت داده‌های تاریخی برای محاسبه شاخص‌ها
        historical_data = await exchange.get_historical_data(pair, interval="1h", limit=100)
        historical_prices = [float(candle.get('close', 0)) for candle in historical_data]
        
        # افزودن داده‌ها به استراتژی
        strategy.add_price_data(historical_prices)
        
        # تولید سیگنال
        signal = strategy.generate_signal(
            current_price=market_price.price,
            symbol=pair,
            exchange=exchange_name
        )
        
        return signal
        
    except Exception as e:
        logger.error(f"Failed to generate signal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Signal generation failed: {str(e)}")

@app.post("/api/execute-trade", response_model=TradeExecutionResponse)
async def execute_trade(
    trade_request: TradeExecutionRequest,
    db: AsyncSession = Depends(get_db)
):
    """اجرای معامله واقعی"""
    try:
        # دریافت exchange instance
        exchange = await get_exchange_instance(
            trade_request.user_id,
            trade_request.exchange_name,
            db
        )
        
        # اجرای معامله
        result = await exchange.place_order(
            symbol=trade_request.trading_pair,
            side=trade_request.trade_type,
            amount=trade_request.amount,
            price=trade_request.price
        )
        
        # ذخیره در تاریخچه
        if result.success:
            db_manager = DatabaseManager(db)
            await db_manager.save_trade(
                user_id=trade_request.user_id,
                exchange_name=trade_request.exchange_name,
                trading_pair=trade_request.trading_pair,
                trade_type=trade_request.trade_type.value,
                amount=trade_request.amount,
                price=result.price,
                order_id=result.order_id,
                status=result.status.value,
                execution_time=result.timestamp
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Trade execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Trade execution failed: {str(e)}")

@app.post("/api/backtest", response_model=BacktestResult)
async def run_backtest(
    backtest_request: BacktestRequest,
    db: AsyncSession = Depends(get_db)
):
    """اجرای بک‌تست استراتژی"""
    try:
        # ایجاد exchange instance موقت برای دریافت داده‌ها
        # در اینجا از نوبیتکس به عنوان پیش‌فرض استفاده می‌کنیم
        from .exchanges.nobitex import NobitexExchange
        
        # برای بک‌تست نیازی به credentials واقعی نیست
        temp_exchange = NobitexExchange("dummy_key", "dummy_secret")
        
        # دریافت داده‌های تاریخی
        historical_data = await temp_exchange.get_historical_data(
            symbol=backtest_request.trading_pair,
            interval="1h",
            start_time=backtest_request.start_date,
            end_time=backtest_request.end_date,
            limit=1000
        )
        
        await temp_exchange.__aexit__(None, None, None)  # بستن اتصال
        
        if not historical_data:
            raise HTTPException(status_code=400, detail="No historical data available")
        
        # ایجاد استراتژی برای بک‌تست
        from .strategies.ema_rsi import EmaRsiStrategy
        strategy = EmaRsiStrategy(
            ema_short_period=backtest_request.ema_short_period,
            ema_long_period=backtest_request.ema_long_period,
            rsi_period=backtest_request.rsi_period,
            rsi_overbought=backtest_request.rsi_overbought,
            rsi_oversold=backtest_request.rsi_oversold
        )
        
        # اجرای بک‌تست
        results = strategy.backtest(
            historical_prices=historical_data,
            initial_balance=backtest_request.initial_balance,
            trade_amount_percent=backtest_request.trade_amount_percent
        )
        
        # تبدیل به فرمت پاسخ
        from .models.trading import BacktestTrade
        trades = []
        for trade in results["trades"]:
            bt_trade = BacktestTrade(
                timestamp=trade["timestamp"],
                trade_type=trade["type"],
                price=trade["price"],
                amount=trade["amount"],
                total_value=trade["amount"] * trade["price"],
                balance_after=trade["balance"],
                profit_loss=trade.get("profit_loss", 0),
                ema_short=trade["ema_short"],
                ema_long=trade["ema_long"],
                rsi=trade["rsi"]
            )
            trades.append(bt_trade)
        
        return BacktestResult(
            success=True,
            message="Backtest completed successfully",
            initial_balance=results["initial_balance"],
            final_balance=results["final_balance"],
            total_return=results["total_return"],
            total_return_percent=results["total_return_percent"],
            total_trades=results["total_trades"],
            winning_trades=results["winning_trades"],
            losing_trades=results["losing_trades"],
            win_rate=results["win_rate"],
            total_profit=sum(t.profit_loss for t in trades if t.profit_loss > 0),
            total_loss=sum(t.profit_loss for t in trades if t.profit_loss < 0),
            average_profit=sum(t.profit_loss for t in trades if t.profit_loss > 0) / max(results["winning_trades"], 1),
            average_loss=sum(t.profit_loss for t in trades if t.profit_loss < 0) / max(results["losing_trades"], 1),
            profit_factor=abs(sum(t.profit_loss for t in trades if t.profit_loss > 0) / sum(t.profit_loss for t in trades if t.profit_loss < 0)) if sum(t.profit_loss for t in trades if t.profit_loss < 0) != 0 else 0,
            start_date=backtest_request.start_date,
            end_date=backtest_request.end_date,
            duration_days=(backtest_request.end_date - backtest_request.start_date).days,
            trades=trades,
            balance_history=results["balance_history"]
        )
        
    except Exception as e:
        logger.error(f"Backtest failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

# === توابع کمکی ===

async def get_exchange_instance(user_id: str, exchange_name: str, db: AsyncSession):
    """دریافت یا ایجاد instance صرافی"""
    cache_key = f"{user_id}:{exchange_name}"
    
    # بررسی cache
    if cache_key in exchange_cache:
        return exchange_cache[cache_key]
    
    # دریافت credentials از دیتابیس
    db_manager = DatabaseManager(db)
    credential = await db_manager.get_exchange_credentials(user_id, exchange_name)
    
    if not credential:
        raise HTTPException(status_code=404, detail="Exchange credentials not found")
    
    # رمزگشایی کلیدها
    api_key = security_manager.decrypt_api_key(credential.encrypted_api_key)
    secret = security_manager.decrypt_secret(credential.encrypted_secret)
    
    # ایجاد exchange instance
    if exchange_name == "nobitex":
        from .exchanges.nobitex import NobitexExchange
        exchange = NobitexExchange(api_key, secret)
    else:
        raise HTTPException(status_code=400, detail=f"Exchange {exchange_name} not implemented yet")
    
    # ذخیره در cache
    exchange_cache[cache_key] = exchange
    
    return exchange

async def get_strategy_instance(user_id: str, exchange_name: str, pair: str, db: AsyncSession):
    """دریافت یا ایجاد استراتژی"""
    strategy_key = f"{user_id}:{exchange_name}:{pair}"
    
    # بررسی cache
    if strategy_key in active_strategies:
        return active_strategies[strategy_key]
    
    # ایجاد استراتژی جدید
    from .strategies.ema_rsi import EmaRsiStrategy
    strategy = EmaRsiStrategy()
    
    # ذخیره در cache
    active_strategies[strategy_key] = strategy
    
    return strategy

# === API Endpoints اضافی ===

@app.get("/api/exchanges")
async def get_supported_exchanges():
    """لیست صرافی‌های پشتیبانی شده"""
    return {
        "exchanges": [
            {
                "name": "nobitex",
                "display_name": "نوبیتکس",
                "status": "active",
                "supported_pairs": ["BTC/IRT", "ETH/IRT", "USDT/IRT", "BTC/USDT", "ETH/USDT"]
            },
            {
                "name": "wallex",
                "display_name": "والکس",
                "status": "coming_soon",
                "supported_pairs": []
            },
            {
                "name": "ramzinex",
                "display_name": "رمزینکس", 
                "status": "coming_soon",
                "supported_pairs": []
            }
        ]
    }

@app.get("/api/trading-pairs")
async def get_trading_pairs():
    """لیست جفت ارزهای پشتیبانی شده"""
    return {
        "pairs": settings.SUPPORTED_PAIRS,
        "categories": {
            "irt_pairs": [pair for pair in settings.SUPPORTED_PAIRS if "/IRT" in pair],
            "usdt_pairs": [pair for pair in settings.SUPPORTED_PAIRS if "/USDT" in pair]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)