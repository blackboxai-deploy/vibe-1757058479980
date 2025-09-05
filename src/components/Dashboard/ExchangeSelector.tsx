/**
 * انتخابگر صرافی و جفت ارز
 * Exchange and Trading Pair Selector
 */
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ExchangeSelectorProps {
  selectedExchange: string;
  selectedPair: string;
  onExchangeChange: (exchange: string) => void;
  onPairChange: (pair: string) => void;
}

const EXCHANGES = [
  { 
    value: 'nobitex', 
    label: 'نوبیتکس', 
    status: 'active',
    pairs: ['BTC/USDT', 'ETH/USDT', 'BTC/IRT', 'ETH/IRT', 'USDT/IRT']
  },
  { 
    value: 'wallex', 
    label: 'والکس', 
    status: 'coming_soon',
    pairs: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT']
  },
  { 
    value: 'ramzinex', 
    label: 'رمزینکس', 
    status: 'coming_soon',
    pairs: ['BTC/USDT', 'ETH/USDT', 'ADA/USDT']
  }
];

const ALL_PAIRS = [
  'BTC/USDT',
  'ETH/USDT', 
  'BNB/USDT',
  'ADA/USDT',
  'BTC/IRT',
  'ETH/IRT',
  'USDT/IRT'
];

export default function ExchangeSelector({ 
  selectedExchange, 
  selectedPair, 
  onExchangeChange, 
  onPairChange 
}: ExchangeSelectorProps) {
  
  const currentExchange = EXCHANGES.find(ex => ex.value === selectedExchange);
  const availablePairs = currentExchange?.pairs || ALL_PAIRS;

  return (
    <div className="flex items-center space-x-4">
      {/* انتخاب صرافی */}
      <div className="flex flex-col space-y-1">
        <label className="text-xs text-slate-400">صرافی</label>
        <Select value={selectedExchange} onValueChange={onExchangeChange}>
          <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {EXCHANGES.map((exchange) => (
              <SelectItem 
                key={exchange.value} 
                value={exchange.value}
                className="text-slate-300 focus:bg-slate-700 focus:text-white"
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

      {/* انتخاب جفت ارز */}
      <div className="flex flex-col space-y-1">
        <label className="text-xs text-slate-400">جفت ارز</label>
        <Select value={selectedPair} onValueChange={onPairChange}>
          <SelectTrigger className="w-28 bg-slate-700 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {availablePairs.map((pair) => (
              <SelectItem 
                key={pair} 
                value={pair}
                className="text-slate-300 focus:bg-slate-700 focus:text-white"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs">{pair}</span>
                  {pair.includes('IRT') && (
                    <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">
                      تومان
                    </Badge>
                  )}
                  {pair.includes('USDT') && !pair.includes('IRT') && (
                    <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                      USDT
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* وضعیت اتصال */}
      <div className="flex flex-col items-center space-y-1">
        <div className={`w-3 h-3 rounded-full ${
          currentExchange?.status === 'active' 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-gray-500'
        }`}></div>
        <span className="text-xs text-slate-400">
          {currentExchange?.status === 'active' ? 'متصل' : 'قطع'}
        </span>
      </div>
    </div>
  );
}