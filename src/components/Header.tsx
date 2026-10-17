import React, { useState } from 'react';
import { MarketSummary } from '../types/quant';
import {
  Zap,
  Activity,
  Search,
  RefreshCw,
  Cpu,
  BarChart4,
  Flame,
} from 'lucide-react';

interface HeaderProps {
  currentSymbol: string;
  onSymbolSelect: (symbol: string) => void;
  summary: MarketSummary | null;
  onGenerateSignal: () => void;
  generating: boolean;
  onRefreshData: () => void;
  refreshing: boolean;
}

const POPULAR_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'BNB/USDT',
  'XRP/USDT',
  'DOGE/USDT',
  'AVAX/USDT',
  'SUI/USDT',
];

export const Header: React.FC<HeaderProps> = ({
  currentSymbol,
  onSymbolSelect,
  summary,
  onGenerateSignal,
  generating,
  onRefreshData,
  refreshing,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    let clean = searchInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean.endsWith('USDT')) clean = `${clean}/USDT`;
    else clean = clean.replace('USDT', '/USDT');
    onSymbolSelect(clean);
    setSearchInput('');
    setShowSearch(false);
  };

  const isPositive = (summary?.priceChangePercent24h ?? 0) >= 0;

  return (
    <header className="bg-zinc-950 border-b border-zinc-800/80 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 font-mono">
        {/* Left: Terminal Logo & Live Feed Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-sm">
              Q
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-zinc-100 tracking-wider">
                  QUANT CRYPTO
                </span>
                <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded text-[9px] font-bold">
                  v3.8
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 block leading-tight">
                Алгоритмический риск-терминал
              </span>
            </div>
          </div>

          {/* Fear & Greed Index Chip */}
          {summary?.sentiment && (
            <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-400 text-[11px]">F&G:</span>
              <span className="font-bold text-amber-300">
                {summary.sentiment.score}
              </span>
              <span className="text-[10px] text-zinc-500 hidden lg:inline">
                ({summary.sentiment.classification})
              </span>
            </div>
          )}

          {/* Engine indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline text-zinc-400">Gemini Quant Engine</span>
          </div>
        </div>

        {/* Center: Popular Tickers Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {POPULAR_SYMBOLS.map((sym) => (
            <button
              key={sym}
              onClick={() => onSymbolSelect(sym)}
              className={`px-2.5 py-1 rounded-lg transition-all shrink-0 font-semibold border ${
                currentSymbol === sym
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              {sym.replace('/USDT', '')}
            </button>
          ))}

          {/* Search Button */}
          {showSearch ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <input
                type="text"
                autoFocus
                placeholder="ТИКЕР (e.g. ADA)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => !searchInput && setShowSearch(false)}
                className="bg-zinc-900 border border-cyan-500 rounded-lg px-2 py-1 text-xs text-zinc-100 w-28 uppercase focus:outline-none"
              />
            </form>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 shrink-0"
              title="Поиск тикера"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Refresh Data button */}
          <button
            onClick={onRefreshData}
            disabled={refreshing}
            className={`p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 shrink-0 transition-transform ${
              refreshing ? 'animate-spin text-cyan-400' : ''
            }`}
            title="Обновить котировки"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Live Price & Generate Signal Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {summary && (
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-sm sm:text-base text-zinc-100">
                  ${summary.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: summary.price < 1 ? 4 : 2 })}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? '+' : ''}{summary.priceChangePercent24h}%
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onGenerateSignal}
            disabled={generating}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
              generating
                ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black border border-cyan-400/50 shadow-cyan-500/20 active:scale-95'
            }`}
          >
            <Zap className={`w-4 h-4 ${generating ? 'animate-bounce' : 'fill-current'}`} />
            <span>{generating ? 'РАСЧЕТ СИГНАЛА...' : 'СГЕНЕРИРОВАТЬ СИГНАЛ'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
