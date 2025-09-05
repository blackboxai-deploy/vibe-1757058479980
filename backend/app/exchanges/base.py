"""
کلاس پایه انتزاعی برای همه صرافی‌ها
Abstract base class for all exchange implementations
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import asyncio
import httpx
from ..models.trading import MarketPrice, TradeExecutionResponse, TradeType, TradeStatus

class BaseExchange(ABC):
    """کلاس پایه برای همه صرافی‌ها"""
    
    def __init__(self, api_key: str, secret: str, testnet: bool = False):
        """
        Initialize exchange connection
        
        Args:
            api_key: کلید API
            secret: کلید محرمانه  
            testnet: استفاده از شبکه تست
        """
        self.api_key = api_key
        self.secret = secret
        self.testnet = testnet
        self.name = self.__class__.__name__.lower().replace('exchange', '')
        
        # تنظیمات عمومی
        self.timeout = 30
        self.retry_count = 3
        self.rate_limit_per_minute = 60
        self.last_request_time = datetime.now()
        
        # Client HTTP
        self.client = httpx.AsyncClient(
            timeout=self.timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    
    async def __aenter__(self):
        """Context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self.client.aclose()
    
    @property
    @abstractmethod
    def base_url(self) -> str:
        """URL پایه API صرافی"""
        pass
    
    @property
    @abstractmethod
    def supported_pairs(self) -> List[str]:
        """لیست جفت ارزهای پشتیبانی شده"""
        pass
    
    @abstractmethod
    async def get_ticker(self, symbol: str) -> MarketPrice:
        """
        دریافت قیمت لحظه‌ای
        
        Args:
            symbol: نماد معاملاتی (مثل BTC/USDT)
            
        Returns:
            MarketPrice: اطلاعات قیمت
        """
        pass
    
    @abstractmethod
    async def get_balance(self) -> Dict[str, float]:
        """
        دریافت موجودی حساب
        
        Returns:
            Dict: موجودی هر ارز
        """
        pass
    
    @abstractmethod
    async def place_order(
        self,
        symbol: str,
        side: TradeType,
        amount: float,
        price: Optional[float] = None,
        order_type: str = "market"
    ) -> TradeExecutionResponse:
        """
        ثبت سفارش معامله
        
        Args:
            symbol: نماد معاملاتی
            side: نوع معامله (خرید/فروش)
            amount: مقدار
            price: قیمت (برای limit order)
            order_type: نوع سفارش (market/limit)
            
        Returns:
            TradeExecutionResponse: نتیجه معامله
        """
        pass
    
    @abstractmethod
    async def get_order_status(self, order_id: str, symbol: str) -> Dict[str, Any]:
        """
        بررسی وضعیت سفارش
        
        Args:
            order_id: شناسه سفارش
            symbol: نماد معاملاتی
            
        Returns:
            Dict: اطلاعات سفارش
        """
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        """
        لغو سفارش
        
        Args:
            order_id: شناسه سفارش
            symbol: نماد معاملاتی
            
        Returns:
            bool: موفقیت لغو
        """
        pass
    
    @abstractmethod
    async def get_historical_data(
        self,
        symbol: str,
        interval: str = "1h",
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 500
    ) -> List[Dict[str, Any]]:
        """
        دریافت داده‌های تاریخی
        
        Args:
            symbol: نماد معاملاتی
            interval: بازه زمانی (1m, 5m, 1h, 1d)
            start_time: زمان شروع
            end_time: زمان پایان
            limit: تعداد رکورد
            
        Returns:
            List[Dict]: داده‌های OHLCV
        """
        pass
    
    # متدهای کمکی مشترک
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        ارسال درخواست HTTP با مدیریت خطا
        
        Args:
            method: متد HTTP
            endpoint: نقطه پایانی API
            params: پارامترهای URL
            data: داده‌های POST
            headers: هدرها
            
        Returns:
            Dict: پاسخ JSON
        """
        await self._check_rate_limit()
        
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        # افزودن هدرهای احراز هویت
        if headers is None:
            headers = {}
        headers.update(self._get_auth_headers(method, endpoint, params, data))
        
        # تلاش مجدد در صورت خطا
        for attempt in range(self.retry_count):
            try:
                response = await self.client.request(
                    method=method,
                    url=url,
                    params=params,
                    json=data,
                    headers=headers
                )
                response.raise_for_status()
                return response.json()
            
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:  # Rate limit exceeded
                    wait_time = 60 / self.rate_limit_per_minute
                    await asyncio.sleep(wait_time)
                    continue
                elif attempt == self.retry_count - 1:
                    raise Exception(f"HTTP Error: {e.response.status_code} - {e.response.text}")
            
            except httpx.RequestError as e:
                if attempt == self.retry_count - 1:
                    raise Exception(f"Request Error: {str(e)}")
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception("Max retry attempts reached")
    
    async def _check_rate_limit(self):
        """بررسی محدودیت نرخ درخواست"""
        now = datetime.now()
        time_diff = (now - self.last_request_time).total_seconds()
        min_interval = 60 / self.rate_limit_per_minute
        
        if time_diff < min_interval:
            await asyncio.sleep(min_interval - time_diff)
        
        self.last_request_time = datetime.now()
    
    @abstractmethod
    def _get_auth_headers(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None
    ) -> Dict[str, str]:
        """
        تولید هدرهای احراز هویت
        
        Args:
            method: متد HTTP
            endpoint: نقطه پایانی
            params: پارامترها
            data: داده‌ها
            
        Returns:
            Dict: هدرهای احراز هویت
        """
        pass
    
    def _normalize_symbol(self, symbol: str) -> str:
        """
        تبدیل نماد به فرمت استاندارد صرافی
        
        Args:
            symbol: نماد استاندارد (مثل BTC/USDT)
            
        Returns:
            str: نماد در فرمت صرافی
        """
        return symbol.replace('/', '').upper()
    
    async def test_connection(self) -> bool:
        """
        تست اتصال به API
        
        Returns:
            bool: موفقیت اتصال
        """
        try:
            await self.get_balance()
            return True
        except Exception:
            return False
    
    def validate_symbol(self, symbol: str) -> bool:
        """
        اعتبارسنجی نماد معاملاتی
        
        Args:
            symbol: نماد
            
        Returns:
            bool: معتبر بودن نماد
        """
        return symbol in self.supported_pairs
    
    def calculate_fee(self, amount: float, price: float, is_maker: bool = False) -> float:
        """
        محاسبه کارمزد معامله
        
        Args:
            amount: مقدار
            price: قیمت
            is_maker: آیا maker است؟
            
        Returns:
            float: کارمزد
        """
        # کارمزد پیش‌فرض 0.1%
        fee_rate = 0.001
        return amount * price * fee_rate
    
    async def get_trading_rules(self, symbol: str) -> Dict[str, Any]:
        """
        دریافت قوانین معاملاتی نماد
        
        Args:
            symbol: نماد معاملاتی
            
        Returns:
            Dict: قوانین معاملاتی
        """
        return {
            "min_qty": 0.00001,
            "max_qty": 1000000,
            "step_size": 0.00001,
            "min_notional": 10,
            "price_precision": 8,
            "qty_precision": 8
        }