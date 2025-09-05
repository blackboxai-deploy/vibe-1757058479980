"""
پیکربندی اصلی ربات ترید
Configuration settings for the trading bot
"""
import os
from pathlib import Path
from typing import List

# مسیر پروژه
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"

# ایجاد پوشه data اگر وجود ندارد
DATA_DIR.mkdir(exist_ok=True)

class Settings:
    """تنظیمات اصلی برنامه"""
    
    # FastAPI Settings
    APP_NAME: str = "Professional Trading Bot"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATA_DIR}/trading_bot.db"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Encryption for API Keys
    ENCRYPTION_KEY: bytes = os.getenv("ENCRYPTION_KEY", "your-32-byte-encryption-key-here").encode()[:32].ljust(32, b'0')
    
    # Trading Settings
    DEFAULT_EMA_SHORT: int = 12
    DEFAULT_EMA_LONG: int = 26
    DEFAULT_RSI_PERIOD: int = 14
    
    # Risk Management
    MAX_TRADE_AMOUNT_PERCENT: float = 2.0  # حداکثر 2% از کل دارایی در هر معامله
    MIN_TIME_BETWEEN_TRADES: int = 300  # 5 دقیقه فاصله بین معاملات
    
    # API Rate Limits
    API_RATE_LIMIT: int = 60  # درخواست در دقیقه
    
    # Supported Exchanges
    SUPPORTED_EXCHANGES: List[str] = [
        "nobitex",
        "wallex", 
        "ramzinex",
        "iranocoin",
        "bitpin"
    ]
    
    # Supported Trading Pairs
    SUPPORTED_PAIRS: List[str] = [
        "BTC/USDT",
        "ETH/USDT", 
        "BNB/USDT",
        "BTC/IRT",
        "ETH/IRT",
        "USDT/IRT"
    ]

settings = Settings()