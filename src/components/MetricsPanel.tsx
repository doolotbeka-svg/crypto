import React from 'react';
import { IndicatorMetrics, MarketSummary } from '../types/quant';
import { Activity, BarChart2, Compass, Layers, Zap } from 'lucide-react';

interface MetricsPanelProps {
  summary: MarketSummary;
  timeframe: '1h' | '4h';
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ summary, timeframe }) => {
  const currentTfData = timeframe === '1h' ? summary.timeframe1h : summary.timeframe4h;
  const ind: IndicatorMetrics = currentTfData.indicators;
  const price = summary.price;

  // Trend alignment classification
  let emaTrend = 'Консолидация / Смешанный';
  let emaTrendColor = 'text-amber-400';
  if (price > ind.ema20 && ind.ema20 > ind.ema50 && ind.ema50 > ind.ema200) {
    emaTrend = 'Строгий бычий тренд (P > EMA20 > EMA50 > EMA200)';
    emaTrendColor = 'text-emerald-400';
  } else if (price < ind.ema20 && ind.ema20 < ind.ema50 && ind.ema50 < ind.ema200) {
    emaTrend = 'Строгий медвежий тренд (P < EMA20 < EMA50 < EMA200)';
    emaTrendColor = 'text-rose-400';
  } else if (price > ind.ema200) {
    emaTrend = 'Выше 200 EMA (Глобально бычий фон)';
    emaTrendColor = 'text-emerald-300';
  } else if (price < ind.ema200) {
    emaTrend = 'Ниже 200 EMA (Глобально медвежий фон)';
    emaTrendColor = 'text-rose-300';
  }

  // RSI status
  let rsiStatus = 'Нейтральная зона';
  let rsiColor = 'text-zinc-200';
  if (ind.rsi >= 70) {
    rsiStatus = 'Перекупленность (>70)';
    rsiColor = 'text-rose-400';
  } else if (ind.rsi <= 30) {
    rsiStatus = 'Перепроданность (<30)';
    rsiColor = 'text-emerald-400';
  }

  // MACD Cross
  const isMacdBullish = ind.macd.histogram > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {/* RSI Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            RSI (14)
          </span>
          <span className="text-[10px] text-zinc-500">{timeframe.toUpperCase()}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-mono font-bold ${rsiColor}`}>
            {ind.rsi}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 truncate">
            {rsiStatus}
          </span>
        </div>
        <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden relative">
          {/* 30-70 zone marks */}
          <div className="absolute left-[30%] right-[30%] h-full bg-zinc-700/50" />
          <div
            className={`h-full transition-all duration-300 ${
              ind.rsi >= 70 ? 'bg-rose-500' : ind.rsi <= 30 ? 'bg-emerald-500' : 'bg-cyan-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, ind.rsi))}%` }}
          />
        </div>
      </div>

      {/* MACD Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            MACD (12,26,9)
          </span>
          <span className={`text-[10px] font-bold ${isMacdBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isMacdBullish ? 'Бычий' : 'Медвежий'}
          </span>
        </div>
        <div className="font-mono text-xs space-y-0.5">
          <div className="flex justify-between">
            <span className="text-zinc-500">Hist:</span>
            <span className={ind.macd.histogram >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {ind.macd.histogram > 0 ? `+${ind.macd.histogram}` : ind.macd.histogram}
            </span>
          </div>
          <div className="flex justify-between text-zinc-400 text-[11px]">
            <span>Line/Sig:</span>
            <span>{ind.macd.macd} / {ind.macd.signal}</span>
          </div>
        </div>
      </div>

      {/* EMA Alignment Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col justify-between col-span-2">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Скользящие EMA (20 / 50 / 200)
          </span>
          <span className={`text-[10px] font-mono font-bold ${emaTrendColor}`}>
            {emaTrend}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
          <div className="bg-zinc-900/60 p-1.5 rounded border border-cyan-950">
            <span className="text-zinc-500 text-[10px] block">EMA 20</span>
            <span className="text-cyan-300 font-bold">{ind.ema20.toLocaleString()}</span>
          </div>
          <div className="bg-zinc-900/60 p-1.5 rounded border border-amber-950">
            <span className="text-zinc-500 text-[10px] block">EMA 50</span>
            <span className="text-amber-300 font-bold">{ind.ema50.toLocaleString()}</span>
          </div>
          <div className="bg-zinc-900/60 p-1.5 rounded border border-purple-950">
            <span className="text-zinc-500 text-[10px] block">EMA 200</span>
            <span className="text-purple-300 font-bold">{ind.ema200.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bollinger Bands Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            Bollinger (20,2)
          </span>
          <span className="text-[10px] text-zinc-500">Шир: {ind.bollinger.bandwidth}%</span>
        </div>
        <div className="font-mono text-xs space-y-1">
          <div className="flex justify-between text-zinc-400 text-[11px]">
            <span>Верх:</span>
            <span className="text-sky-300 font-semibold">{ind.bollinger.upper.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-zinc-400 text-[11px]">
            <span>Низ:</span>
            <span className="text-sky-300 font-semibold">{ind.bollinger.lower.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-zinc-500 mt-1 flex justify-between">
          <span>%B полосы:</span>
          <span className="text-zinc-300 font-bold">{ind.bollinger.percentB}%</span>
        </div>
      </div>

      {/* Volume & Sentiment Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Объем & Сентимент
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
              ind.volumeSurgeRatio >= 1.5
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            Vol x{ind.volumeSurgeRatio}
          </span>
        </div>
        <div className="font-mono text-xs space-y-0.5">
          <div className="flex justify-between text-zinc-400 text-[11px]">
            <span>Fear/Greed:</span>
            <span className="text-amber-400 font-bold">
              {summary.sentiment.score}/100 ({summary.sentiment.classification})
            </span>
          </div>
          <div className="flex justify-between text-zinc-400 text-[11px]">
            <span>ATR (14):</span>
            <span className="text-zinc-200">{ind.atr14.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
