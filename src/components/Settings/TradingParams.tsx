/**
 * تنظیمات پارامترهای معاملاتی
 * Trading Parameters Configuration
 */
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TradingParamsProps {
  userId: string;
  exchange: string;
  pair: string;
}

interface TradingSettings {
  // EMA Settings
  emaShortPeriod: number;
  emaLongPeriod: number;
  
  // RSI Settings  
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  
  // Risk Management
  maxTradeAmount: number;
  tradeAmountPercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  
  // Timing
  minTimeBetweenTrades: number;
  
  // Auto Trading
  autoTradingEnabled: boolean;
  minConfidence: number;
}

const DEFAULT_SETTINGS: TradingSettings = {
  emaShortPeriod: 12,
  emaLongPeriod: 26,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  maxTradeAmount: 100,
  tradeAmountPercent: 2,
  stopLossPercent: 2,
  takeProfitPercent: 4,
  minTimeBetweenTrades: 300,
  autoTradingEnabled: false,
  minConfidence: 70
};

export default function TradingParams({ userId, exchange, pair }: TradingParamsProps) {
  const [settings, setSettings] = useState<TradingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const updateSetting = <K extends keyof TradingSettings>(key: K, value: TradingSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveResult(null);
    
    try {
      // شبیه‌سازی ذخیره در backend
      console.log('Saving trading parameters:', {
        userId,
        exchange,
        pair,
        settings
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      setSaveResult({
        success: true,
        message: 'تنظیمات معاملاتی با موفقیت ذخیره شد'
      });

    } catch (error) {
      setSaveResult({
        success: false,
        message: 'خطا در ذخیره تنظیمات'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setSaveResult(null);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <span>⚙️</span>
          <span>پارامترهای معاملاتی</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          تنظیم استراتژی EMA+RSI و مدیریت ریسک
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="indicators" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="indicators" className="text-slate-300 data-[state=active]:text-white">
              شاخص‌ها
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-slate-300 data-[state=active]:text-white">
              مدیریت ریسک
            </TabsTrigger>
            <TabsTrigger value="automation" className="text-slate-300 data-[state=active]:text-white">
              اتوماسیون
            </TabsTrigger>
          </TabsList>

          {/* تب شاخص‌های تکنیکال */}
          <TabsContent value="indicators" className="space-y-6">
            {/* تنظیمات EMA */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">📊 تنظیمات EMA</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">EMA کوتاه‌مدت</Label>
                  <Input
                    type="number"
                    value={settings.emaShortPeriod}
                    onChange={(e) => updateSetting('emaShortPeriod', parseInt(e.target.value) || 12)}
                    min={5}
                    max={50}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <div className="text-xs text-slate-400">پیش‌فرض: 12</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">EMA بلندمدت</Label>
                  <Input
                    type="number"
                    value={settings.emaLongPeriod}
                    onChange={(e) => updateSetting('emaLongPeriod', parseInt(e.target.value) || 26)}
                    min={10}
                    max={100}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <div className="text-xs text-slate-400">پیش‌فرض: 26</div>
                </div>
              </div>
            </div>

            {/* تنظیمات RSI */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">📈 تنظیمات RSI</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">دوره محاسبه RSI</Label>
                  <Input
                    type="number"
                    value={settings.rsiPeriod}
                    onChange={(e) => updateSetting('rsiPeriod', parseInt(e.target.value) || 14)}
                    min={7}
                    max={30}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <div className="text-xs text-slate-400">پیش‌فرض: 14</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-slate-300">حد خریدفروشی (Overbought)</Label>
                    <Slider
                      value={[settings.rsiOverbought]}
                      onValueChange={(value) => updateSetting('rsiOverbought', value[0])}
                      min={60}
                      max={90}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-white">
                      {settings.rsiOverbought}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-slate-300">حد فروش‌فروشی (Oversold)</Label>
                    <Slider
                      value={[settings.rsiOversold]}
                      onValueChange={(value) => updateSetting('rsiOversold', value[0])}
                      min={10}
                      max={40}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-white">
                      {settings.rsiOversold}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* تب مدیریت ریسک */}
          <TabsContent value="risk" className="space-y-6">
            <h3 className="text-lg font-semibold text-white">🛡️ مدیریت ریسک</h3>
            
            <div className="space-y-6">
              {/* مقدار معامله */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">حداکثر مقدار معامله (USDT)</Label>
                    <Input
                      type="number"
                      value={settings.maxTradeAmount}
                      onChange={(e) => updateSetting('maxTradeAmount', parseFloat(e.target.value) || 100)}
                      min={10}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">درصد از کل دارایی</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[settings.tradeAmountPercent]}
                        onValueChange={(value) => updateSetting('tradeAmountPercent', value[0])}
                        min={0.5}
                        max={10}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-white">
                        {settings.tradeAmountPercent}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-slate-300">Stop Loss (%)</Label>
                    <Slider
                      value={[settings.stopLossPercent]}
                      onValueChange={(value) => updateSetting('stopLossPercent', value[0])}
                      min={0.5}
                      max={10}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-red-400">
                      -{settings.stopLossPercent}%
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-slate-300">Take Profit (%)</Label>
                    <Slider
                      value={[settings.takeProfitPercent]}
                      onValueChange={(value) => updateSetting('takeProfitPercent', value[0])}
                      min={1}
                      max={20}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-green-400">
                      +{settings.takeProfitPercent}%
                    </div>
                  </div>
                </div>
              </div>

              {/* فاصله زمانی معاملات */}
              <div className="space-y-2">
                <Label className="text-slate-300">فاصله زمانی بین معاملات (ثانیه)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[settings.minTimeBetweenTrades]}
                    onValueChange={(value) => updateSetting('minTimeBetweenTrades', value[0])}
                    min={60}
                    max={3600}
                    step={60}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-white">
                    {Math.floor(settings.minTimeBetweenTrades / 60)} دقیقه
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* تب اتوماسیون */}
          <TabsContent value="automation" className="space-y-6">
            <h3 className="text-lg font-semibold text-white">🤖 معامله خودکار</h3>
            
            <div className="space-y-6">
              {/* فعال/غیرفعال کردن معامله خودکار */}
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="space-y-1">
                  <div className="text-white font-medium">معامله خودکار</div>
                  <div className="text-xs text-slate-400">
                    اجرای خودکار سیگنال‌های معاملاتی
                  </div>
                </div>
                <Switch
                  checked={settings.autoTradingEnabled}
                  onCheckedChange={(checked) => updateSetting('autoTradingEnabled', checked)}
                />
              </div>

              {/* حداقل اطمینان */}
              <div className="space-y-3">
                <Label className="text-slate-300">حداقل اطمینان برای اجرای خودکار (%)</Label>
                <Slider
                  value={[settings.minConfidence]}
                  onValueChange={(value) => updateSetting('minConfidence', value[0])}
                  min={50}
                  max={95}
                  step={1}
                  className="w-full"
                  disabled={!settings.autoTradingEnabled}
                />
                <div className="text-center text-sm text-white">
                  {settings.minConfidence}%
                </div>
                <div className="text-xs text-slate-400 text-center">
                  فقط سیگنال‌های بالای این درصد اجرا می‌شوند
                </div>
              </div>

              {/* هشدار امنیتی */}
              <Alert className="bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-300">
                  ⚠️ معامله خودکار ریسک دارد. ابتدا در حالت دستی تست کنید و مقادیر کم استفاده کنید.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        {/* نتیجه ذخیره */}
        {saveResult && (
          <Alert className={`mt-6 ${
            saveResult.success 
              ? 'bg-green-900/50 border-green-700' 
              : 'bg-red-900/50 border-red-700'
          }`}>
            <AlertDescription className={
              saveResult.success ? 'text-green-300' : 'text-red-300'
            }>
              {saveResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* دکمه‌های عمل */}
        <div className="flex space-x-2 mt-6">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            disabled={loading}
          >
            🔄 بازگشت به پیش‌فرض
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>ذخیره...</span>
              </div>
            ) : (
              '💾 ذخیره تنظیمات'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}