"""
استراتژی معاملاتی EMA + RSI
EMA + RSI Trading Strategy Implementation
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timedelta
from enum import Enum

from ..models.trading import TradingSignal, TechnicalIndicators, TradeType, SignalStrength

class SignalType(Enum):
    """نوع سیگنال"""
    BUY = "buy"
    SELL = "sell" 
    HOLD = "hold"

class EmaRsiStrategy:
    """
    استراتژی معاملاتی بر اساس EMA و RSI
    
    سیگنال خرید: EMA کوتاه > EMA بلند + RSI < 30 (oversold)
    سیگنال فروش: EMA کوتاه < EMA بلند + RSI > 70 (overbought)
    """
    
    def __init__(
        self,
        ema_short_period: int = 12,
        ema_long_period: int = 26,
        rsi_period: int = 14,
        rsi_overbought: float = 70.0,
        rsi_oversold: float = 30.0,
        min_confidence: float = 60.0
    ):
        """
        تنظیم پارامترهای استراتژی
        
        Args:
            ema_short_period: دوره EMA کوتاه‌مدت
            ema_long_period: دوره EMA بلندمدت
            rsi_period: دوره محاسبه RSI
            rsi_overbought: حد بالای RSI (فروش‌فروشی)
            rsi_oversold: حد پایین RSI (خریدفروشی)
            min_confidence: حداقل اطمینان برای سیگنال
        """
        self.ema_short_period = ema_short_period
        self.ema_long_period = ema_long_period
        self.rsi_period = rsi_period
        self.rsi_overbought = rsi_overbought
        self.rsi_oversold = rsi_oversold
        self.min_confidence = min_confidence
        
        # حافظه داده‌های قیمتی
        self.price_history: List[float] = []
        self.max_history_length = max(ema_long_period, rsi_period) * 3
    
    def add_price_data(self, prices: List[float]):
        """
        افزودن داده‌های قیمتی جدید
        
        Args:
            prices: لیست قیمت‌های جدید
        """
        self.price_history.extend(prices)
        
        # محدود کردن تاریخچه
        if len(self.price_history) > self.max_history_length:
            self.price_history = self.price_history[-self.max_history_length:]
    
    def calculate_ema(self, prices: List[float], period: int) -> List[float]:
        """
        محاسبه میانگین متحرک نمایی (EMA)
        
        Args:
            prices: قیمت‌ها
            period: دوره محاسبه
            
        Returns:
            List[float]: مقادیر EMA
        """
        if len(prices) < period:
            return [0] * len(prices)
        
        df = pd.DataFrame({'price': prices})
        ema = df['price'].ewm(span=period, adjust=False).mean()
        return ema.tolist()
    
    def calculate_rsi(self, prices: List[float], period: int = 14) -> List[float]:
        """
        محاسبه شاخص قدرت نسبی (RSI)
        
        Args:
            prices: قیمت‌ها
            period: دوره محاسبه
            
        Returns:
            List[float]: مقادیر RSI
        """
        if len(prices) < period + 1:
            return [50.0] * len(prices)  # مقدار خنثی
        
        # محاسبه تغییرات قیمت
        deltas = np.diff(prices)
        
        # جداسازی سود و زیان
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        # میانگین سود و زیان
        avg_gains = pd.Series(gains).rolling(window=period, min_periods=1).mean()
        avg_losses = pd.Series(losses).rolling(window=period, min_periods=1).mean()
        
        # محاسبه RS و RSI
        rs = avg_gains / avg_losses
        rsi = 100 - (100 / (1 + rs))
        
        # اضافه کردن مقدار اول (RSI برای اولین قیمت تعریف نیست)
        rsi = np.concatenate([[50.0], rsi.values])
        
        return rsi.tolist()
    
    def calculate_indicators(
        self, 
        prices: List[float]
    ) -> Tuple[List[float], List[float], List[float]]:
        """
        محاسبه همه شاخص‌های تکنیکال
        
        Args:
            prices: قیمت‌ها
            
        Returns:
            Tuple: (EMA کوتاه, EMA بلند, RSI)
        """
        ema_short = self.calculate_ema(prices, self.ema_short_period)
        ema_long = self.calculate_ema(prices, self.ema_long_period)
        rsi = self.calculate_rsi(prices, self.rsi_period)
        
        return ema_short, ema_long, rsi
    
    def generate_signal(
        self, 
        current_price: float,
        symbol: str,
        exchange: str
    ) -> TradingSignal:
        """
        تولید سیگنال معاملاتی
        
        Args:
            current_price: قیمت فعلی
            symbol: نماد معاملاتی
            exchange: نام صرافی
            
        Returns:
            TradingSignal: سیگنال تولید شده
        """
        # افزودن قیمت جدید
        self.price_history.append(current_price)
        
        # بررسی حداقل داده مورد نیاز
        if len(self.price_history) < max(self.ema_long_period, self.rsi_period) + 1:
            return self._create_hold_signal(current_price, symbol, exchange, "Insufficient data")
        
        # محاسبه شاخص‌ها
        ema_short, ema_long, rsi = self.calculate_indicators(self.price_history)
        
        # مقادیر فعلی شاخص‌ها
        current_ema_short = ema_short[-1]
        current_ema_long = ema_long[-1]
        current_rsi = rsi[-1]
        
        # تشکیل indicators object
        indicators = TechnicalIndicators(
            ema_short=current_ema_short,
            ema_long=current_ema_long,
            rsi=current_rsi,
            timestamp=datetime.now()
        )
        
        # تولید سیگنال
        signal_type, strength, confidence, message = self._analyze_signals(
            current_ema_short, 
            current_ema_long, 
            current_rsi,
            ema_short,
            ema_long,
            rsi
        )
        
        return TradingSignal(
            symbol=symbol,
            exchange=exchange,
            signal_type=TradeType(signal_type.value) if signal_type != SignalType.HOLD else TradeType.BUY,
            strength=strength,
            price=current_price,
            indicators=indicators,
            confidence=confidence,
            message=message,
            timestamp=datetime.now()
        )
    
    def _analyze_signals(
        self,
        ema_short: float,
        ema_long: float, 
        rsi: float,
        ema_short_history: List[float],
        ema_long_history: List[float],
        rsi_history: List[float]
    ) -> Tuple[SignalType, SignalStrength, float, str]:
        """
        تحلیل سیگنال‌ها و تعیین نوع معامله
        
        Args:
            ema_short: EMA کوتاه فعلی
            ema_long: EMA بلند فعلی
            rsi: RSI فعلی
            ema_short_history: تاریخچه EMA کوتاه
            ema_long_history: تاریخچه EMA بلند
            rsi_history: تاریخچه RSI
            
        Returns:
            Tuple: (نوع سیگنال, قدرت, اطمینان, پیام)
        """
        confidence = 0.0
        message_parts = []
        
        # بررسی سیگنال خرید
        ema_bullish = ema_short > ema_long
        rsi_oversold = rsi < self.rsi_oversold
        
        # بررسی سیگنال فروش
        ema_bearish = ema_short < ema_long
        rsi_overbought = rsi > self.rsi_overbought
        
        # محاسبه قدرت سیگنال EMA (بر اساس فاصله)
        ema_diff_percent = abs(ema_short - ema_long) / ema_long * 100 if ema_long > 0 else 0
        
        # محاسبه قدرت سیگنال RSI (بر اساس فاصله از حد)
        rsi_extreme_strength = 0
        if rsi_oversold:
            rsi_extreme_strength = (self.rsi_oversold - rsi) / self.rsi_oversold * 100
        elif rsi_overbought:
            rsi_extreme_strength = (rsi - self.rsi_overbought) / (100 - self.rsi_overbought) * 100
        
        # بررسی تایید crossover
        crossover_confirmed = False
        if len(ema_short_history) >= 3 and len(ema_long_history) >= 3:
            # بررسی تغییر جهت EMA در ۳ کندل اخیر
            prev_ema_short = ema_short_history[-2]
            prev_ema_long = ema_long_history[-2]
            
            # Golden Cross (صعودی)
            if (prev_ema_short <= prev_ema_long) and (ema_short > ema_long):
                crossover_confirmed = True
                confidence += 25
                message_parts.append("EMA Golden Cross")
            
            # Death Cross (نزولی)
            elif (prev_ema_short >= prev_ema_long) and (ema_short < ema_long):
                crossover_confirmed = True
                confidence += 25
                message_parts.append("EMA Death Cross")
        
        # تعیین سیگنال خرید
        if ema_bullish and rsi_oversold:
            signal_type = SignalType.BUY
            confidence += 40  # سیگنال اصلی
            confidence += min(ema_diff_percent * 2, 20)  # قدرت EMA
            confidence += min(rsi_extreme_strength, 15)  # قدرت RSI
            
            message_parts.extend([
                f"EMA Bullish ({ema_short:.2f} > {ema_long:.2f})",
                f"RSI Oversold ({rsi:.1f})"
            ])
        
        # تعیین سیگنال فروش
        elif ema_bearish and rsi_overbought:
            signal_type = SignalType.SELL
            confidence += 40  # سیگنال اصلی
            confidence += min(ema_diff_percent * 2, 20)  # قدرت EMA
            confidence += min(rsi_extreme_strength, 15)  # قدرت RSI
            
            message_parts.extend([
                f"EMA Bearish ({ema_short:.2f} < {ema_long:.2f})",
                f"RSI Overbought ({rsi:.1f})"
            ])
        
        # سیگنال‌های ضعیف‌تر
        elif ema_bullish and rsi < 50:
            signal_type = SignalType.BUY
            confidence += 20
            message_parts.extend([
                f"EMA Bullish ({ema_short:.2f} > {ema_long:.2f})",
                f"RSI Neutral-Low ({rsi:.1f})"
            ])
        
        elif ema_bearish and rsi > 50:
            signal_type = SignalType.SELL
            confidence += 20
            message_parts.extend([
                f"EMA Bearish ({ema_short:.2f} < {ema_long:.2f})",
                f"RSI Neutral-High ({rsi:.1f})"
            ])
        
        else:
            signal_type = SignalType.HOLD
            confidence = 30
            message_parts.append(
                f"Mixed Signals - EMA: {ema_short:.2f}/{ema_long:.2f}, RSI: {rsi:.1f}"
            )
        
        # تعیین قدرت سیگنال
        if confidence >= 80:
            strength = SignalStrength.STRONG
        elif confidence >= 60:
            strength = SignalStrength.MODERATE
        else:
            strength = SignalStrength.WEAK
        
        # ترکیب پیام
        message = " + ".join(message_parts)
        
        return signal_type, strength, min(confidence, 100), message
    
    def _create_hold_signal(
        self, 
        price: float, 
        symbol: str, 
        exchange: str, 
        reason: str
    ) -> TradingSignal:
        """ایجاد سیگنال نگهداری"""
        return TradingSignal(
            symbol=symbol,
            exchange=exchange,
            signal_type=TradeType.BUY,  # Default value since HOLD is not in TradeType
            strength=SignalStrength.WEAK,
            price=price,
            indicators=TechnicalIndicators(
                ema_short=None,
                ema_long=None,
                rsi=None,
                timestamp=datetime.now()
            ),
            confidence=0,
            message=f"HOLD: {reason}",
            timestamp=datetime.now()
        )
    
    def backtest(
        self,
        historical_prices: List[Dict[str, Any]],
        initial_balance: float = 1000.0,
        trade_amount_percent: float = 10.0
    ) -> Dict[str, Any]:
        """
        بک‌تست استراتژی روی داده‌های تاریخی
        
        Args:
            historical_prices: داده‌های تاریخی قیمت
            initial_balance: موجودی اولیه
            trade_amount_percent: درصد موجودی برای هر معامله
            
        Returns:
            Dict: نتایج بک‌تست
        """
        balance = initial_balance
        position = 0  # موجودی ارز
        trades = []
        balance_history = []
        
        # استخراج قیمت‌های بسته شدن
        prices = [float(candle.get('close', 0)) for candle in historical_prices]
        
        # محاسبه شاخص‌ها برای همه داده‌ها
        ema_short, ema_long, rsi = self.calculate_indicators(prices)
        
        for i in range(max(self.ema_long_period, self.rsi_period), len(prices)):
            current_price = prices[i]
            current_ema_short = ema_short[i]
            current_ema_long = ema_long[i]
            current_rsi = rsi[i]
            
            # تولید سیگنال
            signal_type, strength, confidence, message = self._analyze_signals(
                current_ema_short,
                current_ema_long, 
                current_rsi,
                ema_short[:i+1],
                ema_long[:i+1],
                rsi[:i+1]
            )
            
            # اجرای معامله بر اساس سیگنال
            if signal_type == SignalType.BUY and confidence >= self.min_confidence and position == 0:
                # خرید
                trade_amount = balance * (trade_amount_percent / 100)
                if trade_amount > 0:
                    position = trade_amount / current_price
                    balance -= trade_amount
                    
                    trades.append({
                        "timestamp": historical_prices[i].get("timestamp", datetime.now()),
                        "type": "buy",
                        "price": current_price,
                        "amount": position,
                        "balance": balance,
                        "ema_short": current_ema_short,
                        "ema_long": current_ema_long,
                        "rsi": current_rsi,
                        "confidence": confidence
                    })
            
            elif signal_type == SignalType.SELL and confidence >= self.min_confidence and position > 0:
                # فروش
                trade_value = position * current_price
                balance += trade_value
                
                profit_loss = trade_value - (position * trades[-1]["price"] if trades else 0)
                
                trades.append({
                    "timestamp": historical_prices[i].get("timestamp", datetime.now()),
                    "type": "sell",
                    "price": current_price,
                    "amount": position,
                    "balance": balance,
                    "profit_loss": profit_loss,
                    "ema_short": current_ema_short,
                    "ema_long": current_ema_long,
                    "rsi": current_rsi,
                    "confidence": confidence
                })
                
                position = 0
            
            # ذخیره تاریخچه موجودی
            total_value = balance + (position * current_price)
            balance_history.append({
                "timestamp": historical_prices[i].get("timestamp", datetime.now()),
                "balance": balance,
                "position_value": position * current_price,
                "total_value": total_value
            })
        
        # محاسبه آمار
        final_balance = balance + (position * prices[-1])
        total_return = final_balance - initial_balance
        total_return_percent = (total_return / initial_balance) * 100
        
        buy_trades = [t for t in trades if t["type"] == "buy"]
        sell_trades = [t for t in trades if t["type"] == "sell"]
        
        winning_trades = len([t for t in sell_trades if t.get("profit_loss", 0) > 0])
        losing_trades = len([t for t in sell_trades if t.get("profit_loss", 0) <= 0])
        
        return {
            "initial_balance": initial_balance,
            "final_balance": final_balance,
            "total_return": total_return,
            "total_return_percent": total_return_percent,
            "total_trades": len(trades),
            "buy_trades": len(buy_trades),
            "sell_trades": len(sell_trades),
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": (winning_trades / len(sell_trades) * 100) if sell_trades else 0,
            "trades": trades,
            "balance_history": balance_history
        }