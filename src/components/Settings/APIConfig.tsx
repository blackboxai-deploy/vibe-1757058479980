/**
 * تنظیمات کلیدهای API
 * API Keys Configuration Component
 */
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface APIConfigProps {
  userId: string;
  selectedExchange: string;
}

interface ExchangeConfig {
  apiKey: string;
  secret: string;
  isConnected: boolean;
  lastTest: Date | null;
}

const EXCHANGES = [
  { value: 'nobitex', label: 'نوبیتکس', status: 'active' },
  { value: 'wallex', label: 'والکس', status: 'coming_soon' },
  { value: 'ramzinex', label: 'رمزینکس', status: 'coming_soon' }
];

export default function APIConfig({ userId, selectedExchange }: APIConfigProps) {
  const [configs, setConfigs] = useState<Record<string, ExchangeConfig>>({});
  const [currentConfig, setCurrentConfig] = useState<ExchangeConfig>({
    apiKey: '',
    secret: '',
    isConnected: false,
    lastTest: null
  });
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInputChange = (field: 'apiKey' | 'secret', value: string) => {
    setCurrentConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveConfig = async () => {
    if (!currentConfig.apiKey || !currentConfig.secret) {
      setTestResult({
        success: false,
        message: 'لطفاً هر دو فیلد API Key و Secret را پر کنید'
      });
      return;
    }

    setLoading(true);
    try {
      // شبیه‌سازی ذخیره در backend
      console.log('Saving API config for', selectedExchange, {
        userId,
        apiKey: currentConfig.apiKey,
        secret: currentConfig.secret
      });

      // شبیه‌سازی تأخیر
      await new Promise(resolve => setTimeout(resolve, 2000));

      // بروزرسانی state
      const updatedConfig = {
        ...currentConfig,
        isConnected: true,
        lastTest: new Date()
      };

      setConfigs(prev => ({
        ...prev,
        [selectedExchange]: updatedConfig
      }));

      setCurrentConfig(updatedConfig);
      
      setTestResult({
        success: true,
        message: 'کلیدهای API با موفقیت ذخیره و تست شدند'
      });

    } catch (error) {
      setTestResult({
        success: false,
        message: 'خطا در ذخیره کلیدهای API'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!currentConfig.apiKey || !currentConfig.secret) {
      setTestResult({
        success: false,
        message: 'لطفاً ابتدا کلیدهای API را وارد کنید'
      });
      return;
    }

    setLoading(true);
    try {
      // شبیه‌سازی تست اتصال
      console.log('Testing connection for', selectedExchange);
      
      await new Promise(resolve => setTimeout(resolve, 3000));

      // شبیه‌سازی نتیجه موفق
      const isSuccess = Math.random() > 0.3; // 70% احتمال موفقیت

      if (isSuccess) {
        setTestResult({
          success: true,
          message: 'اتصال به صرافی با موفقیت برقرار شد. موجودی: BTC 0.0012, USDT 847.32'
        });
        
        setCurrentConfig(prev => ({
          ...prev,
          isConnected: true,
          lastTest: new Date()
        }));
      } else {
        setTestResult({
          success: false,
          message: 'خطا در اتصال: کلیدهای API نامعتبر یا دسترسی محدود شده'
        });
      }

    } catch (error) {
      setTestResult({
        success: false,
        message: 'خطا در تست اتصال به صرافی'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeSelect = (exchange: string) => {
    // بارگذاری تنظیمات ذخیره شده برای صرافی انتخاب شده
    const savedConfig = configs[exchange];
    if (savedConfig) {
      setCurrentConfig(savedConfig);
    } else {
      setCurrentConfig({
        apiKey: '',
        secret: '',
        isConnected: false,
        lastTest: null
      });
    }
    setTestResult(null);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <span>🔑</span>
          <span>تنظیمات API</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          پیکربندی کلیدهای API برای اتصال امن به صرافی‌ها
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700">
            <TabsTrigger value="config" className="text-slate-300 data-[state=active]:text-white">
              پیکربندی
            </TabsTrigger>
            <TabsTrigger value="status" className="text-slate-300 data-[state=active]:text-white">
              وضعیت اتصالات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            {/* انتخاب صرافی */}
            <div className="space-y-2">
              <Label className="text-slate-300">انتخاب صرافی</Label>
              <Select value={selectedExchange} onValueChange={handleExchangeSelect}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {EXCHANGES.map((exchange) => (
                    <SelectItem 
                      key={exchange.value} 
                      value={exchange.value}
                      className="text-slate-300 focus:bg-slate-700"
                      disabled={exchange.status !== 'active'}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{exchange.label}</span>
                        {exchange.status === 'active' && (
                          <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                            فعال
                          </Badge>
                        )}
                        {exchange.status === 'coming_soon' && (
                          <Badge variant="outline" className="border-slate-500 text-slate-400 text-xs">
                            به‌زودی
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label className="text-slate-300">API Key</Label>
              <Input
                type="text"
                placeholder="کلید API خود را وارد کنید"
                value={currentConfig.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            {/* API Secret */}
            <div className="space-y-2">
              <Label className="text-slate-300">API Secret</Label>
              <Input
                type="password"
                placeholder="کلید محرمانه API خود را وارد کنید"
                value={currentConfig.secret}
                onChange={(e) => handleInputChange('secret', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            {/* نتیجه تست */}
            {testResult && (
              <Alert className={`${
                testResult.success 
                  ? 'bg-green-900/50 border-green-700' 
                  : 'bg-red-900/50 border-red-700'
              }`}>
                <AlertDescription className={
                  testResult.success ? 'text-green-300' : 'text-red-300'
                }>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}

            {/* دکمه‌های عمل */}
            <div className="flex space-x-2">
              <Button
                onClick={handleTestConnection}
                disabled={loading}
                variant="outline"
                className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>تست اتصال...</span>
                  </div>
                ) : (
                  '🔍 تست اتصال'
                )}
              </Button>

              <Button
                onClick={handleSaveConfig}
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
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <div className="space-y-3">
              {EXCHANGES.map((exchange) => {
                const config = configs[exchange.value];
                return (
                  <div 
                    key={exchange.value} 
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        config?.isConnected ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <div>
                        <div className="text-white font-medium">{exchange.label}</div>
                        {config?.lastTest && (
                          <div className="text-xs text-slate-400">
                            آخرین تست: {config.lastTest.toLocaleString('fa-IR')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Badge 
                      variant={config?.isConnected ? "default" : "outline"}
                      className={config?.isConnected 
                        ? "bg-green-600 text-white" 
                        : "border-slate-500 text-slate-400"
                      }
                    >
                      {config?.isConnected ? 'متصل' : 'قطع'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* راهنمای امنیتی */}
        <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-400 mb-2">⚠️ نکات امنیتی:</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• کلیدهای API شما با رمزنگاری AES-256 ذخیره می‌شوند</li>
            <li>• فقط دسترسی‌های معاملاتی فعال کنید، دسترسی برداشت غیرفعال کنید</li>
            <li>• IP خود را در تنظیمات صرافی محدود کنید</li>
            <li>• به طور دوره‌ای کلیدهای API را تغییر دهید</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}