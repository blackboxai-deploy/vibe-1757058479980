/**
 * نمودار معاملاتی با نمایش EMA و RSI
 * Trading Chart with EMA and RSI indicators
 */
"use client";

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar, ReferenceLine 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TradingChartProps {
  exchange: string;
  pair: string;
  userId: string;
}

interface ChartDataPoint {
  time: string;
  price: number;
  ema_short: number;
  ema_long: number;
  rsi: number;
  volume: number;
}

interface SignalData {
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

export default function TradingChart({ exchange, pair, userId }: TradingChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentSignal, setCurrentSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTime, setIsRealTime] = useState(true);

  // تولید داده‌های نمونه برای نمایش
  const generateSampleData = (): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    let basePrice = 43000;
    
    for (let i = 0; i < 50; i++) {
      const time = new Date(Date.now() - (49 - i) * 60 * 60 * 1000).toLocaleTimeString('fa-IR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // تولید قیمت با تغییرات تصادفی
      const priceChange = (Math.random() - 0.5) * 1000;
      basePrice += priceChange;
      
      // محاسبه EMA (ساده‌سازی شده)
      const ema_short = basePrice + (Math.random() - 0.5) * 200;
      const ema_long = basePrice + (Math.random() - 0.5) * 400;
      
      // محاسبه RSI (بین 0 تا 100)
      const rsi = Math.max(0, Math.min(100, 50 + (Math.random() - 0.5) * 60));
      
      data.push({
        time,
        price: Math.round(basePrice),
        ema_short: Math.round(ema_short),
        ema_long: Math.round(ema_long),
        rsi: Math.round(rsi * 10) / 10,
        volume: Math.round(Math.random() * 100000)
      });
    }
    
    return data;
  };

  // تولید سیگنال نمونه
  const generateSampleSignal = (): SignalData => {
    const latestData = chartData[chartData.length - 1];
    const signalTypes: ('buy' | 'sell')[] = ['buy', 'sell'];
    const strengths: ('weak' | 'moderate' | 'strong')[] = ['weak', 'moderate', 'strong'];
    
    const signal_type = signalTypes[Math.floor(Math.random() * signalTypes.length)];
    const strength = strengths[Math.floor(Math.random() * strengths.length)];
    
    return {
      signal_type,
      strength,
      confidence: Math.round((Math.random() * 40 + 60) * 10) / 10,
      price: latestData?.price || 43000,
      indicators: {
        ema_short: latestData?.ema_short || 43200,
        ema_long: latestData?.ema_long || 42800,
        rsi: latestData?.rsi || 65
      },
      message: signal_type === 'buy' 
        ? `سیگنال خرید ${strength === 'strong' ? 'قوی' : strength === 'moderate' ? 'متوسط' : 'ضعیف'}: EMA Cross + RSI Oversold`
        : `سیگنال فروش ${strength === 'strong' ? 'قوی' : strength === 'moderate' ? 'متوسط' : 'ضعیف'}: EMA Cross + RSI Overbought`,
      timestamp: new Date().toISOString()
    };
  };

  useEffect(() => {
    // شبیه‌سازی بارگذاری داده‌ها
    setLoading(true);
    
    setTimeout(() => {
      const data = generateSampleData();
      setChartData(data);
      setCurrentSignal(generateSampleSignal());
      setLoading(false);
    }, 1500);
  }, [exchange, pair]);

  // به‌روزرسانی دوره‌ای داده‌ها در حالت Real-time
  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(() => {
      setChartData(prevData => {
        const newData = [...prevData];
        const lastData = newData[newData.length - 1];
        
        // اضافه کردن یک نقطه جدید
        const time = new Date().toLocaleTimeString('fa-IR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        const priceChange = (Math.random() - 0.5) * 500;
        const newPrice = lastData.price + priceChange;
        
        newData.push({
          time,
          price: Math.round(newPrice),
          ema_short: Math.round(newPrice + (Math.random() - 0.5) * 200),
          ema_long: Math.round(newPrice + (Math.random() - 0.5) * 400),
          rsi: Math.max(0, Math.min(100, lastData.rsi + (Math.random() - 0.5) * 10)),
          volume: Math.round(Math.random() * 100000)
        });
        
        // حداکثر 50 نقطه نگهداری کنیم
        return newData.slice(-50);
      });
      
      // تولید سیگنال جدید گاهی اوقات
      if (Math.random() < 0.3) { // 30% احتمال
        setCurrentSignal(generateSampleSignal());
      }
    }, 5000); // هر 5 ثانیه

    return () => clearInterval(interval);
  }, [isRealTime, chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{`زمان: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.name === 'RSI' ? entry.value.toFixed(1) : entry.value.toLocaleString('fa-IR')}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">بارگذاری داده‌های بازار...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400 mb-2">خطا در بارگذاری داده‌ها</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const latestPrice = chartData[chartData.length - 1]?.price || 0;
  const priceChange = chartData.length > 1 
    ? latestPrice - chartData[chartData.length - 2].price 
    : 0;
  const priceChangePercent = chartData.length > 1
    ? (priceChange / chartData[chartData.length - 2].price) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* هدر با قیمت فعلی و کنترل‌ها */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-2xl font-bold text-white">
              {latestPrice.toLocaleString('fa-IR')} USDT
            </h3>
            <div className="flex items-center space-x-2 text-sm">
              <span className={priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString('fa-IR')}
              </span>
              <span className={priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          {currentSignal && (
            <Badge 
              variant={currentSignal.signal_type === 'buy' ? 'default' : 'destructive'}
              className={`${
                currentSignal.signal_type === 'buy' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              } animate-pulse`}
            >
              {currentSignal.signal_type === 'buy' ? '📈 خرید' : '📉 فروش'} - 
              {currentSignal.confidence}% اطمینان
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={isRealTime ? "default" : "outline"}
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
            className="text-xs"
          >
            {isRealTime ? '⏸️ توقف' : '▶️ شروع'} Real-time
          </Button>
        </div>
      </div>

      {/* نمودار اصلی */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF" 
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(value) => value.toLocaleString('fa-IR')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* خط قیمت */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
              name="قیمت"
            />
            
            {/* EMA کوتاه‌مدت */}
            <Line 
              type="monotone" 
              dataKey="ema_short" 
              stroke="#10B981" 
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 5"
              name="EMA کوتاه (12)"
            />
            
            {/* EMA بلندمدت */}
            <Line 
              type="monotone" 
              dataKey="ema_long" 
              stroke="#F59E0B" 
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="10 5"
              name="EMA بلند (26)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* نمودار RSI */}
      <Card className="bg-slate-800/30 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">شاخص قدرت نسبی (RSI)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" hide />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#9CA3AF" 
                  fontSize={10}
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* خط‌های مرجع RSI */}
                <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="2 2" />
                <ReferenceLine y={50} stroke="#6B7280" strokeDasharray="1 1" />
                <ReferenceLine y={30} stroke="#10B981" strokeDasharray="2 2" />
                
                <Line 
                  type="monotone" 
                  dataKey="rsi" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={false}
                  name="RSI"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>فروش‌فروشی: 30</span>
            <span>خنثی: 50</span>
            <span>خریدفروشی: 70</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}