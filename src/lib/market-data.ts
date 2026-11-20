export type MarketMode = "demo" | "delayed" | "live";
export type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y";

export interface Instrument {
  symbol: string;
  company: string;
  exchange: "NSE" | "BSE" | "NASDAQ";
  sector: string;
  pricePaise: number;
  changePct: number;
  marketCapCrore: number;
  volume: number;
}

export interface DemoIndex {
  symbol: string;
  name: string;
  displayValue: string;
  changePct: number;
  direction: "up" | "down";
}

export interface Candle {
  step: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataProvider {
  readonly mode: MarketMode;
  readonly displayName: string;
  listInstruments(): Instrument[];
  getInstrument(symbol: string): Instrument | undefined;
  getCandles(symbol: string, timeframe: Timeframe): Candle[];
}

const instruments: Instrument[] = [
  { symbol: "RELIANCE", company: "Reliance Industries", exchange: "NSE", sector: "Energy", pricePaise: 126450, changePct: 1.24, marketCapCrore: 1712_000, volume: 4210000 },
  { symbol: "TCS", company: "Tata Consultancy Services", exchange: "NSE", sector: "Information Technology", pricePaise: 384250, changePct: 0.62, marketCapCrore: 1398_000, volume: 1120000 },
  { symbol: "INFY", company: "Infosys", exchange: "NSE", sector: "Information Technology", pricePaise: 151675, changePct: -0.38, marketCapCrore: 628_000, volume: 3620000 },
  { symbol: "HDFCBANK", company: "HDFC Bank", exchange: "NSE", sector: "Financial Services", pricePaise: 171840, changePct: 0.91, marketCapCrore: 1301_000, volume: 5820000 },
  { symbol: "ICICIBANK", company: "ICICI Bank", exchange: "NSE", sector: "Financial Services", pricePaise: 128450, changePct: 1.08, marketCapCrore: 903_000, volume: 4080000 },
  { symbol: "SBIN", company: "State Bank of India", exchange: "NSE", sector: "Financial Services", pricePaise: 80690, changePct: 1.73, marketCapCrore: 721_000, volume: 12600000 },
  { symbol: "ITC", company: "ITC Limited", exchange: "NSE", sector: "Consumer Goods", pricePaise: 41215, changePct: -0.44, marketCapCrore: 516_000, volume: 3470000 },
  { symbol: "TATAMOTORS", company: "Tata Motors", exchange: "NSE", sector: "Automobile", pricePaise: 69080, changePct: -1.32, marketCapCrore: 254_000, volume: 7340000 },
  { symbol: "LT", company: "Larsen & Toubro", exchange: "NSE", sector: "Industrials", pricePaise: 358720, changePct: 0.76, marketCapCrore: 494_000, volume: 845000 },
  { symbol: "BHARTIARTL", company: "Bharti Airtel", exchange: "NSE", sector: "Telecommunication", pricePaise: 186350, changePct: 1.41, marketCapCrore: 1102_000, volume: 1680000 },
  { symbol: "AAPL", company: "Apple Inc.", exchange: "NASDAQ", sector: "Technology", pricePaise: 22450, changePct: 0.84, marketCapCrore: 0, volume: 0 },
  { symbol: "NVDA", company: "NVIDIA Corporation", exchange: "NASDAQ", sector: "Technology", pricePaise: 13850, changePct: 1.92, marketCapCrore: 0, volume: 0 },
];

export const demoIndices: DemoIndex[] = [
  { symbol: "NIFTY 50", name: "NIFTY 50", displayValue: "24,854.05", changePct: 0.82, direction: "up" },
  { symbol: "SENSEX", name: "SENSEX", displayValue: "81,587.76", changePct: 0.64, direction: "up" },
  { symbol: "BANKNIFTY", name: "BANK NIFTY", displayValue: "56,214.30", changePct: -0.28, direction: "down" },
  { symbol: "INDIAVIX", name: "INDIA VIX", displayValue: "14.28", changePct: -2.16, direction: "down" },
];

function buildDemoCandles(symbol: string, timeframe: Timeframe): Candle[] {
  const instrument = instruments.find((item) => item.symbol === symbol);
  const index = demoIndices.find((item) => item.symbol === symbol);
  const base = instrument
    ? instrument.pricePaise / 100
    : index
      ? Number(index.displayValue.replace(/,/g, ""))
      : 1_000;
  const seed = [...symbol].reduce((total, char) => total + char.charCodeAt(0), 0);
  const count = timeframe === "1D" ? 48 : timeframe === "1W" ? 56 : timeframe === "1M" ? 64 : timeframe === "3M" ? 72 : 80;
  const volatility = timeframe === "1D" ? 0.003 : 0.012;
  const candles: Candle[] = [];
  let previous = base * (1 - 0.018);

  for (let step = 0; step < count; step += 1) {
    const trend = (step / count - 0.45) * 0.035;
    const cycle = Math.sin((step + seed) * 0.31) * volatility + Math.cos((step + seed) * 0.13) * volatility * 0.42;
    const close = Math.max(0.01, base * (1 + trend + cycle));
    const open = previous;
    const wick = base * (0.0015 + Math.abs(Math.sin(step + seed)) * 0.0025);
    candles.push({
      step,
      open,
      close,
      high: Math.max(open, close) + wick,
      low: Math.max(0.01, Math.min(open, close) - wick),
      volume: Math.round(220_000 + Math.abs(Math.sin(step * 0.57 + seed)) * 1_200_000),
    });
    previous = close;
  }

  return candles;
}

export const demoMarketDataProvider: MarketDataProvider = {
  mode: "demo",
  displayName: "Local simulated sample data",
  listInstruments: () => instruments.filter((item) => item.exchange === "NSE" || item.exchange === "BSE"),
  getInstrument: (symbol) => instruments.find((item) => item.symbol === symbol.toUpperCase()),
  getCandles: buildDemoCandles,
};

export const demoAssets = instruments;

export function formatINR(paise: number, options?: { compact?: boolean; decimals?: number }): string {
  const value = Number.isFinite(paise) ? paise / 100 : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: options?.compact ? "compact" : "standard",
    minimumFractionDigits: options?.decimals ?? 2,
    maximumFractionDigits: options?.decimals ?? 2,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
