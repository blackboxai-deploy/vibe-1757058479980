"""
مدل‌های Pydantic برای معاملات
Pydantic models for trading operations
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class TradeType(str, Enum):
    """نوع معامله"""
    BUY = "buy"
    SELL = "sell"

class TradeStatus(str, Enum):
    """وضعیت معامله"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class SignalStrength(str, Enum):
    """قدرت سیگنال"""
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"

class APICredentialsRequest(BaseModel):
    """درخواست ذخیره کلیدهای API"""
    user_id: str = Field(..., min_length=3, max_length=100)
    exchange_name: str = Field(..., min_length=3, max_length=50)
    api_key: str = Field(..., min_length=10, max_length=500)
    secret: str = Field(..., min_length=10, max_length=500)
    
    @validator('exchange_name')
    def validate_exchange_name(cls, v):
        from ..config import settings
        if v.lower() not in settings.SUPPORTED_EXCHANGES:
            raise ValueError(f'Exchange not supported. Supported: {settings.SUPPORTED_EXCHANGES}')
        return v.lower()
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user123",
                "exchange_name": "nobitex",
                "api_key": "your-api-key-here",
                "secret": "your-secret-here"
            }
        }

class APICredentialsResponse(BaseModel):
    """پاسخ ذخیره کلیدهای API"""
    success: bool
    message: str
    exchange_name: str
    created_at: datetime

class TradingSettingsRequest(BaseModel):
    """تنظیمات معاملاتی"""
    user_id: str
    exchange_name: str
    trading_pair: str = Field(..., pattern=r'^[A-Z]+/[A-Z]+$')
    
    # تنظیمات EMA
    ema_short_period: int = Field(default=12, ge=5, le=50)
    ema_long_period: int = Field(default=26, ge=10, le=100)
    
    # تنظیمات RSI
    rsi_period: int = Field(default=14, ge=7, le=30)
    rsi_overbought: float = Field(default=70.0, ge=50.0, le=90.0)
    rsi_oversold: float = Field(default=30.0, ge=10.0, le=50.0)
    
    # مدیریت ریسک
    max_trade_amount: Optional[float] = Field(None, gt=0)
    trade_amount_percent: float = Field(default=2.0, ge=0.1, le=10.0)
    stop_loss_percent: float = Field(default=2.0, ge=0.5, le=10.0)
    take_profit_percent: float = Field(default=4.0, ge=1.0, le=20.0)
    
    # زمان‌بندی
    min_time_between_trades: int = Field(default=300, ge=60, le=3600)
    auto_trading_enabled: bool = Field(default=False)
    
    @validator('ema_long_period')
    def validate_ema_periods(cls, v, values):
        if 'ema_short_period' in values and v <= values['ema_short_period']:
            raise ValueError('EMA long period must be greater than short period')
        return v
    
    @validator('trading_pair')
    def validate_trading_pair(cls, v):
        from ..config import settings
        if v not in settings.SUPPORTED_PAIRS:
            raise ValueError(f'Trading pair not supported. Supported: {settings.SUPPORTED_PAIRS}')
        return v

class MarketPrice(BaseModel):
    """قیمت بازار"""
    symbol: str
    price: float
    timestamp: datetime
    volume_24h: Optional[float] = None
    change_24h: Optional[float] = None
    
class TechnicalIndicators(BaseModel):
    """شاخص‌های تکنیکال"""
    ema_short: Optional[float] = None
    ema_long: Optional[float] = None
    rsi: Optional[float] = None
    timestamp: datetime

class TradingSignal(BaseModel):
    """سیگنال معاملاتی"""
    symbol: str
    exchange: str
    signal_type: TradeType
    strength: SignalStrength
    price: float
    indicators: TechnicalIndicators
    confidence: float = Field(..., ge=0, le=100)  # درصد اطمینان
    message: str
    timestamp: datetime
    
    class Config:
        schema_extra = {
            "example": {
                "symbol": "BTC/USDT",
                "exchange": "nobitex",
                "signal_type": "buy",
                "strength": "strong",
                "price": 43500.0,
                "indicators": {
                    "ema_short": 43400.0,
                    "ema_long": 43200.0,
                    "rsi": 28.5,
                    "timestamp": "2024-01-01T12:00:00"
                },
                "confidence": 85.5,
                "message": "Strong buy signal: EMA crossover + RSI oversold",
                "timestamp": "2024-01-01T12:00:00"
            }
        }

class TradeExecutionRequest(BaseModel):
    """درخواست اجرای معامله"""
    user_id: str
    exchange_name: str
    trading_pair: str
    trade_type: TradeType
    amount: float = Field(..., gt=0)
    price: Optional[float] = None  # None برای market order
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user123",
                "exchange_name": "nobitex", 
                "trading_pair": "BTC/USDT",
                "trade_type": "buy",
                "amount": 0.001,
                "price": None
            }
        }

class TradeExecutionResponse(BaseModel):
    """پاسخ اجرای معامله"""
    success: bool
    message: str
    order_id: Optional[str] = None
    trade_type: TradeType
    amount: float
    price: float
    total_value: float
    fee: float
    status: TradeStatus
    timestamp: datetime

class BacktestRequest(BaseModel):
    """درخواست بک‌تست"""
    exchange_name: str
    trading_pair: str
    start_date: datetime
    end_date: datetime
    initial_balance: float = Field(default=1000.0, gt=0)
    
    # تنظیمات استراتژی
    ema_short_period: int = Field(default=12, ge=5, le=50)
    ema_long_period: int = Field(default=26, ge=10, le=100)
    rsi_period: int = Field(default=14, ge=7, le=30)
    rsi_overbought: float = Field(default=70.0, ge=50.0, le=90.0)
    rsi_oversold: float = Field(default=30.0, ge=10.0, le=50.0)
    
    trade_amount_percent: float = Field(default=10.0, ge=1.0, le=100.0)

class BacktestTrade(BaseModel):
    """معامله در بک‌تست"""
    timestamp: datetime
    trade_type: TradeType
    price: float
    amount: float
    total_value: float
    balance_after: float
    profit_loss: float
    ema_short: float
    ema_long: float
    rsi: float

class BacktestResult(BaseModel):
    """نتایج بک‌تست"""
    success: bool
    message: str
    
    # آمار کلی
    initial_balance: float
    final_balance: float
    total_return: float
    total_return_percent: float
    
    # آمار معاملات
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    
    # آمار سود/زیان
    total_profit: float
    total_loss: float
    average_profit: float
    average_loss: float
    profit_factor: float
    
    # آمار زمانی
    start_date: datetime
    end_date: datetime
    duration_days: int
    
    # معاملات
    trades: List[BacktestTrade]
    
    # نمودار عملکرد
    balance_history: List[Dict[str, Any]]

class ExchangeInfo(BaseModel):
    """اطلاعات صرافی"""
    name: str
    display_name: str
    status: str  # active, inactive, maintenance
    supported_pairs: List[str]
    trading_fees: Dict[str, float]
    api_limits: Dict[str, int]
    
class UserPortfolio(BaseModel):
    """پرتفوی کاربر"""
    user_id: str
    exchange_name: str
    total_balance_usdt: float
    available_balance: float
    in_order: float
    assets: Dict[str, float]  # نام ارز -> مقدار
    last_updated: datetime

class RiskMetrics(BaseModel):
    """معیارهای ریسک"""
    max_drawdown: float
    sharpe_ratio: float
    volatility: float
    var_95: float  # Value at Risk 95%
    beta: float