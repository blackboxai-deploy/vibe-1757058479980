/**
 * فرم بک‌تست استراتژی معاملاتی
 * Backtest Strategy Form
 */
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BacktestFormProps {
  exchange: string;
  pair: string;
}

interface BacktestParams {
  timeframe: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  tradeAmountPercent: number;
  
  // Strategy Parameters
  emaShortPeriod: number;
  emaLongPeriod: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
}

interface BacktestResult {
  success: boolean;
  totalReturn: number;
  totalReturnPercent: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

const TIMEFRAMES = [
  { value: '1h', label: '1 ساعت' },
  { value: '4h', label: '4 ساعت' },
  { value: '1d', label: '1 روز' },
  { value: '1w', label: '1 هفته' }
];

export default function BacktestForm({ exchange, pair }: BacktestFormProps) {
  const [params, setParams] = useState<BacktestParams>({
    timeframe: '1h',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    initialBalance: 1000,
    tradeAmountPercent: 10,
    emaShortPeriod: 12,
    emaLongPeriod: 26,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const updateParam = <K extends keyof BacktestParams>(key: K, value: BacktestParams[K]) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const runBacktest = async () => {
    setLoading(true);
    setResult(null);

    try {
      // شبیه‌سازی اجرای بک‌تست
      console.log('Running backtest with params:', {
        exchange,
        pair,
        ...params
      });

      // شبیه‌سازی تأخیر پردازش
      await new Promise(resolve => setTimeout(resolve, 3000));

      // تولید نتایج نمونه
      const mockResult: BacktestResult = {
        success: true,
        totalReturn: Math.random() * 400 - 100, // بین -100 تا +300
        totalReturnPercent: Math.random() * 40 - 10, // بین -10% تا +30%
        totalTrades: Math.floor(Math.random() * 50) + 20, // بین 20 تا 70
        winRate: Math.random() * 40 + 50, // بین 50% تا 90%
        maxDrawdown: Math.random() * -15, // بین 0 تا -15%
        sharpeRatio: Math.random() * 2 + 0.5 // بین 0.5 تا 2.5
      };

      setResult(mockResult);

    } catch (error) {
      console.error('Backtest failed:', error);
      setResult({
        success: false,
        totalReturn: 0,
        totalReturnPercent: 0,
        totalTrades: 0,
        winRate: 0,
        maxDrawdown: 0,
        sharpeRatio: 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm h-fit">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <span>📈</span>
          <span>تنظیمات بک‌تست</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          آزمایش استراتژی روی داده‌های تاریخی
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* تنظیمات زمانی */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">⏰ بازه زمانی</h3>
          
          <div className="space-y-2">
            <Label className="text-slate-300">تایم فریم</Label>
            <Select value={params.timeframe} onValueChange={(value) => updateParam('timeframe', value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {TIMEFRAMES.map((tf) => (
                  <SelectItem 
                    key={tf.value} 
                    value={tf.value}
                    className="text-slate-300 focus:bg-slate-700"
                  >
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300">تاریخ شروع</Label>
              <Input
                type="date"
                value={params.startDate}
                onChange={(e) => updateParam('startDate', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">تاریخ پایان</Label>
              <Input
                type="date"
                value={params.endDate}
                onChange={(e) => updateParam('endDate', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* تنظیمات مالی */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">💰 تنظیمات مالی</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300">موجودی اولیه (USDT)</Label>
              <Input
                type="number"
                value={params.initialBalance}
                onChange={(e) => updateParam('initialBalance', parseFloat(e.target.value) || 1000)}
                min={100}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-slate-300">درصد هر معامله (%)</Label>
              <Slider
                value={[params.tradeAmountPercent]}
                onValueChange={(value) => updateParam('tradeAmountPercent', value[0])}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="text-center text-xs text-white">
                {params.tradeAmountPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* پارامترهای استراتژی */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">⚙️ پارامترهای استراتژی</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300">EMA کوتاه</Label>
              <Input
                type="number"
                value={params.emaShortPeriod}
                onChange={(e) => updateParam('emaShortPeriod', parseInt(e.target.value) || 12)}
                min={5}
                max={50}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">EMA بلند</Label>
              <Input
                type="number"
                value={params.emaLongPeriod}
                onChange={(e) => updateParam('emaLongPeriod', parseInt(e.target.value) || 26)}
                min={10}
                max={100}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300">RSI Period</Label>
              <Input
                type="number"
                value={params.rsiPeriod}
                onChange={(e) => updateParam('rsiPeriod', parseInt(e.target.value) || 14)}
                min={7}
                max={30}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">RSI خریدفروشی</Label>
              <Input
                type="number"
                value={params.rsiOverbought}
                onChange={(e) => updateParam('rsiOverbought', parseInt(e.target.value) || 70)}
                min={60}
                max={90}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">RSI فروش‌فروشی</Label>
              <Input
                type="number"
                value={params.rsiOversold}
                onChange={(e) => updateParam('rsiOversold', parseInt(e.target.value) || 30)}
                min={10}
                max={40}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* دکمه اجرای بک‌تست */}
        <Button
          onClick={runBacktest}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>در حال اجرای بک‌تست...</span>
            </div>
          ) : (
            '🚀 اجرای بک‌تست'
          )}
        </Button>

        {/* نمایش نتایج خلاصه */}
        {result && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">📊 نتایج خلاصه</h3>
            
            {result.success ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-700/50 p-3 rounded">
                  <div className="text-slate-400">بازده کل</div>
                  <div className={`font-semibold ${
                    result.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.totalReturnPercent.toFixed(2)}%
                  </div>
                </div>
                
                <div className="bg-slate-700/50 p-3 rounded">
                  <div className="text-slate-400">نرخ برد</div>
                  <div className="font-semibold text-blue-400">
                    {result.winRate.toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-slate-700/50 p-3 rounded">
                  <div className="text-slate-400">کل معاملات</div>
                  <div className="font-semibold text-white">
                    {result.totalTrades}
                  </div>
                </div>
                
                <div className="bg-slate-700/50 p-3 rounded">
                  <div className="text-slate-400">Max Drawdown</div>
                  <div className="font-semibold text-red-400">
                    {result.maxDrawdown.toFixed(2)}%
                  </div>
                </div>
              </div>
            ) : (
              <Alert className="bg-red-900/50 border-red-700">
                <AlertDescription className="text-red-300">
                  خطا در اجرای بک‌تست. لطفاً مجدداً تلاش کنید.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}