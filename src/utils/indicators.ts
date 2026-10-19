import type { Candle, IndicatorMetrics } from '../types/quant';

/**
 * Calculates Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

/**
 * Calculates Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let prevEma = NaN;

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    if (i === period - 1) {
      // First EMA is simple average
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      prevEma = sum / period;
      result.push(prevEma);
      continue;
    }
    prevEma = val * k + prevEma * (1 - k);
    result.push(prevEma);
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI 14)
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  const result: number[] = [];
  if (closes.length <= period) {
    return closes.map(() => 50);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(50);
      continue;
    }
    if (i > period) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push(Number(rsi.toFixed(2)));
    }
  }

  return result;
}

/**
 * Calculates Bollinger Bands (20, 2 std dev)
 */
export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2) {
  const sma = calculateSMA(closes, period);
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  const bandwidth: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    const m = sma[i];
    if (isNaN(m)) {
      upper.push(NaN);
      middle.push(NaN);
      lower.push(NaN);
      bandwidth.push(NaN);
      continue;
    }
    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(closes[i - j] - m, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    const u = m + multiplier * stdDev;
    const l = m - multiplier * stdDev;
    upper.push(u);
    middle.push(m);
    lower.push(l);
    bandwidth.push(m > 0 ? ((u - l) / m) * 100 : 0);
  }

  return { upper, middle, lower, bandwidth };
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(closes: number[], fast = 12, slow = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(closes, fast);
  const slowEMA = calculateEMA(closes, slow);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  // Filter valid macd points to compute signal EMA
  const validMacdIndices = macdLine.map((val, idx) => (!isNaN(val) ? idx : -1)).filter((idx) => idx !== -1);
  const validMacdValues = validMacdIndices.map((idx) => macdLine[idx]);
  const signalEmaValues = calculateEMA(validMacdValues, signalPeriod);

  const signalLine: number[] = new Array(closes.length).fill(NaN);
  const histogram: number[] = new Array(closes.length).fill(NaN);

  for (let i = 0; i < validMacdIndices.length; i++) {
    const origIdx = validMacdIndices[i];
    const sig = signalEmaValues[i];
    signalLine[origIdx] = sig;
    if (!isNaN(macdLine[origIdx]) && !isNaN(sig)) {
      histogram[origIdx] = macdLine[origIdx] - sig;
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates ATR (Average True Range, 14)
 */
export function calculateATR(candles: Candle[], period = 14): number[] {
  if (candles.length < 2) return candles.map(() => 0);

  const trueRanges: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  return calculateSMA(trueRanges, period);
}

/**
 * Computes all technical metrics for the latest candle in the array
 */
export function computeIndicatorMetrics(candles: Candle[]): IndicatorMetrics {
  if (!candles || candles.length === 0) {
    return {
      rsi: 50,
      macd: { macd: 0, signal: 0, histogram: 0 },
      ema20: 0,
      ema50: 0,
      ema200: 0,
      sma50: 0,
      bollinger: { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 50 },
      atr14: 0,
      volume24h: 0,
      volumeSma20: 0,
      volumeSurgeRatio: 1,
    };
  }

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const lastIndex = candles.length - 1;
  const currentPrice = closes[lastIndex];

  // Indicators
  const rsiArr = calculateRSI(closes, 14);
  const rsi = rsiArr[lastIndex] || 50;

  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, 200);
  const sma50Arr = calculateSMA(closes, 50);

  const bb = calculateBollingerBands(closes, 20, 2);
  const bbUpper = bb.upper[lastIndex] || currentPrice * 1.05;
  const bbMiddle = bb.middle[lastIndex] || currentPrice;
  const bbLower = bb.lower[lastIndex] || currentPrice * 0.95;
  const bbBandwidth = bb.bandwidth[lastIndex] || 5;

  const percentB =
    bbUpper !== bbLower ? ((currentPrice - bbLower) / (bbUpper - bbLower)) * 100 : 50;

  const macd = calculateMACD(closes, 12, 26, 9);
  const macdVal = macd.macdLine[lastIndex] || 0;
  const signalVal = macd.signalLine[lastIndex] || 0;
  const histVal = macd.histogram[lastIndex] || 0;

  const atrArr = calculateATR(candles, 14);
  const atr14 = atrArr[lastIndex] || currentPrice * 0.02;

  // Volume
  const volSmaArr = calculateSMA(volumes, 20);
  const currentVol = volumes[lastIndex] || 1;
  const volSma = volSmaArr[lastIndex] || currentVol;
  const volumeSurge = volSma > 0 ? currentVol / volSma : 1;
  const volume24h = volumes.slice(-24).reduce((sum, v) => sum + v, 0);

  return {
    rsi: Number(rsi.toFixed(2)),
    macd: {
      macd: Number(macdVal.toFixed(4)),
      signal: Number(signalVal.toFixed(4)),
      histogram: Number(histVal.toFixed(4)),
    },
    ema20: Number((ema20Arr[lastIndex] || currentPrice).toFixed(4)),
    ema50: Number((ema50Arr[lastIndex] || currentPrice).toFixed(4)),
    ema200: Number((ema200Arr[lastIndex] || currentPrice).toFixed(4)),
    sma50: Number((sma50Arr[lastIndex] || currentPrice).toFixed(4)),
    bollinger: {
      upper: Number(bbUpper.toFixed(4)),
      middle: Number(bbMiddle.toFixed(4)),
      lower: Number(bbLower.toFixed(4)),
      bandwidth: Number(bbBandwidth.toFixed(2)),
      percentB: Number(percentB.toFixed(2)),
    },
    atr14: Number(atr14.toFixed(4)),
    volume24h: Number(volume24h.toFixed(2)),
    volumeSma20: Number(volSma.toFixed(2)),
    volumeSurgeRatio: Number(volumeSurge.toFixed(2)),
  };
}
