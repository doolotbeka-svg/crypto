import React, { useState, useMemo, useRef } from 'react';
import { Candle, ParsedSignal } from '../types/quant';
import { calculateEMA, calculateBollingerBands } from '../utils/indicators';
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface TradingChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: '1h' | '4h';
  signal: ParsedSignal | null;
  onTimeframeChange: (tf: '1h' | '4h') => void;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  symbol,
  timeframe,
  signal,
  onTimeframeChange,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showEMA, setShowEMA] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [candleSliceCount, setCandleSliceCount] = useState<number>(45);

  const containerRef = useRef<HTMLDivElement>(null);

  // Visible subset of candles for crisp display
  const displayCandles = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    return candles.slice(-candleSliceCount);
  }, [candles, candleSliceCount]);

  // Calculated indicator lines on full dataset then sliced
  const indicatorsData = useMemo(() => {
    if (!candles || candles.length === 0) return null;
    const closes = candles.map((c) => c.close);
    const ema20Full = calculateEMA(closes, 20);
    const ema50Full = calculateEMA(closes, 50);
    const ema200Full = calculateEMA(closes, 200);
    const bbFull = calculateBollingerBands(closes, 20, 2);

    const sliceStart = candles.length - displayCandles.length;

    return {
      ema20: ema20Full.slice(sliceStart),
      ema50: ema50Full.slice(sliceStart),
      ema200: ema200Full.slice(sliceStart),
      bbUpper: bbFull.upper.slice(sliceStart),
      bbMiddle: bbFull.middle.slice(sliceStart),
      bbLower: bbFull.lower.slice(sliceStart),
    };
  }, [candles, displayCandles.length]);

  // Chart dimensions & scaling
  const width = 800;
  const height = 440;
  const padding = { top: 25, right: 75, bottom: 65, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const volumeHeight = 65;

  const minMax = useMemo(() => {
    if (displayCandles.length === 0) return { min: 0, max: 100, maxVol: 100 };
    let min = Math.min(...displayCandles.map((c) => c.low));
    let max = Math.max(...displayCandles.map((c) => c.high));

    // Expand bounds if signal levels are present
    if (signal) {
      if (signal.levels.entryPrice > 0) {
        min = Math.min(min, signal.levels.entryPrice);
        max = Math.max(max, signal.levels.entryPrice);
      }
      if (signal.levels.tp1Price > 0) {
        min = Math.min(min, signal.levels.tp1Price);
        max = Math.max(max, signal.levels.tp1Price);
      }
      if (signal.levels.tp2Price > 0) {
        min = Math.min(min, signal.levels.tp2Price);
        max = Math.max(max, signal.levels.tp2Price);
      }
      if (signal.levels.stopLossPrice > 0) {
        min = Math.min(min, signal.levels.stopLossPrice);
        max = Math.max(max, signal.levels.stopLossPrice);
      }
    }

    const range = max - min;
    const paddedMin = Math.max(0.000001, min - range * 0.08);
    const paddedMax = max + range * 0.08;
    const maxVol = Math.max(...displayCandles.map((c) => c.volume)) || 1;

    return { min: paddedMin, max: paddedMax, maxVol };
  }, [displayCandles, signal]);

  const getY = (val: number) => {
    if (minMax.max === minMax.min) return height / 2;
    return padding.top + chartHeight - ((val - minMax.min) / (minMax.max - minMax.min)) * chartHeight;
  };

  const candleWidth = chartWidth / (displayCandles.length || 1);
  const getX = (index: number) => padding.left + index * candleWidth + candleWidth / 2;

  // Selected or latest candle for stats
  const activeCandle = hoverIndex !== null && displayCandles[hoverIndex]
    ? displayCandles[hoverIndex]
    : displayCandles[displayCandles.length - 1];

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toFixed(4);
    return val.toFixed(6);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = mouseX - padding.left;
    const index = Math.floor(relX / candleWidth);
    if (index >= 0 && index < displayCandles.length) {
      setHoverIndex(index);
    } else {
      setHoverIndex(null);
    }
  };

  // Price axis gridlines
  const priceGridLines = useMemo(() => {
    const lines = [];
    const stepCount = 5;
    for (let i = 0; i <= stepCount; i++) {
      const price = minMax.min + ((minMax.max - minMax.min) / stepCount) * i;
      lines.push(price);
    }
    return lines;
  }, [minMax]);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col shadow-2xl relative overflow-hidden">
      {/* Chart Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg text-zinc-100">{symbol}</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              {timeframe.toUpperCase()}
            </span>
          </div>

          {/* Timeframe switcher */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => onTimeframeChange('1h')}
              className={`px-2.5 py-1 rounded transition-all ${
                timeframe === '1h'
                  ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1Ч
            </button>
            <button
              onClick={() => onTimeframeChange('4h')}
              className={`px-2.5 py-1 rounded transition-all ${
                timeframe === '4h'
                  ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              4Ч
            </button>
          </div>
        </div>

        {/* OHLCV readout on hover */}
        {activeCandle && (
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span>O: <span className="text-zinc-200">{formatPrice(activeCandle.open)}</span></span>
            <span>H: <span className="text-emerald-400">{formatPrice(activeCandle.high)}</span></span>
            <span>L: <span className="text-rose-400">{formatPrice(activeCandle.low)}</span></span>
            <span>C: <span className={activeCandle.close >= activeCandle.open ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {formatPrice(activeCandle.close)}
            </span></span>
            <span>Vol: <span className="text-zinc-300">{activeCandle.volume.toLocaleString()}</span></span>
          </div>
        )}

        {/* Indicator Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`px-2 py-1 rounded flex items-center gap-1 border transition-all ${
              showEMA
                ? 'bg-zinc-800/90 text-cyan-300 border-cyan-900/60'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
            title="EMA 20/50/200"
          >
            {showEMA ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3" />}
            <span>EMA</span>
          </button>
          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-2 py-1 rounded flex items-center gap-1 border transition-all ${
              showBB
                ? 'bg-zinc-800/90 text-amber-300 border-amber-900/60'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
            title="Bollinger Bands (20,2)"
          >
            {showBB ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3" />}
            <span>BB</span>
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 rounded flex items-center gap-1 border transition-all ${
              showVolume
                ? 'bg-zinc-800/90 text-emerald-300 border-emerald-900/60'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
            title="Объемы"
          >
            <span>VOL</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 ml-2 border-l border-zinc-800 pl-2">
            <button
              onClick={() => setCandleSliceCount((prev) => Math.max(25, prev - 10))}
              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              title="Приблизить"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCandleSliceCount((prev) => Math.min(candles.length, prev + 15))}
              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              title="Отдалить"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCandleSliceCount(45)}
              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              title="Сбросить масштаб"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Candlestick Canvas */}
      <div ref={containerRef} className="relative w-full h-[380px] select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="tpZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="slZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Price Grid Horizontal Lines */}
          {priceGridLines.map((p, idx) => {
            const y = getY(p);
            return (
              <g key={`grid-${idx}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#27272a"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={width - padding.right + 6}
                  y={y + 3.5}
                  fill="#71717a"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {formatPrice(p)}
                </text>
              </g>
            );
          })}

          {/* Signal Shaded Risk/Reward Zones if Active */}
          {signal && signal.levels.entryPrice > 0 && (
            <>
              {/* Target / Profit Zone */}
              {signal.levels.tp1Price > 0 && (
                <rect
                  x={padding.left}
                  y={Math.min(getY(signal.levels.entryPrice), getY(signal.levels.tp1Price))}
                  width={chartWidth}
                  height={Math.abs(getY(signal.levels.entryPrice) - getY(signal.levels.tp1Price))}
                  fill="url(#tpZoneGrad)"
                />
              )}
              {/* Stop / Risk Zone */}
              {signal.levels.stopLossPrice > 0 && (
                <rect
                  x={padding.left}
                  y={Math.min(getY(signal.levels.entryPrice), getY(signal.levels.stopLossPrice))}
                  width={chartWidth}
                  height={Math.abs(getY(signal.levels.entryPrice) - getY(signal.levels.stopLossPrice))}
                  fill="url(#slZoneGrad)"
                />
              )}
            </>
          )}

          {/* Bollinger Bands Shaded Area */}
          {showBB && indicatorsData && (
            <path
              d={
                displayCandles
                  .map((_, i) => {
                    const u = indicatorsData.bbUpper[i];
                    if (isNaN(u)) return '';
                    return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(u)}`;
                  })
                  .filter(Boolean)
                  .join(' ') +
                ' ' +
                displayCandles
                  .slice()
                  .reverse()
                  .map((_, revIdx) => {
                    const i = displayCandles.length - 1 - revIdx;
                    const l = indicatorsData.bbLower[i];
                    if (isNaN(l)) return '';
                    return `L ${getX(i)} ${getY(l)}`;
                  })
                  .filter(Boolean)
                  .join(' ') +
                ' Z'
              }
              fill="url(#bbGradient)"
            />
          )}

          {/* Bollinger Bands Lines */}
          {showBB && indicatorsData && (
            <>
              {/* Upper */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
                points={displayCandles
                  .map((_, i) => {
                    const val = indicatorsData.bbUpper[i];
                    return !isNaN(val) ? `${getX(i)},${getY(val)}` : null;
                  })
                  .filter(Boolean)
                  .join(' ')}
              />
              {/* Middle */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.8"
                opacity="0.3"
                points={displayCandles
                  .map((_, i) => {
                    const val = indicatorsData.bbMiddle[i];
                    return !isNaN(val) ? `${getX(i)},${getY(val)}` : null;
                  })
                  .filter(Boolean)
                  .join(' ')}
              />
              {/* Lower */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
                points={displayCandles
                  .map((_, i) => {
                    const val = indicatorsData.bbLower[i];
                    return !isNaN(val) ? `${getX(i)},${getY(val)}` : null;
                  })
                  .filter(Boolean)
                  .join(' ')}
              />
            </>
          )}

          {/* Volume Bars */}
          {showVolume && (
            <g opacity="0.35">
              {displayCandles.map((c, i) => {
                const isBull = c.close >= c.open;
                const barH = (c.volume / minMax.maxVol) * volumeHeight;
                const barY = height - padding.bottom - barH;
                const barW = Math.max(1, candleWidth * 0.7);
                const barX = getX(i) - barW / 2;

                return (
                  <rect
                    key={`vol-${i}`}
                    x={barX}
                    y={barY}
                    width={barW}
                    height={barH}
                    fill={isBull ? '#10b981' : '#f43f5e'}
                  />
                );
              })}
            </g>
          )}

          {/* EMA Lines */}
          {showEMA && indicatorsData && (
            <>
              {/* EMA 20 (Cyan) */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                points={displayCandles
                  .map((_, i) => {
                    const val = indicatorsData.ema20[i];
                    return !isNaN(val) ? `${getX(i)},${getY(val)}` : null;
                  })
                  .filter(Boolean)
                  .join(' ')}
              />
              {/* EMA 50 (Amber) */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                points={displayCandles
                  .map((_, i) => {
                    const val = indicatorsData.ema50[i];
                    return !isNaN(val) ? `${getX(i)},${getY(val)}` : null;
                  })
                  .filter(Boolean)
                  .join(' ')}
              />
              {/* EMA 200 (Purple) */}
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.5"
                points={displayCandles
                  .map((_, i) => {
                    const val = indicatorsData.ema200[i];
                    return !isNaN(val) ? `${getX(i)},${getY(val)}` : null;
                  })
                  .filter(Boolean)
                  .join(' ')}
              />
            </>
          )}

          {/* Candlesticks */}
          {displayCandles.map((c, i) => {
            const x = getX(i);
            const isBull = c.close >= c.open;
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
            const barWidth = Math.max(2, candleWidth * 0.7);

            const color = isBull ? '#10b981' : '#f43f5e';

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Real Body */}
                <rect
                  x={x - barWidth / 2}
                  y={bodyTop}
                  width={barWidth}
                  height={bodyHeight}
                  fill={color}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Visual Signal Horizontal Overlays: Entry, TP1, TP2, SL */}
          {signal && (
            <g>
              {/* Entry Level */}
              {signal.levels.entryPrice > 0 && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(signal.levels.entryPrice)}
                    x2={width - padding.right}
                    y2={getY(signal.levels.entryPrice)}
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <rect
                    x={width - padding.right}
                    y={getY(signal.levels.entryPrice) - 9}
                    width={72}
                    height={18}
                    fill="#0e7490"
                    rx="3"
                  />
                  <text
                    x={width - padding.right + 4}
                    y={getY(signal.levels.entryPrice) + 3}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    ENTRY {formatPrice(signal.levels.entryPrice)}
                  </text>
                </g>
              )}

              {/* Take-Profit 1 */}
              {signal.levels.tp1Price > 0 && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(signal.levels.tp1Price)}
                    x2={width - padding.right}
                    y2={getY(signal.levels.tp1Price)}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                  <rect
                    x={width - padding.right}
                    y={getY(signal.levels.tp1Price) - 9}
                    width={72}
                    height={18}
                    fill="#047857"
                    rx="3"
                  />
                  <text
                    x={width - padding.right + 4}
                    y={getY(signal.levels.tp1Price) + 3}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    TP1 {formatPrice(signal.levels.tp1Price)}
                  </text>
                </g>
              )}

              {/* Take-Profit 2 */}
              {signal.levels.tp2Price > 0 && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(signal.levels.tp2Price)}
                    x2={width - padding.right}
                    y2={getY(signal.levels.tp2Price)}
                    stroke="#059669"
                    strokeWidth="1.5"
                    strokeDasharray="6 3"
                  />
                  <rect
                    x={width - padding.right}
                    y={getY(signal.levels.tp2Price) - 9}
                    width={72}
                    height={18}
                    fill="#065f46"
                    rx="3"
                  />
                  <text
                    x={width - padding.right + 4}
                    y={getY(signal.levels.tp2Price) + 3}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    TP2 {formatPrice(signal.levels.tp2Price)}
                  </text>
                </g>
              )}

              {/* Stop-Loss */}
              {signal.levels.stopLossPrice > 0 && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(signal.levels.stopLossPrice)}
                    x2={width - padding.right}
                    y2={getY(signal.levels.stopLossPrice)}
                    stroke="#ef4444"
                    strokeWidth="1.8"
                    strokeDasharray="4 2"
                  />
                  <rect
                    x={width - padding.right}
                    y={getY(signal.levels.stopLossPrice) - 9}
                    width={72}
                    height={18}
                    fill="#b91c1c"
                    rx="3"
                  />
                  <text
                    x={width - padding.right + 4}
                    y={getY(signal.levels.stopLossPrice) + 3}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    SL {formatPrice(signal.levels.stopLossPrice)}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Interactive Crosshair on Mouse Over */}
          {hoverIndex !== null && displayCandles[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="#71717a"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={padding.left}
                y1={getY(displayCandles[hoverIndex].close)}
                x2={width - padding.right}
                y2={getY(displayCandles[hoverIndex].close)}
                stroke="#71717a"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(displayCandles[hoverIndex].close)}
                r="3.5"
                fill="#38bdf8"
              />
            </g>
          )}

          {/* Bottom Time Axis Labels */}
          {displayCandles
            .filter((_, idx) => idx % Math.max(1, Math.floor(displayCandles.length / 6)) === 0)
            .map((c, i) => {
              const date = new Date(c.time);
              const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              return (
                <text
                  key={`time-${i}`}
                  x={getX(candles.indexOf(c) - (candles.length - displayCandles.length))}
                  y={height - padding.bottom + 18}
                  fill="#71717a"
                  fontSize="9.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {label}
                </text>
              );
            })}
        </svg>
      </div>

      {/* Indicator Legend Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-zinc-400 mt-2 pt-2 border-t border-zinc-900">
        <div className="flex items-center gap-4">
          {showEMA && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>EMA 20</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>EMA 50</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span>EMA 200</span>
              </span>
            </>
          )}
          {showBB && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 opacity-60" />
              <span>Bollinger Bands (20,2)</span>
            </span>
          )}
        </div>

        {signal && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-cyan-400">Вход: {signal.levels.entry}</span>
            <span className="text-emerald-400">TP1: {signal.levels.tp1}</span>
            <span className="text-rose-400">SL: {signal.levels.stopLoss}</span>
          </div>
        )}
      </div>
    </div>
  );
};
