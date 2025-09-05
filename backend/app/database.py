"""
مدیریت دیتابیس SQLite برای ذخیره اطلاعات کاربران و معاملات
Database management for storing user data and trading history
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from datetime import datetime
from typing import AsyncGenerator
import json

from .config import settings

# تنظیم دیتابیس
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

class User(Base):
    """مدل کاربر"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)  # شناسه منحصر به فرد کاربر
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class ExchangeCredential(Base):
    """اطلاعات API صرافی‌ها"""
    __tablename__ = "exchange_credentials"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)  # ارتباط با کاربر
    exchange_name = Column(String, index=True)  # نام صرافی (nobitex, wallex, etc.)
    encrypted_api_key = Column(Text)  # کلید API رمزنگاری شده
    encrypted_secret = Column(Text)  # Secret رمزنگاری شده
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TradingSettings(Base):
    """تنظیمات معاملاتی کاربر"""
    __tablename__ = "trading_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    exchange_name = Column(String)
    trading_pair = Column(String)  # BTC/USDT, ETH/IRT, etc.
    
    # تنظیمات EMA
    ema_short_period = Column(Integer, default=12)
    ema_long_period = Column(Integer, default=26)
    
    # تنظیمات RSI
    rsi_period = Column(Integer, default=14)
    rsi_overbought = Column(Float, default=70.0)
    rsi_oversold = Column(Float, default=30.0)
    
    # مدیریت ریسک
    max_trade_amount = Column(Float)  # حداکثر مقدار معامله
    trade_amount_percent = Column(Float, default=2.0)  # درصد از کل دارایی
    stop_loss_percent = Column(Float, default=2.0)  # درصد stop loss
    take_profit_percent = Column(Float, default=4.0)  # درصد take profit
    
    # فاصله زمانی معاملات
    min_time_between_trades = Column(Integer, default=300)  # ثانیه
    
    is_active = Column(Boolean, default=True)
    auto_trading_enabled = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TradeHistory(Base):
    """تاریخچه معاملات"""
    __tablename__ = "trade_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    exchange_name = Column(String)
    trading_pair = Column(String)
    
    # اطلاعات معامله
    trade_type = Column(String)  # buy, sell
    amount = Column(Float)  # مقدار معامله
    price = Column(Float)  # قیمت معامله
    total_value = Column(Float)  # ارزش کل
    
    # وضعیت معامله
    status = Column(String)  # pending, completed, failed, cancelled
    order_id = Column(String)  # شناسه سفارش در صرافی
    
    # سیگنال‌های فنی
    ema_short = Column(Float)
    ema_long = Column(Float)
    rsi_value = Column(Float)
    signal_strength = Column(Float)  # قدرت سیگنال 0-100
    
    # زمان‌بندی
    signal_time = Column(DateTime)  # زمان تولید سیگنال
    execution_time = Column(DateTime)  # زمان اجرای معامله
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # نتیجه معامله
    profit_loss = Column(Float, default=0.0)  # سود یا زیان
    fee = Column(Float, default=0.0)  # کارمزد
    
    # متادیتا
    metadata = Column(Text)  # اطلاعات اضافی در فرمت JSON

class MarketData(Base):
    """داده‌های بازار برای محاسبات تکنیکال"""
    __tablename__ = "market_data"
    
    id = Column(Integer, primary_key=True, index=True)
    exchange_name = Column(String, index=True)
    trading_pair = Column(String, index=True)
    
    # قیمت‌ها
    timestamp = Column(DateTime, index=True)
    open_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    close_price = Column(Float)
    volume = Column(Float)
    
    # شاخص‌های محاسبه شده
    ema_short = Column(Float)
    ema_long = Column(Float)
    rsi = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)

# وابستگی برای دریافت session دیتابیس
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """دریافت session دیتابیس"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def create_tables():
    """ایجاد جداول دیتابیس"""
    from sqlalchemy.ext.asyncio import create_async_engine
    
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()

# کلاس‌های کمکی برای مدیریت دیتابیس
class DatabaseManager:
    """مدیر دیتابیس برای عملیات پایه"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_user_by_id(self, user_id: str) -> User:
        """دریافت کاربر بر اساس شناسه"""
        from sqlalchemy import select
        
        result = await self.session.execute(select(User).where(User.user_id == user_id))
        return result.scalar_one_or_none()
    
    async def create_user(self, user_id: str) -> User:
        """ایجاد کاربر جدید"""
        user = User(user_id=user_id)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def save_exchange_credentials(
        self, 
        user_id: str, 
        exchange_name: str, 
        encrypted_api_key: str, 
        encrypted_secret: str
    ) -> ExchangeCredential:
        """ذخیره اطلاعات API صرافی"""
        from sqlalchemy import select
        
        # بررسی وجود قبلی
        result = await self.session.execute(
            select(ExchangeCredential).where(
                ExchangeCredential.user_id == user_id,
                ExchangeCredential.exchange_name == exchange_name
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # بروزرسانی
            existing.encrypted_api_key = encrypted_api_key
            existing.encrypted_secret = encrypted_secret
            existing.updated_at = datetime.utcnow()
            credential = existing
        else:
            # ایجاد جدید
            credential = ExchangeCredential(
                user_id=user_id,
                exchange_name=exchange_name,
                encrypted_api_key=encrypted_api_key,
                encrypted_secret=encrypted_secret
            )
            self.session.add(credential)
        
        await self.session.commit()
        await self.session.refresh(credential)
        return credential
    
    async def get_exchange_credentials(self, user_id: str, exchange_name: str) -> ExchangeCredential:
        """دریافت اطلاعات API صرافی"""
        from sqlalchemy import select
        
        result = await self.session.execute(
            select(ExchangeCredential).where(
                ExchangeCredential.user_id == user_id,
                ExchangeCredential.exchange_name == exchange_name,
                ExchangeCredential.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def save_trade(
        self,
        user_id: str,
        exchange_name: str,
        trading_pair: str,
        trade_type: str,
        amount: float,
        price: float,
        **kwargs
    ) -> TradeHistory:
        """ذخیره تاریخچه معامله"""
        trade = TradeHistory(
            user_id=user_id,
            exchange_name=exchange_name,
            trading_pair=trading_pair,
            trade_type=trade_type,
            amount=amount,
            price=price,
            total_value=amount * price,
            **kwargs
        )
        self.session.add(trade)
        await self.session.commit()
        await self.session.refresh(trade)
        return trade