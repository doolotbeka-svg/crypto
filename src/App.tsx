import React, { useState, useEffect, useCallback } from 'react';
import { MarketSummary, ParsedSignal, TradeJournalEntry } from './types/quant';
import { Header } from './components/Header';
import { TradingChart } from './components/TradingChart';
import { QuantSignalDisplay } from './components/QuantSignalDisplay';
import { MetricsPanel } from './components/MetricsPanel';
import { RiskCalculatorModal } from './components/RiskCalculatorModal';
import { SignalJournal } from './components/SignalJournal';
import { PresetScenarios } from './components/PresetScenarios';
import { AlertCircle, Sliders, CheckCircle2 } from 'lucide-react';

const JOURNAL_STORAGE_KEY = 'quant_terminal_journal_v1';

export default function App() {
  const [symbol, setSymbol] = useState<string>('BTC/USDT');
  const [timeframe, setTimeframe] = useState<'1h' | '4h'>('1h');
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [marketLoading, setMarketLoading] = useState<boolean>(true);
  const [marketError, setMarketError] = useState<string | null>(null);

  const [signal, setSignal] = useState<ParsedSignal | null>(null);
  const [signalLoading, setSignalLoading] = useState<boolean>(false);
  const [customNotes, setCustomNotes] = useState<string>('');

  const [calculatorSignal, setCalculatorSignal] = useState<ParsedSignal | null>(null);
  const [journalEntries, setJournalEntries] = useState<TradeJournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch market data for selected asset
  const fetchMarketData = useCallback(async (sym: string) => {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const cleanSym = sym.replace('/', '');
      const res = await fetch(`/api/market-data/${cleanSym}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Не удалось загрузить данные рынка`);
      }
      const data: MarketSummary = await res.json();
      setMarketSummary(data);
    } catch (err: any) {
      console.error('Market fetch error:', err);
      setMarketError(err.message || 'Ошибка подключения к рыночным котировкам');
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData(symbol);
  }, [symbol, fetchMarketData]);

  // Generate Signal via Gemini AI Quant Engine
  const handleGenerateSignal = async (overrideContext?: string) => {
    if (!marketSummary) return;

    setSignalLoading(true);
    try {
      const contextToSend = overrideContext !== undefined ? overrideContext : customNotes;

      const res = await fetch('/api/generate-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: marketSummary.symbol,
          price: marketSummary.price,
          timeframe1h: marketSummary.timeframe1h,
          timeframe4h: marketSummary.timeframe4h,
          sentiment: marketSummary.sentiment,
          customContext: contextToSend,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Ошибка при генерации сигнала');
      }

      const data = await res.json();
      setSignal(data.signal);
      showToast(`Сигнал для ${marketSummary.symbol} сформирован!`);
    } catch (err: any) {
      console.error('Signal generation error:', err);
      showToast(`Ошибка: ${err.message}`);
    } finally {
      setSignalLoading(false);
    }
  };

  // Handle Preset application
  const handleApplyPreset = (notes: string) => {
    setCustomNotes(notes);
    handleGenerateSignal(notes);
  };

  // Journal management
  const handleSaveToJournal = (sig: ParsedSignal) => {
    const entry: TradeJournalEntry = {
      ...sig,
      status: 'ACTIVE',
    };
    const updated = [entry, ...journalEntries.filter((e) => e.id !== sig.id)];
    setJournalEntries(updated);
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    showToast('Сигнал добавлен в торговый журнал');
  };

  const handleUpdateJournalStatus = (id: string, status: TradeJournalEntry['status']) => {
    const updated = journalEntries.map((e) => (e.id === id ? { ...e, status } : e));
    setJournalEntries(updated);
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteJournalEntry = (id: string) => {
    const updated = journalEntries.filter((e) => e.id !== id);
    setJournalEntries(updated);
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearJournal = () => {
    if (confirm('Очистить все записи в журнале?')) {
      setJournalEntries([]);
      localStorage.removeItem(JOURNAL_STORAGE_KEY);
      showToast('Журнал очищен');
    }
  };

  // Active candles for chart
  const activeCandles = marketSummary
    ? timeframe === '1h'
      ? marketSummary.timeframe1h.candles
      : marketSummary.timeframe4h.candles
    : [];

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-cyan-500/60 text-cyan-300 font-mono text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Terminal Navigation */}
      <Header
        currentSymbol={symbol}
        onSymbolSelect={(newSym) => setSymbol(newSym)}
        summary={marketSummary}
        onGenerateSignal={() => handleGenerateSignal()}
        generating={signalLoading}
        onRefreshData={() => fetchMarketData(symbol)}
        refreshing={marketLoading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 space-y-5">
        {/* Market Error Warning */}
        {marketError && (
          <div className="bg-rose-950/40 border border-rose-900 text-rose-300 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{marketError}</span>
            </div>
            <button
              onClick={() => fetchMarketData(symbol)}
              className="px-2 py-1 bg-rose-900/60 hover:bg-rose-900 rounded font-semibold text-white"
            >
              Повторить
            </button>
          </div>
        )}

        {/* Quantitative Metrics Bar */}
        {marketSummary && (
          <MetricsPanel summary={marketSummary} timeframe={timeframe} />
        )}

        {/* Two-Column Grid: Chart & Quant Signal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Interactive Candlestick Chart */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <TradingChart
              candles={activeCandles}
              symbol={symbol}
              timeframe={timeframe}
              signal={signal}
              onTimeframeChange={(tf) => setTimeframe(tf)}
            />

            {/* Presets and Custom Context */}
            <PresetScenarios
              onApplyScenario={handleApplyPreset}
              customNotes={customNotes}
              onCustomNotesChange={(val) => setCustomNotes(val)}
            />
          </div>

          {/* Right Column: Quant Signal Card */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-16 space-y-4">
            <QuantSignalDisplay
              signal={signal}
              loading={signalLoading}
              onSaveToJournal={handleSaveToJournal}
              onOpenCalculator={(sig) => setCalculatorSignal(sig)}
            />
          </div>
        </div>

        {/* Bottom Section: Trading Journal */}
        <div className="pt-2">
          <SignalJournal
            entries={journalEntries}
            onUpdateStatus={handleUpdateJournalStatus}
            onDeleteEntry={handleDeleteJournalEntry}
            onClearAll={handleClearJournal}
            onSelectSignal={(sig) => setSignal(sig)}
          />
        </div>
      </main>

      {/* Position Sizing & Risk Management Modal */}
      {calculatorSignal && (
        <RiskCalculatorModal
          signal={calculatorSignal}
          onClose={() => setCalculatorSignal(null)}
        />
      )}

      {/* Terminal Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 px-6 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            QUANT CRYPTO SIGNAL TERMINAL // Строгий риск-контроль и квантовый анализ
          </span>
          <span className="text-zinc-600">
            Powered by Gemini 3.8 Flash & Public Exchange Feeds
          </span>
        </div>
      </footer>
    </div>
  );
}
