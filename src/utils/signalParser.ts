import { ParsedSignal } from '../types/quant';

/**
 * Extracts numeric price value from text strings like "$65,400", "65400 USDT", "64,000 - 64,500"
 */
function extractFirstPrice(text: string): number {
  if (!text) return 0;
  // Clean commas and extract first float
  const cleaned = text.replace(/,/g, '');
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Parses raw text produced by the AI model adhering to the strict quantitative signal prompt
 */
export function parseQuantSignalText(text: string, defaultSymbol = 'BTC/USDT', currentPrice = 0): ParsedSignal {
  const signalMatch = text.match(/⚡️?\s*СИГНАЛ:\s*\[?(LONG|SHORT|HOLD\s*(?:\([^)]*\))?)\]?/i);
  let type: ParsedSignal['type'] = 'HOLD (ВНЕ РЫНКА)';
  if (signalMatch) {
    const rawType = signalMatch[1].toUpperCase();
    if (rawType.includes('LONG')) type = 'LONG';
    else if (rawType.includes('SHORT')) type = 'SHORT';
    else type = 'HOLD (ВНЕ РЫНКА)';
  } else if (/LONG/i.test(text) && !/SHORT/i.test(text)) {
    type = 'LONG';
  } else if (/SHORT/i.test(text)) {
    type = 'SHORT';
  }

  // Direction
  const dirMatch = text.match(/🎯\s*Направление:\s*\[?([^\]\n]+)\]?/i);
  let direction: ParsedSignal['direction'] = 'Ожидание';
  if (dirMatch) {
    const d = dirMatch[1].trim();
    if (/Покуп/i.test(d)) direction = 'Покупка';
    else if (/Продаж/i.test(d)) direction = 'Продажа';
    else direction = 'Ожидание';
  } else {
    direction = type === 'LONG' ? 'Покупка' : type === 'SHORT' ? 'Продажа' : 'Ожидание';
  }

  // Asset
  const assetMatch = text.match(/📊\s*Актив:\s*\[?([^\]\n]+)\]?/i);
  const asset = assetMatch ? assetMatch[1].trim().replace(/[\[\]]/g, '') : defaultSymbol;

  // Levels
  const entryMatch = text.match(/[-•*]?\s*Вход:\s*\[?([^\]\n]+)\]?/i);
  const tp1Match = text.match(/[-•*]?\s*Take-Profit\s*1:\s*\[?([^\]\n]+)\]?/i);
  const tp2Match = text.match(/[-•*]?\s*Take-Profit\s*2:\s*\[?([^\]\n]+)\]?/i);
  const slMatch = text.match(/[-•*]?\s*Stop-Loss:\s*\[?([^\]\n]+)\]?/i);

  const entryStr = entryMatch ? entryMatch[1].trim().replace(/[\[\]]/g, '') : `${currentPrice || 'Текущая цена'}`;
  const tp1Str = tp1Match ? tp1Match[1].trim().replace(/[\[\]]/g, '') : 'Не задан';
  const tp2Str = tp2Match ? tp2Match[1].trim().replace(/[\[\]]/g, '') : 'Не задан';
  const slStr = slMatch ? slMatch[1].trim().replace(/[\[\]]/g, '') : 'Не задан';

  const entryPrice = extractFirstPrice(entryStr) || currentPrice;
  const tp1Price = extractFirstPrice(tp1Str);
  const tp2Price = extractFirstPrice(tp2Str);
  const stopLossPrice = extractFirstPrice(slStr);

  // Technical justification
  const trendMatch = text.match(/1\.\s*Динамика цены и тренд:\s*\[?([^\]\n\r]+)\]?/i);
  const indMatch = text.match(/2\.\s*Индикаторы:\s*\[?([^\]\n\r]+)\]?/i);
  const volMatch = text.match(/3\.\s*Объемы:\s*\[?([^\]\n\r]+)\]?/i);

  const trend = trendMatch ? trendMatch[1].trim().replace(/[\[\]]/g, '') : 'Анализ структуры локального тренда';
  const indicators = indMatch ? indMatch[1].trim().replace(/[\[\]]/g, '') : 'Показания RSI, MACD и скользящих средних';
  const volume = volMatch ? volMatch[1].trim().replace(/[\[\]]/g, '') : 'Динамика объемов и профиль ликвидности';

  // Risk evaluation
  const probMatch = text.match(/[-•*]?\s*Вероятность(?:\s*отработки(?:\s*сценария)?)?:\s*\[?(\d+)/i);
  const prob = probMatch ? parseInt(probMatch[1], 10) : (type === 'HOLD (ВНЕ РЫНКА)' ? 50 : 70);

  const rrMatch = text.match(/[-•*]?\s*(?:Коэффициент\s*)?(?:Риск\/Прибыль|\(R:R\)|R:R):\s*\[?([^\]\n\r]+)\]?/i);
  const riskRewardRatio = rrMatch ? rrMatch[1].trim().replace(/[\[\]]/g, '') : '1:2.0';

  const invMatch = text.match(/[-•*]?\s*Ключевой триггер отмены:\s*\[?([^\]\n\r]+)\]?/i);
  const invalidationTrigger = invMatch ? invMatch[1].trim().replace(/[\[\]]/g, '') : `Пробой уровня Stop-Loss (${slStr})`;

  return {
    id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    direction,
    asset,
    levels: {
      entry: entryStr,
      entryPrice,
      tp1: tp1Str,
      tp1Price,
      tp2: tp2Str,
      tp2Price,
      stopLoss: slStr,
      stopLossPrice,
    },
    justification: {
      trend,
      indicators,
      volume,
    },
    risk: {
      probability: Math.min(100, Math.max(0, prob)),
      riskRewardRatio,
      invalidationTrigger,
    },
    rawText: text,
    timestamp: Date.now(),
  };
}

/**
 * Formats a signal into the strict template string ready to be copied
 */
export function formatSignalTemplate(signal: ParsedSignal): string {
  return `⚡️ СИГНАЛ: [${signal.type}]
🎯 Направление: [${signal.direction}]
📊 Актив: [${signal.asset}]

🔢 ЦЕНОВЫЕ УРОВНИ:
- Вход: [${signal.levels.entry}]
- Take-Profit 1: [${signal.levels.tp1}]
- Take-Profit 2: [${signal.levels.tp2}]
- Stop-Loss: [${signal.levels.stopLoss}]

📈 ТЕХНИЧЕСКОЕ ОБОСНОВАНИЕ (максимум 3 пункта):
1. Динамика цены и тренд: [${signal.justification.trend}]
2. Индикаторы: [${signal.justification.indicators}]
3. Объемы: [${signal.justification.volume}]

⚠️ ОЦЕНКА РИСКА:
- Вероятность отработки сценария: [${signal.risk.probability}%]
- Коэффициент Риск/Прибыль (R:R): [${signal.risk.riskRewardRatio}]
- Ключевой триггер отмены: [${signal.risk.invalidationTrigger}]`;
}
