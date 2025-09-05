"""
پیاده‌سازی صرافی نوبیتکس
Nobitex Exchange Implementation
"""
import hmac
import hashlib
import time
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from .base import BaseExchange
from ..models.trading import MarketPrice, TradeExecutionResponse, TradeType, TradeStatus

class NobitexExchange(BaseExchange):
    """پیاده‌سازی API نوبیتکس"""
    
    @property
    def base_url(self) -> str:
        return "https://api.nobitex.ir"
    
    @property
    def supported_pairs(self) -> List[str]:
        return [
            "BTC/IRT", "ETH/IRT", "LTC/IRT", "XRP/IRT", "BCH/IRT",
            "ADA/IRT", "EOS/IRT", "TRX/IRT", "BNB/IRT", "USDT/IRT",
            "BTC/USDT", "ETH/USDT", "LTC/USDT", "XRP/USDT", "BCH/USDT",
            "ADA/USDT", "EOS/USDT", "TRX/USDT", "BNB/USDT"
        ]
    
    def _get_auth_headers(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None
    ) -> Dict[str, str]:
        """تولید هدرهای احراز هویت نوبیتکس"""
        timestamp = str(int(time.time() * 1000))
        
        # ایجاد payload برای امضا
        if data:
            payload = json.dumps(data, separators=(',', ':'))
        else:
            payload = ""
        
        # ایجاد رشته برای امضا
        message = f"{timestamp}{method.upper()}/api{endpoint}{payload}"
        
        # امضای HMAC
        signature = hmac.new(
            self.secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return {
            "X-API-Key": self.api_key,
            "X-Signature": signature,
            "X-Timestamp": timestamp,
            "Content-Type": "application/json"
        }
    
    async def get_ticker(self, symbol: str) -> MarketPrice:
        """دریافت قیمت لحظه‌ای از نوبیتکس"""
        try:
            # تبدیل نماد به فرمت نوبیتکس
            nobitex_symbol = self._normalize_symbol_for_nobitex(symbol)
            
            # درخواست اطلاعات قیمت
            response = await self._make_request(
                "GET",
                f"/market/stats?srcCurrency={nobitex_symbol.split('-')[0]}&dstCurrency={nobitex_symbol.split('-')[1]}"
            )
            
            if response.get("status") != "ok":
                raise Exception(f"Nobitex API Error: {response.get('message', 'Unknown error')}")
            
            stats = response.get("stats", {})
            if not stats:
                raise Exception("No price data available")
            
            # استخراج اطلاعات قیمت
            price_data = list(stats.values())[0] if stats else {}
            
            return MarketPrice(
                symbol=symbol,
                price=float(price_data.get("latest", 0)),
                timestamp=datetime.now(),
                volume_24h=float(price_data.get("dayChange", 0)),
                change_24h=float(price_data.get("dayChange", 0))
            )
            
        except Exception as e:
            raise Exception(f"Failed to get ticker for {symbol}: {str(e)}")
    
    async def get_balance(self) -> Dict[str, float]:
        """دریافت موجودی حساب"""
        try:
            response = await self._make_request("POST", "/users/wallets/list")
            
            if response.get("status") != "ok":
                raise Exception(f"Nobitex API Error: {response.get('message', 'Unknown error')}")
            
            wallets = response.get("wallets", [])
            balance = {}
            
            for wallet in wallets:
                currency = wallet.get("currency", "").upper()
                balance[currency] = float(wallet.get("balance", 0))
            
            return balance
            
        except Exception as e:
            raise Exception(f"Failed to get balance: {str(e)}")
    
    async def place_order(
        self,
        symbol: str,
        side: TradeType,
        amount: float,
        price: Optional[float] = None,
        order_type: str = "market"
    ) -> TradeExecutionResponse:
        """ثبت سفارش در نوبیتکس"""
        try:
            # تبدیل نماد
            base, quote = symbol.split("/")
            
            # آماده‌سازی پارامترهای سفارش
            order_data = {
                "type": side.value,
                "srcCurrency": base.lower() if side == TradeType.SELL else quote.lower(),
                "dstCurrency": quote.lower() if side == TradeType.SELL else base.lower(),
                "amount": str(amount),
                "execution": order_type
            }
            
            if order_type == "limit" and price:
                order_data["price"] = str(price)
            
            response = await self._make_request("POST", "/market/orders/add", data=order_data)
            
            if response.get("status") != "ok":
                raise Exception(f"Order failed: {response.get('message', 'Unknown error')}")
            
            order = response.get("order", {})
            
            return TradeExecutionResponse(
                success=True,
                message="Order placed successfully",
                order_id=str(order.get("id", "")),
                trade_type=side,
                amount=amount,
                price=float(order.get("price", price or 0)),
                total_value=float(order.get("totalPrice", 0)),
                fee=float(order.get("fee", 0)),
                status=TradeStatus.PENDING,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            return TradeExecutionResponse(
                success=False,
                message=str(e),
                order_id=None,
                trade_type=side,
                amount=amount,
                price=price or 0,
                total_value=0,
                fee=0,
                status=TradeStatus.FAILED,
                timestamp=datetime.now()
            )
    
    async def get_order_status(self, order_id: str, symbol: str) -> Dict[str, Any]:
        """بررسی وضعیت سفارش"""
        try:
            response = await self._make_request(
                "POST",
                "/market/orders/status",
                data={"id": order_id}
            )
            
            if response.get("status") != "ok":
                raise Exception(f"Failed to get order status: {response.get('message')}")
            
            return response.get("order", {})
            
        except Exception as e:
            raise Exception(f"Failed to get order status: {str(e)}")
    
    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        """لغو سفارش"""
        try:
            response = await self._make_request(
                "POST",
                "/market/orders/cancel-old",
                data={"order": order_id}
            )
            
            return response.get("status") == "ok"
            
        except Exception:
            return False
    
    async def get_historical_data(
        self,
        symbol: str,
        interval: str = "1h",
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 500
    ) -> List[Dict[str, Any]]:
        """دریافت داده‌های تاریخی"""
        try:
            # نوبیتکس فعلاً API کاملی برای historical data ندارد
            # اینجا یک پیاده‌سازی ساده ارائه می‌دهیم
            
            # تبدیل نماد
            base, quote = symbol.split("/")
            
            # درخواست داده‌های اخیر
            response = await self._make_request(
                "GET",
                f"/market/stats?srcCurrency={base.lower()}&dstCurrency={quote.lower()}"
            )
            
            if response.get("status") != "ok":
                raise Exception("Failed to get market data")
            
            # شبیه‌سازی داده‌های تاریخی بر اساس قیمت فعلی
            stats = response.get("stats", {})
            current_price = 0
            
            if stats:
                price_data = list(stats.values())[0]
                current_price = float(price_data.get("latest", 0))
            
            # تولید داده‌های نمونه (در پروژه واقعی باید از منابع خارجی استفاده کرد)
            historical_data = []
            for i in range(limit):
                timestamp = datetime.now() - timedelta(hours=i)
                historical_data.append({
                    "timestamp": timestamp.isoformat(),
                    "open": current_price * (0.99 + 0.02 * (i % 10) / 10),
                    "high": current_price * (1.01 + 0.02 * (i % 10) / 10),
                    "low": current_price * (0.97 + 0.02 * (i % 10) / 10),
                    "close": current_price * (0.98 + 0.04 * (i % 10) / 10),
                    "volume": 1000 + (i * 50)
                })
            
            return list(reversed(historical_data))  # مرتب‌سازی بر اساس زمان
            
        except Exception as e:
            raise Exception(f"Failed to get historical data: {str(e)}")
    
    def _normalize_symbol_for_nobitex(self, symbol: str) -> str:
        """تبدیل نماد به فرمت نوبیتکس"""
        # نوبیتکس از فرمت "BTC-IRT" استفاده می‌کند
        base, quote = symbol.split("/")
        return f"{base.lower()}-{quote.lower()}"
    
    async def get_orderbook(self, symbol: str) -> Dict[str, Any]:
        """دریافت کتاب سفارشات"""
        try:
            base, quote = symbol.split("/")
            response = await self._make_request(
                "GET",
                f"/market/orderbook?symbol={base.lower()}{quote.lower()}"
            )
            
            if response.get("status") != "ok":
                raise Exception("Failed to get orderbook")
            
            return response
            
        except Exception as e:
            raise Exception(f"Failed to get orderbook: {str(e)}")
    
    async def get_recent_trades(self, symbol: str, limit: int = 50) -> List[Dict[str, Any]]:
        """دریافت آخرین معاملات"""
        try:
            base, quote = symbol.split("/")
            response = await self._make_request(
                "GET",
                f"/market/trades/{base.lower()}-{quote.lower()}"
            )
            
            if response.get("status") != "ok":
                raise Exception("Failed to get recent trades")
            
            return response.get("trades", [])[:limit]
            
        except Exception as e:
            raise Exception(f"Failed to get recent trades: {str(e)}")
    
    def calculate_fee(self, amount: float, price: float, is_maker: bool = False) -> float:
        """محاسبه کارمزد نوبیتکس"""
        # کارمزد نوبیتکس معمولاً 0.35% است
        fee_rate = 0.0035
        return amount * price * fee_rate