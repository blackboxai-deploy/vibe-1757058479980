/**
 * صفحه اصلی ربات ترید - داشبورد معاملاتی
 * Main Trading Bot Dashboard
 */
"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TradingChart from '@/components/Dashboard/TradingChart';
import SignalPanel from '@/components/Dashboard/SignalPanel';
import ExchangeSelector from '@/components/Dashboard/ExchangeSelector';
import APIConfig from '@/components/Settings/APIConfig';
import TradingParams from '@/components/Settings/TradingParams';
import BacktestForm from '@/components/Backtest/BacktestForm';
import ResultsChart from '@/components/Backtest/ResultsChart';

export default function TradingDashboard() {
  const [selectedExchange, setSelectedExchange] = useState<string>('nobitex');
  const [selectedPair, setSelectedPair] = useState<string>('BTC/USDT');
  const [userId, setUserId] = useState<string>('user123'); // در پروژه واقعی از authentication استفاده کنید

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                🚀 ربات ترید حرفه‌ای
              </h1>
              <p className="text-slate-400">
                معاملات خودکار در صرافی‌های ایرانی با الگوریتم EMA+RSI
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <ExchangeSelector
                selectedExchange={selectedExchange}
                selectedPair={selectedPair}
                onExchangeChange={setSelectedExchange}
                onPairChange={setSelectedPair}
              />
              
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-300">آنلاین</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger 
              value="dashboard" 
              className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700"
            >
              📊 داشبورد
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700"
            >
              ⚙️ تنظیمات
            </TabsTrigger>
            <TabsTrigger 
              value="backtest" 
              className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700"
            >
              📈 بک‌تست
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700"
            >
              📋 تاریخچه
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* نمودار قیمت - 3/4 عرض */}
              <div className="xl:col-span-3">
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader className="border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">
                          نمودار قیمت {selectedPair}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          تحلیل تکنیکال با EMA و RSI
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-300">
                        <span>صرافی:</span>
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs font-medium">
                          {selectedExchange}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TradingChart 
                      exchange={selectedExchange}
                      pair={selectedPair}
                      userId={userId}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* پنل سیگنال - 1/4 عرض */}
              <div className="xl:col-span-1">
                <SignalPanel 
                  exchange={selectedExchange}
                  pair={selectedPair}
                  userId={userId}
                />
              </div>
            </div>

            {/* آمار و اطلاعات تکمیلی */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">💰 موجودی</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">BTC</span>
                      <span className="text-white font-medium">0.00125</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">USDT</span>
                      <span className="text-white font-medium">847.32</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">IRT</span>
                      <span className="text-white font-medium">12,450,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">📊 آمار امروز</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">سیگنال‌ها</span>
                      <span className="text-green-400 font-medium">7 خرید</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">معاملات</span>
                      <span className="text-blue-400 font-medium">3 اجرا شده</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">سود/زیان</span>
                      <span className="text-green-400 font-medium">+2.4%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">🔥 بازار داغ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">ETH/USDT</span>
                      <span className="text-green-400 font-medium">+5.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">BNB/USDT</span>
                      <span className="text-green-400 font-medium">+3.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">ADA/USDT</span>
                      <span className="text-red-400 font-medium">-1.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <APIConfig 
                userId={userId}
                selectedExchange={selectedExchange}
              />
              <TradingParams 
                userId={userId}
                exchange={selectedExchange}
                pair={selectedPair}
              />
            </div>
          </TabsContent>

          {/* Backtest Tab */}
          <TabsContent value="backtest" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1">
                <BacktestForm 
                  exchange={selectedExchange}
                  pair={selectedPair}
                />
              </div>
              <div className="xl:col-span-2">
                <ResultsChart />
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">📋 تاریخچه معاملات</CardTitle>
                <CardDescription className="text-slate-400">
                  آخرین معاملات انجام شده
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">📊</div>
                  <p>هنوز معامله‌ای انجام نشده است</p>
                  <p className="text-sm mt-2">
                    پس از اولین معامله، تاریخچه اینجا نمایش داده می‌شود
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}