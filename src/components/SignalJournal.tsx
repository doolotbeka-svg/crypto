import React, { useState } from 'react';
import { TradeJournalEntry, ParsedSignal } from '../types/quant';
import { formatSignalTemplate } from '../utils/signalParser';
import {
  BookOpen,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
} from 'lucide-react';

interface SignalJournalProps {
  entries: TradeJournalEntry[];
  onUpdateStatus: (id: string, status: TradeJournalEntry['status']) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onSelectSignal: (signal: ParsedSignal) => void;
}

export const SignalJournal: React.FC<SignalJournalProps> = ({
  entries,
  onUpdateStatus,
  onDeleteEntry,
  onClearAll,
  onSelectSignal,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'LONG' | 'SHORT' | 'HOLD'>('ALL');

  const filteredEntries = entries.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'HOLD') return e.type.includes('HOLD');
    return e.type === filter;
  });

  const handleCopy = (entry: TradeJournalEntry) => {
    navigator.clipboard.writeText(entry.rawText || formatSignalTemplate(entry));
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `quant_signals_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-zinc-100">
            ЖУРНАЛ КВАНТОВЫХ СИГНАЛОВ
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]">
            {entries.length} записей
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
            {(['ALL', 'LONG', 'SHORT', 'HOLD'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded transition-all ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {entries.length > 0 && (
            <>
              <button
                onClick={handleExportJson}
                className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                title="Экспорт в JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClearAll}
                className="p-1.5 rounded bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-zinc-800"
                title="Очистить журнал"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* List */}
      {filteredEntries.length === 0 ? (
        <div className="py-10 text-center text-zinc-500">
          <p>В журнале нет сохраненных сигналов</p>
          <span className="text-[11px] text-zinc-600 block mt-1">
            Нажмите «Сохранить в журнал» на карточке любого сгенерированного сигнала.
          </span>
        </div>
      ) : (
        <div className="divide-y divide-zinc-900 mt-2 max-h-[360px] overflow-y-auto">
          {filteredEntries.map((entry) => {
            const isLong = entry.type === 'LONG';
            const isShort = entry.type === 'SHORT';

            return (
              <div
                key={entry.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/30 px-2 rounded-lg transition-colors"
              >
                {/* Info */}
                <div
                  className="cursor-pointer flex-1"
                  onClick={() => onSelectSignal(entry)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isLong
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : isShort
                          ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                          : 'bg-amber-950/80 text-amber-400 border-amber-800'
                      }`}
                    >
                      {entry.type}
                    </span>
                    <span className="font-bold text-zinc-200">{entry.asset}</span>
                    <span className="text-zinc-500 text-[10px]">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400 text-[11px]">
                    <span>Вход: <span className="text-cyan-400">{entry.levels.entry}</span></span>
                    <span>TP1: <span className="text-emerald-400">{entry.levels.tp1}</span></span>
                    <span>SL: <span className="text-rose-400">{entry.levels.stopLoss}</span></span>
                    <span>R:R: <span className="text-zinc-200">{entry.risk.riskRewardRatio}</span></span>
                    <span>Вер: <span className="text-zinc-200">{entry.risk.probability}%</span></span>
                  </div>
                </div>

                {/* Status Selector & Actions */}
                <div className="flex items-center gap-2">
                  <select
                    value={entry.status}
                    onChange={(e) => onUpdateStatus(entry.id, e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ACTIVE">⏳ В работе</option>
                    <option value="TP1_HIT">🎯 Взят TP1</option>
                    <option value="TP2_HIT">🚀 Взят TP2</option>
                    <option value="STOPPED_OUT">🛑 Стоп-аут</option>
                    <option value="CANCELLED">❌ Отменен</option>
                  </select>

                  <button
                    onClick={() => handleCopy(entry)}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-800"
                    title="Копировать текст сигнала"
                  >
                    {copiedId === entry.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-rose-950 text-zinc-500 hover:text-rose-400 border border-zinc-800"
                    title="Удалить запись"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
