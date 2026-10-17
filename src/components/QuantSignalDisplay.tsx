import React, { useState } from 'react';
import { ParsedSignal } from '../types/quant';
import { formatSignalTemplate } from '../utils/signalParser';
import {
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  PauseCircle,
  AlertTriangle,
  ShieldCheck,
  Target,
  DollarSign,
  BookmarkPlus,
  Terminal,
  Calculator,
} from 'lucide-react';

interface QuantSignalDisplayProps {
  signal: ParsedSignal | null;
  loading: boolean;
  onSaveToJournal: (sig: ParsedSignal) => void;
  onOpenCalculator: (sig: ParsedSignal) => void;
}

export const QuantSignalDisplay: React.FC<QuantSignalDisplayProps> = ({
  signal,
  loading,
  onSaveToJournal,
  onOpenCalculator,
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);

  if (loading) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[460px] text-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
          <div className="w-16 h-16 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-500 border-l-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
            QUANT
          </div>
        </div>
        <h3 className="text-zinc-100 font-mono font-semibold text-base mb-1">
          КВАНТОВЫЙ АЛГОРИТМИЧЕСКИЙ РАСЧЕТ...
        </h3>
        <p className="text-xs text-zinc-400 max-w-xs font-mono">
          Анализ свечей 1ч & 4ч, фильтрация RSI/MACD, расчет волатильности ATR и проверка строгих уровней риска.
        </p>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-8 shadow-2xl flex flex-col items-center justify-center min-h-[460px] text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-3 border border-zinc-800">
          <Terminal className="w-6 h-6" />
        </div>
        <h3 className="text-zinc-200 font-mono font-semibold text-sm mb-1">
          СИГНАЛ НЕ СГЕНЕРИРОВАН
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mb-4 font-mono">
          Нажмите кнопку «⚡ Сгенерировать Квант-Сигнал» вверху или выберите тестовый рыночный сценарий для алгоритмического анализа.
        </p>
      </div>
    );
  }

  const isLong = signal.type === 'LONG';
  const isShort = signal.type === 'SHORT';
  const isHold = signal.type === 'HOLD (ВНЕ РЫНКА)';

  // Calculate profit & loss percentages relative to entry
  const entryP = signal.levels.entryPrice;
  const tp1P = signal.levels.tp1Price;
  const tp2P = signal.levels.tp2Price;
  const slP = signal.levels.stopLossPrice;

  const getPercentDiff = (targetPrice: number) => {
    if (!entryP || !targetPrice || entryP === 0) return null;
    const diff = ((targetPrice - entryP) / entryP) * 100;
    return isShort ? -diff : diff;
  };

  const tp1Gain = tp1P ? getPercentDiff(tp1P) : null;
  const tp2Gain = tp2P ? getPercentDiff(tp2P) : null;
  const slLoss = slP ? getPercentDiff(slP) : null;

  const handleCopy = () => {
    const textToCopy = signal.rawText || formatSignalTemplate(signal);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveToJournal(signal);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
      {/* Top Banner & Signal Direction */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`px-3 py-1.5 rounded-lg font-mono font-bold text-sm flex items-center gap-1.5 border ${
              isLong
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                : isShort
                ? 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
            }`}
          >
            {isLong && <TrendingUp className="w-4 h-4 text-emerald-400" />}
            {isShort && <TrendingDown className="w-4 h-4 text-rose-400" />}
            {isHold && <PauseCircle className="w-4 h-4 text-amber-400" />}
            <span>⚡️ СИГНАЛ: [{signal.type}]</span>
          </div>

          <span className="font-mono text-xs text-zinc-400">
            {signal.direction}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewRaw(!viewRaw)}
            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs font-mono flex items-center gap-1"
            title="Переключить RAW текст / Карточка"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{viewRaw ? 'Карточка' : 'RAW'}</span>
          </button>

          <button
            onClick={handleCopy}
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-cyan-950/90 hover:bg-cyan-900/90 text-cyan-300 border-cyan-800/60'
            }`}
            title="Скопировать сигнал по шаблону"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
          </button>
        </div>
      </div>

      {/* Asset Identifier */}
      <div className="flex items-center justify-between text-xs font-mono bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/60">
        <span className="text-zinc-400">📊 Актив:</span>
        <span className="font-bold text-zinc-100 text-sm">{signal.asset}</span>
      </div>

      {/* RAW Text View toggle */}
      {viewRaw ? (
        <pre className="bg-black/90 p-3 rounded-lg border border-zinc-800 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
          {signal.rawText || formatSignalTemplate(signal)}
        </pre>
      ) : (
        <>
          {/* Price Levels Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Target className="w-3.5 h-3.5" />
                🔢 ЦЕНОВЫЕ УРОВНИ
              </span>
              <span className="text-[11px] text-zinc-500">Ордер & Тейки</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {/* Entry */}
              <div className="bg-zinc-900/80 border border-cyan-900/40 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-zinc-400 text-[11px] mb-1">Точка входа (Entry):</span>
                <span className="text-cyan-300 font-bold text-sm tracking-wide">
                  {signal.levels.entry}
                </span>
              </div>

              {/* Stop-Loss */}
              <div className="bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-rose-400 text-[11px] font-semibold">Stop-Loss (ОБЯЗАТЕЛЕН):</span>
                  {slLoss !== null && (
                    <span className="text-rose-400 text-[10px] font-bold bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800/50">
                      {slLoss.toFixed(2)}%
                    </span>
                  )}
                </div>
                <span className="text-rose-300 font-bold text-sm tracking-wide mt-1">
                  {signal.levels.stopLoss}
                </span>
              </div>

              {/* Take-Profit 1 */}
              <div className="bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 text-[11px]">Take-Profit 1 (Ближний):</span>
                  {tp1Gain !== null && (
                    <span className="text-emerald-400 text-[10px] font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/50">
                      +{tp1Gain.toFixed(2)}%
                    </span>
                  )}
                </div>
                <span className="text-emerald-300 font-bold text-sm tracking-wide mt-1">
                  {signal.levels.tp1}
                </span>
              </div>

              {/* Take-Profit 2 */}
              <div className="bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 text-[11px]">Take-Profit 2 (Целевой):</span>
                  {tp2Gain !== null && (
                    <span className="text-emerald-400 text-[10px] font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/50">
                      +{tp2Gain.toFixed(2)}%
                    </span>
                  )}
                </div>
                <span className="text-emerald-300 font-bold text-sm tracking-wide mt-1">
                  {signal.levels.tp2}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Justification (3 bullet points strict) */}
          <div className="space-y-2 pt-1 border-t border-zinc-900">
            <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              📈 ТЕХНИЧЕСКОЕ ОБОСНОВАНИЕ
            </span>

            <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
              <div className="bg-zinc-900/70 p-2 rounded border border-zinc-800/70">
                <span className="text-cyan-400 font-semibold block mb-0.5">1. Динамика цены и тренд:</span>
                <p className="text-zinc-200 leading-relaxed">{signal.justification.trend}</p>
              </div>

              <div className="bg-zinc-900/70 p-2 rounded border border-zinc-800/70">
                <span className="text-amber-400 font-semibold block mb-0.5">2. Индикаторы:</span>
                <p className="text-zinc-200 leading-relaxed">{signal.justification.indicators}</p>
              </div>

              <div className="bg-zinc-900/70 p-2 rounded border border-zinc-800/70">
                <span className="text-purple-400 font-semibold block mb-0.5">3. Объемы:</span>
                <p className="text-zinc-200 leading-relaxed">{signal.justification.volume}</p>
              </div>
            </div>
          </div>

          {/* Risk Evaluation */}
          <div className="space-y-2 pt-1 border-t border-zinc-900">
            <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ⚠️ ОЦЕНКА РИСКА
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {/* Probability */}
              <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-400 text-[11px]">Вероятность:</span>
                  <span className="font-bold text-cyan-400 text-sm">
                    {signal.risk.probability}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      signal.risk.probability >= 70
                        ? 'bg-emerald-500'
                        : signal.risk.probability >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${signal.risk.probability}%` }}
                  />
                </div>
              </div>

              {/* Risk / Reward */}
              <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800 flex flex-col justify-between">
                <span className="text-zinc-400 text-[11px]">Риск/Прибыль (R:R):</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {signal.risk.riskRewardRatio}
                </span>
              </div>
            </div>

            {/* Invalidation Trigger */}
            <div className="bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg text-xs font-mono">
              <span className="text-rose-400 font-semibold block mb-0.5">
                Ключевой триггер отмены:
              </span>
              <p className="text-zinc-300 leading-relaxed">
                {signal.risk.invalidationTrigger}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900">
        <button
          onClick={() => onOpenCalculator(signal)}
          className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 border border-zinc-800 hover:border-zinc-700 transition-all"
        >
          <Calculator className="w-3.5 h-3.5 text-cyan-400" />
          <span>Калькулятор позиции</span>
        </button>

        <button
          onClick={handleSave}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 border transition-all ${
            saved
              ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
          }`}
        >
          <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
          <span>{saved ? 'В Журнале!' : 'Сохранить в журнал'}</span>
        </button>
      </div>
    </div>
  );
};
