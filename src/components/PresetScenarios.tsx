import React from 'react';
import { Sparkles, ArrowUpRight, ArrowDownRight, AlertOctagon, Flame } from 'lucide-react';

interface PresetScenariosProps {
  onApplyScenario: (notes: string) => void;
  customNotes: string;
  onCustomNotesChange: (val: string) => void;
}

export const PresetScenarios: React.FC<PresetScenariosProps> = ({
  onApplyScenario,
  customNotes,
  onCustomNotesChange,
}) => {
  const presets = [
    {
      title: 'Бычий пробой 200 EMA',
      icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />,
      notes: 'Импульсный пробой 200 EMA снизу вверх на 4ч таймфрейме, подтвержденный ростом торгового объема на +85% и бычьим гистограммным кроссом MACD.',
    },
    {
      title: 'Медвежья дивергенция RSI',
      icon: <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />,
      notes: 'Формирование скрытой медвежьей дивергенции по RSI (новый максимум цены при понижающемся пике индикатора), отскок от верхней полосы Боллинджера.',
    },
    {
      title: 'Флэт / Тест «ВНЕ РЫНКА»',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />,
      notes: 'Экстремальное сжатие полос Боллинджера (Bandwidth < 2.5%), объемы ниже скользящей средней SMA20 на 45%, отсутствие направленного импульса на 1ч и 4ч.',
    },
    {
      title: 'Панический сброс (RSI < 25)',
      icon: <Flame className="w-3.5 h-3.5 text-yellow-400" />,
      notes: 'Локальный сквиз цены к нижней границе 4ч диапазона, резкий всплеск ликвидаций лонгов, RSI упал до 22.5, выкуп нижней тени свечи.',
    },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl font-mono text-xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800/80">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <h4 className="font-bold text-zinc-200">
          ТЕСТОВЫЕ КВАНТОВЫЕ СЦЕНАРИИ & КОНТЕКСТ ТРЕЙДЕРА
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onApplyScenario(p.notes)}
            className="p-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-cyan-800/60 text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center gap-1.5 font-bold text-zinc-300 group-hover:text-cyan-300 mb-1">
              {p.icon}
              <span className="truncate">{p.title}</span>
            </div>
            <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
              {p.notes}
            </p>
          </button>
        ))}
      </div>

      {/* Custom notes input */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Собственные наблюдения / фундаментальные данные трейдера:</span>
          {customNotes && (
            <button
              onClick={() => onCustomNotesChange('')}
              className="text-zinc-500 hover:text-zinc-300 text-[10px]"
            >
              Сбросить
            </button>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customNotes}
            onChange={(e) => onCustomNotesChange(e.target.value)}
            placeholder="Например: крупная стенка на спотовом стакане, экспирация опционов сегодня в 16:00 UTC..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyan-500 text-xs placeholder:text-zinc-600"
          />
        </div>
      </div>
    </div>
  );
};
