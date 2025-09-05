/**
 * نمودار نتایج بک‌تست
 * Backtest Results Chart
 */
"use client";

import { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Area, AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Trade {
  timestamp: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  profit: number;
}

interface PerformanceData {
  date: string;
  balance: number;
  trades: number;
  profitLoss: number;
  drawdown: number;
}

const SAMPLE_TRADES: Trade[] = [
  { timestamp: '2024-01-01 10:00', type: 'buy', price: 42500, amount: 0.023, profit: 0 },
  { timestamp: '2024-01-01 14:30', type: 'sell', price: 43200, amount: 0.023, profit: 16.1 },
  { timestamp: '2024-01-02 09:15', type: 'buy', price: 43800, amount: 0.024, profit: 0 },
  { timestamp: '2024-01-02 16:45', type: 'sell', price: 43100, amount: 0.024, profit: -16.8 },
  { timestamp: '2024-01-03 11:20', type: 'buy', price: 44200, amount: 0.022, profit: 0 },
  { timestamp: '2024-01-03 18:00', type: 'sell', price: 45100, amount: 0.022, profit: 19.8 },
  // ... more trades
];

const generatePerformanceData = (): PerformanceData[] => {
  const data: PerformanceData[] = [];
  let balance = 1000;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const dailyReturn = (Math.random() - 0.45) * 50; // Slight positive bias
    const trades = Math.floor(Math.random() * 4);
    
    balance += dailyReturn;
    
    data.push({
      date: date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
      balance: Math.round(balance * 100) / 100,
      trades,
      profitLoss: dailyReturn,
      drawdown: balance < 1000 ? ((balance - 1000) / 1000) * 100 : 0
    });
  }
  
  return data;
};

export default function ResultsChart() {
  const [performanceData] = useState<PerformanceData[]>(generatePerformanceData());
  
  // محاسبه آمار کلی
  const totalReturn = performanceData[performanceData.length - 1]?.balance - 1000 || 0;
  const totalReturnPercent = (totalReturn / 1000) * 100;
  const totalTrades = SAMPLE_TRADES.length;
  const winningTrades = SAMPLE_TRADES.filter(t => t.profit > 0).length;
  const winRate = (winningTrades / totalTrades) * 100;
  const maxDrawdown = Math.min(...performanceData.map(d => d.drawdown));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{`تاریخ: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.name.includes('%') ? entry.value.toFixed(2) + '%' : entry.value.toLocaleString('fa-IR')}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* آمار کلی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
              </div>
              <div className="text-xs text-slate-400">بازده کل</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400">نرخ برد</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {totalTrades}
              </div>
              <div className="text-xs text-slate-400">کل معاملات</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {maxDrawdown.toFixed(2)}%
              </div>
              <div className="text-xs text-slate-400">Max Drawdown</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نمودارها */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">📈 تحلیل عملکرد</CardTitle>
          <CardDescription className="text-slate-400">
            نتایج تفصیلی بک‌تست استراتژی
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="balance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700">
              <TabsTrigger value="balance" className="text-slate-300 data-[state=active]:text-white">
                رشد موجودی
              </TabsTrigger>
              <TabsTrigger value="drawdown" className="text-slate-300 data-[state=active]:text-white">
                Drawdown
              </TabsTrigger>
              <TabsTrigger value="trades" className="text-slate-300 data-[state=active]:text-white">
                معاملات روزانه
              </TabsTrigger>
            </TabsList>

            <TabsContent value="balance" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => `${value} USDT`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="drawdown" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Area 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="#EF4444" 
                      fill="#EF4444"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="trades" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Bar 
                      dataKey="trades" 
                      fill="#8B5CF6"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* جدول معاملات */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">📋 آخرین معاملات</CardTitle>
          <CardDescription className="text-slate-400">
            لیست معاملات انجام شده در بک‌تست
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {SAMPLE_TRADES.slice(0, 10).map((trade, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={trade.type === 'buy' ? 'default' : 'destructive'}
                    className={trade.type === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                  >
                    {trade.type === 'buy' ? 'خرید' : 'فروش'}
                  </Badge>
                  
                  <div className="text-sm">
                    <div className="text-white">
                      {trade.amount} BTC @ {trade.price.toLocaleString('fa-IR')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {trade.timestamp}
                    </div>
                  </div>
                </div>
                
                <div className={`text-sm font-medium ${
                  trade.profit > 0 ? 'text-green-400' : 
                  trade.profit < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {trade.profit > 0 && '+'}
                  {trade.profit !== 0 && trade.profit.toFixed(2)} USDT
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}