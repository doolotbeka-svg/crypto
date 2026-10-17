export interface Candle {
  time: number; // timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorMetrics {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  ema20: number;
  ema50: number;
  ema200: number;
  sma50: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  };
  atr14: number;
  volume24h: number;
  volumeSma20: number;
  volumeSurgeRatio: number; // current candle volume vs average
}

export interface MarketSummary {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  sentiment: {
    score: number; // 0 to 100
    classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
    newsHeadline?: string;
  };
  timeframe1h: {
    candles: Candle[];
    indicators: IndicatorMetrics;
  };
  timeframe4h: {
    candles: Candle[];
    indicators: IndicatorMetrics;
  };
}

export interface ParsedSignal {
  type: 'LONG' | 'SHORT' | 'HOLD (ВНЕ РЫНКА)';
  direction: 'Покупка' | 'Продажа' | 'Ожидание';
  asset: string;
  levels: {
    entry: string;
    entryPrice: number;
    tp1: string;
    tp1Price: number;
    tp2: string;
    tp2Price: number;
    stopLoss: string;
    stopLossPrice: number;
  };
  justification: {
    trend: string;
    indicators: string;
    volume: string;
  };
  risk: {
    probability: number; // %
    riskRewardRatio: string; // e.g. "1:2.5"
    invalidationTrigger: string;
  };
  rawText: string;
  timestamp: number;
  id: string;
}

export interface TradeJournalEntry extends ParsedSignal {
  status: 'ACTIVE' | 'TP1_HIT' | 'TP2_HIT' | 'STOPPED_OUT' | 'CANCELLED';
  notes?: string;
}
