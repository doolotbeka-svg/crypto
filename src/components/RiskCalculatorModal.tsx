import React, { useState } from 'react';
import { ParsedSignal } from '../types/quant';
import { X, Calculator, ShieldAlert, CheckCircle, Percent } from 'lucide-react';

interface RiskCalculatorModalProps {
  signal: ParsedSignal;
  onClose: () => void;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({ signal, onClose }) => {
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);

  const entry = signal.levels.entryPrice || 1;
  const sl = signal.levels.stopLossPrice || entry * 0.97;
  const tp1 = signal.levels.tp1Price || entry * 1.04;
  const tp2 = signal.levels.tp2Price || entry * 1.08;

  const isShort = signal.type === 'SHORT';

  // Distance to SL in % and $
  const stopDistanceDollar = isShort ? sl - entry : entry - sl;
  const stopDistancePercent = Math.abs((stopDistanceDollar / entry) * 100);

  // Maximum allowed dollar loss based on risk %
  const maxRiskDollar = (accountBalance * riskPercent) / 100;

  // Position sizing
  const positionSizeCoins = stopDistanceDollar > 0 ? maxRiskDollar / stopDistanceDollar : 0;
  const positionSizeUsdt = positionSizeCoins * entry;

  // Potential rewards
  const tp1GainDollar = isShort ? entry - tp1 : tp1 - entry;
  const tp1ProfitUsdt = positionSizeCoins * tp1GainDollar;
  const tp1RR = stopDistanceDollar > 0 ? (tp1GainDollar / stopDistanceDollar).toFixed(2) : '0';

  const tp2GainDollar = isShort ? entry - tp2 : tp2 - entry;
  const tp2ProfitUsdt = positionSizeCoins * tp2GainDollar;
  const tp2RR = stopDistanceDollar > 0 ? (tp2GainDollar / stopDistanceDollar).toFixed(2) : '0';

  // Safe leverage recommendation
  const impliedLeverage = positionSizeUsdt > 0 ? positionSizeUsdt / accountBalance : 1;
  const maxSafeLeverage = stopDistancePercent > 0 ? Math.floor(80 / stopDistancePercent) : 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative font-mono text-xs">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
          <Calculator className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-sm text-zinc-100">
              КАЛЬКУЛЯТОР РИСК-МЕНЕДЖМЕНТА
            </h3>
            <span className="text-[11px] text-zinc-400">
              Расчет размера позиции и маржи для {signal.asset} [{signal.type}]
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-zinc-400 text-[11px] block mb-1.5">
              Депозит аккаунта (USDT):
            </label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-[11px] block mb-1.5 flex items-center justify-between">
              <span>Риск на сделку (%):</span>
              <span className="text-cyan-400 font-bold">{riskPercent}%</span>
            </label>
            <div className="flex gap-1.5">
              {[1, 1.5, 2, 3].map((p) => (
                <button
                  key={p}
                  onClick={() => setRiskPercent(p)}
                  className={`flex-1 py-1.5 rounded text-[11px] font-bold border transition-all ${
                    riskPercent === p
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculation Results Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3 mb-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <span className="text-zinc-400">Максимальный допустимый убыток:</span>
            <span className="text-rose-400 font-bold text-sm">
              -${maxRiskDollar.toFixed(2)} USDT ({riskPercent}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Дистанция до Stop-Loss:</span>
            <span className="text-zinc-200 font-semibold">
              ${Math.abs(stopDistanceDollar).toFixed(2)} ({stopDistancePercent.toFixed(2)}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Рекомендуемый размер позиции:</span>
            <span className="text-cyan-400 font-bold text-sm">
              ${positionSizeUsdt.toFixed(2)} USDT ({positionSizeCoins.toFixed(4)} монет)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Эффективное плечо:</span>
            <span className="text-amber-400 font-semibold">
              {impliedLeverage.toFixed(1)}x (Макс. безопасное: ~{maxSafeLeverage}x)
            </span>
          </div>
        </div>

        {/* Expected Rewards Breakdown */}
        <div className="space-y-2 mb-4">
          <span className="text-[11px] text-zinc-400 font-bold block">
            ПРОГНОЗ ДОХОДНОСТИ:
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-950/30 border border-emerald-900/50 p-2.5 rounded-lg">
              <span className="text-emerald-400 text-[10px] block">При Take-Profit 1 (R:R 1:{tp1RR})</span>
              <span className="text-emerald-300 font-bold text-sm block mt-0.5">
                +${Math.max(0, tp1ProfitUsdt).toFixed(2)} USDT
              </span>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-900/50 p-2.5 rounded-lg">
              <span className="text-emerald-400 text-[10px] block">При Take-Profit 2 (R:R 1:{tp2RR})</span>
              <span className="text-emerald-300 font-bold text-sm block mt-0.5">
                +${Math.max(0, tp2ProfitUsdt).toFixed(2)} USDT
              </span>
            </div>
          </div>
        </div>

        {/* Quant Warning */}
        <div className="flex items-start gap-2 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Квантовое правило: никогда не рискуйте более 2% депозита на одну сделку. Стоп-лосс должен выставляться сразу в момент входа.
          </span>
        </div>
      </div>
    </div>
  );
};
