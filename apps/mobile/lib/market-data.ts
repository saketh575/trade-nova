import {
  demoAssets,
  demoIndices,
  demoMarketDataProvider,
  type Candle,
  type DemoIndex,
  type Instrument,
  type MarketMode,
  type Timeframe,
} from '../../../src/lib/market-data';

export type MarketModeLabel = Uppercase<MarketMode>;

export interface MarketSnapshot {
  mode: MarketModeLabel;
  provider: string;
  updatedAt: string | null;
  indices: DemoIndex[];
  instruments: Instrument[];
  candles: Candle[];
  timeframe: Timeframe;
}

export const marketApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '') ?? '';

export function getDemoMarketSnapshot(
  symbol = 'NIFTY 50',
  timeframe: Timeframe = '1D',
): MarketSnapshot {
  return {
    mode: 'DEMO',
    provider: demoMarketDataProvider.displayName,
    updatedAt: null,
    indices: demoIndices,
    instruments: demoAssets.filter((instrument) => instrument.exchange === 'NSE' || instrument.exchange === 'BSE'),
    candles: demoMarketDataProvider.getCandles(symbol, timeframe),
    timeframe,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isInstrument(value: unknown): value is Instrument {
  if (!isRecord(value)) return false;
  return typeof value.symbol === 'string'
    && typeof value.company === 'string'
    && typeof value.sector === 'string'
    && (value.exchange === 'NSE' || value.exchange === 'BSE' || value.exchange === 'NASDAQ')
    && isFiniteNumber(value.pricePaise) && value.pricePaise > 0
    && isFiniteNumber(value.changePct)
    && isFiniteNumber(value.marketCapCrore) && value.marketCapCrore >= 0
    && isFiniteNumber(value.volume) && value.volume >= 0;
}

function isIndex(value: unknown): value is DemoIndex {
  if (!isRecord(value)) return false;
  return typeof value.symbol === 'string'
    && typeof value.name === 'string'
    && typeof value.displayValue === 'string'
    && isFiniteNumber(value.changePct)
    && (value.direction === 'up' || value.direction === 'down');
}

function isCandle(value: unknown): value is Candle {
  if (!isRecord(value)) return false;
  const { step, open, high, low, close, volume } = value;
  if (!isFiniteNumber(step) || !isFiniteNumber(open) || !isFiniteNumber(high)
    || !isFiniteNumber(low) || !isFiniteNumber(close) || !isFiniteNumber(volume)) return false;
  return step >= 0
    && open > 0
    && high >= Math.max(open, close)
    && low > 0 && low <= Math.min(open, close)
    && volume >= 0;
}

function isMarketSnapshot(value: unknown): value is MarketSnapshot {
  if (!isRecord(value)) return false;
  return (value.mode === 'LIVE' || value.mode === 'DELAYED' || value.mode === 'DEMO')
    && typeof value.provider === 'string' && value.provider.length > 0
    && (value.updatedAt === null || (typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt))))
    && (value.timeframe === '1D' || value.timeframe === '1W' || value.timeframe === '1M' || value.timeframe === '3M' || value.timeframe === '1Y')
    && Array.isArray(value.indices) && value.indices.every(isIndex)
    && Array.isArray(value.instruments) && value.instruments.every(isInstrument)
    && Array.isArray(value.candles) && value.candles.every(isCandle);
}

export async function fetchMarketSnapshot(
  symbol = 'NIFTY 50',
  timeframe: Timeframe = '1D',
): Promise<MarketSnapshot> {
  if (!marketApiBaseUrl) return getDemoMarketSnapshot(symbol, timeframe);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const url = new URL(`${marketApiBaseUrl}/api/mobile/market`);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('timeframe', timeframe);
    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) throw new Error(`Market service returned HTTP ${response.status}.`);
    const payload: unknown = await response.json();
    if (!isMarketSnapshot(payload)) throw new Error('Market service returned an unsupported response.');
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export function currentPrices(snapshot: MarketSnapshot | null): Record<string, number> {
  return Object.fromEntries((snapshot?.instruments ?? []).map(({ symbol, pricePaise }) => [symbol, pricePaise]));
}

export function currentInstrument(symbol: string, snapshot: MarketSnapshot | null): Instrument | undefined {
  return snapshot?.instruments.find((item) => item.symbol === symbol)
    ?? demoAssets.find((item) => item.symbol === symbol);
}
