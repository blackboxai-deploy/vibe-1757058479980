/**
 * پنل سیگنال‌های معاملاتی
 * Trading Signals Panel
 */
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SignalPanelProps {
  exchange: string;
  pair: string;
  userId: string;
}

interface TradingSignal {
  signal_type: 'buy' | 'sell';
  strength: 'weak' | 'moderate' | 'strong';
  confidence: number;
  price: number;
  indicators: {
    ema_short: number;
    ema_long: number;
    rsi: number;
  };
  message: string;
  timestamp: string;
}

interface MarketData {
  price: number;
  change_24h: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
}

export default function SignalPanel({ exchange, pair, userId }: SignalPanelProps) {
  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // تولید داده‌های نمونه
  const generateSampleSignal = (): TradingSignal => {
    const signalTypes: ('buy' | 'sell')[] = ['buy', 'sell'];
    const strengths: ('weak' | 'moderate' | 'strong')[] = ['weak', 'moderate', 'strong'];
    
    const signal_type = signalTypes[Math.floor(Math.random() * signalTypes.length)];
    const strength = strengths[Math.floor(Math.random() * strengths.length)];
    const confidence = Math.round((Math.random() * 40 + 60) * 10) / 10;
    
    return {
      signal_type,
      strength,
      confidence,
      price: 43000 + (Math.random() - 0.5) * 2000,
      indicators: {
        ema_short: 43200 + (Math.random() - 0.5) * 300,
        ema_long: 42800 + (Math.random() - 0.5) * 500,
        rsi: Math.round((Math.random() * 80 + 10) * 10) / 10
      },
      message: signal_type === 'buy' 
        ? `سیگنال خرید ${strength === 'strong' ? 'قوی' : strength === 'moderate' ? 'متوسط' : 'ضعیف'}: EMA Cross + RSI ${Math.round(Math.random() * 30 + 10)}`
        : `سیگنال فروش ${strength === 'strong' ? 'قوی' : strength === 'moderate' ? 'متوسط' : 'ضعیف'}: EMA Cross + RSI ${Math.round(Math.random() * 30 + 70)}`,
      timestamp: new Date().toISOString()
    };
  };

  const generateMarketData = (): MarketData => {
    const basePrice = 43000;
    const change = (Math.random() - 0.5) * 10;
    
    return {
      price: basePrice + (Math.random() - 0.5) * 2000,
      change_24h: change,
      volume_24h: Math.round(Math.random() * 10000000),
      high_24h: basePrice + Math.random() * 1500,
      low_24h: basePrice - Math.random() * 1500
    };
  };

  useEffect(() => {
    // بارگذاری اولیه
    setLoading(true);
    setTimeout(() => {
      setCurrentSignal(generateSampleSignal());
      setMarketData(generateMarketData());
      setLastUpdate(new Date());
      setLoading(false);
    }, 1000);

    // به‌روزرسانی دوره‌ای
    const interval = setInterval(() => {
      setCurrentSignal(generateSampleSignal());
      setMarketData(generateMarketData());
      setLastUpdate(new Date());
    }, 10000); // هر 10 ثانیه

    return () => clearInterval(interval);
  }, [exchange, pair, userId]);

  const getSignalColor = (signal: TradingSignal) => {
    if (signal.signal_type === 'buy') {
      return signal.strength === 'strong' ? 'text-green-400' :
             signal.strength === 'moderate' ? 'text-green-300' : 'text-green-200';
    } else {
      return signal.strength === 'strong' ? 'text-red-400' :
             signal.strength === 'moderate' ? 'text-red-300' : 'text-red-200';
    }
  };

  const getSignalBadgeColor = (signal: TradingSignal) => {
    if (signal.signal_type === 'buy') {
      return signal.strength === 'strong' ? 'bg-green-600' :
             signal.strength === 'moderate' ? 'bg-green-500' : 'bg-green-400';
    } else {
      return signal.strength === 'strong' ? 'bg-red-600' :
             signal.strength === 'moderate' ? 'bg-red-500' : 'bg-red-400';
    }
  };

  const handleExecuteTrade = async () => {
    if (!currentSignal) return;
    
    // شبیه‌سازی اجرای معامله
    console.log('Executing trade:', currentSignal);
    // در پروژه واقعی اینجا API call می‌شود
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">⚡ سیگنال‌های معاملاتی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* کارت سیگنال اصلی */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">⚡ سیگنال فعلی</CardTitle>
              <CardDescription className="text-slate-400">
                آخرین به‌روزرسانی: {lastUpdate.toLocaleTimeString('fa-IR')}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">زنده</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {currentSignal ? (
            <div className="space-y-4">
              {/* سیگنال اصلی */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getSignalColor(currentSignal)} mb-2`}>
                  {currentSignal.signal_type === 'buy' ? '📈' : '📉'}
                </div>
                <Badge 
                  className={`${getSignalBadgeColor(currentSignal)} text-white px-4 py-2 text-sm`}
                >
                  {currentSignal.signal_type === 'buy' ? 'خرید' : 'فروش'} - 
                  {currentSignal.strength === 'strong' ? 'قوی' : 
                   currentSignal.strength === 'moderate' ? 'متوسط' : 'ضعیف'}
                </Badge>
                <div className="mt-2">
                  <span className="text-lg font-semibold text-white">
                    {currentSignal.confidence}% اطمینان
                  </span>
                </div>
              </div>

              {/* اطلاعات قیمت */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-center mb-3">
                  <div className="text-xl font-bold text-white">
                    {Math.round(currentSignal.price).toLocaleString('fa-IR')} USDT
                  </div>
                  <div className="text-sm text-slate-400">قیمت پیشنهادی معامله</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-slate-400">EMA کوتاه</div>
                    <div className="text-green-400 font-medium">
                      {Math.round(currentSignal.indicators.ema_short).toLocaleString('fa-IR')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">EMA بلند</div>
                    <div className="text-yellow-400 font-medium">
                      {Math.round(currentSignal.indicators.ema_long).toLocaleString('fa-IR')}
                    </div>
                  </div>
                  <div className="text-center col-span-2">
                    <div className="text-slate-400">RSI</div>
                    <div className="text-purple-400 font-medium text-lg">
                      {currentSignal.indicators.rsi.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* پیام سیگنال */}
              <Alert className="bg-slate-700/50 border-slate-600">
                <AlertDescription className="text-slate-300 text-sm">
                  {currentSignal.message}
                </AlertDescription>
              </Alert>

              {/* دکمه‌های عمل */}
              <div className="space-y-2">
                <Button 
                  onClick={handleExecuteTrade}
                  className={`w-full ${
                    currentSignal.signal_type === 'buy' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  disabled={currentSignal.confidence < 60}
                >
                  {currentSignal.signal_type === 'buy' ? '💰 اجرای خرید' : '💸 اجرای فروش'}
                </Button>
                
                {currentSignal.confidence < 60 && (
                  <p className="text-xs text-slate-400 text-center">
                    اطمینان کمتر از 60% - معامله غیرفعال
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">🔍</div>
              <p>در حال تحلیل بازار...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* اطلاعات بازار */}
      {marketData && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-lg">📊 اطلاعات بازار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">قیمت فعلی</span>
                <span className="text-white font-medium">
                  {Math.round(marketData.price).toLocaleString('fa-IR')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">تغییر 24 ساعت</span>
                <span className={`font-medium ${
                  marketData.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {marketData.change_24h >= 0 ? '+' : ''}{marketData.change_24h.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">بالاترین 24h</span>
                <span className="text-white font-medium">
                  {Math.round(marketData.high_24h).toLocaleString('fa-IR')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">پایین‌ترین 24h</span>
                <span className="text-white font-medium">
                  {Math.round(marketData.low_24h).toLocaleString('fa-IR')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">حجم 24h</span>
                <span className="text-white font-medium">
                  {(marketData.volume_24h / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* تنظیمات سریع */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">🎛️ کنترل سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">معامله خودکار</span>
              <Button
                variant={isAutoTrading ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAutoTrading(!isAutoTrading)}
                className="text-xs"
              >
                {isAutoTrading ? '🟢 فعال' : '🔴 غیرفعال'}
              </Button>
            </div>
            
            <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700">
              آخرین سیگنال: {new Date(currentSignal?.timestamp || '').toLocaleTimeString('fa-IR')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}