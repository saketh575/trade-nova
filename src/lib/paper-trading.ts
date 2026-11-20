import { demoMarketDataProvider } from "./market-data";

export const STARTING_CASH_PAISE = 100_000_000;

export type TradeSide = "buy" | "sell";
export type OrderType = "market" | "limit";
export type OrderStatus = "filled" | "pending" | "cancelled";

export interface PaperOrder {
  id: string;
  symbol: string;
  side: TradeSide;
  orderType: OrderType;
  quantity: number;
  status: OrderStatus;
  pricePaise: number;
  limitPricePaise?: number;
  stopLossPaise?: number;
  targetPricePaise?: number;
  feesPaise: number;
  createdAt: string;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}

export interface EquitySnapshot {
  at: string;
  valuePaise: number;
}

export interface PaperTradingState {
  version: 1;
  cashPaise: number;
  orders: PaperOrder[];
  watchlists: Watchlist[];
  activeWatchlistId: string;
  equitySnapshots: EquitySnapshot[];
}

export interface Holding {
  symbol: string;
  quantity: number;
  averagePricePaise: number;
  marketValuePaise: number;
  unrealizedPnLPaise: number;
  realizedPnLPaise: number;
}

export interface PortfolioSummary {
  cashPaise: number;
  investedPaise: number;
  marketValuePaise: number;
  totalValuePaise: number;
  realizedPnLPaise: number;
  unrealizedPnLPaise: number;
  totalPnLPaise: number;
  returnPct: number;
  holdings: Holding[];
}

export interface NewOrder {
  symbol: string;
  side: TradeSide;
  orderType: OrderType;
  quantity: number;
  referencePricePaise?: number;
  limitPricePaise?: number;
  stopLossPaise?: number;
  targetPricePaise?: number;
}

export function createInitialPaperState(): PaperTradingState {
  return {
    version: 1,
    cashPaise: STARTING_CASH_PAISE,
    orders: [],
    watchlists: [{ id: "core-watch", name: "Core watch", symbols: ["RELIANCE", "TCS", "INFY", "HDFCBANK"] }],
    activeWatchlistId: "core-watch",
    equitySnapshots: [{ at: new Date().toISOString(), valuePaise: STARTING_CASH_PAISE }],
  };
}

export function isPaperTradingState(value: unknown): value is PaperTradingState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PaperTradingState>;
  return candidate.version === 1
    && Number.isSafeInteger(candidate.cashPaise)
    && Array.isArray(candidate.orders)
    && candidate.orders.every((order) => order && typeof order.id === "string" && typeof order.symbol === "string" && Number.isSafeInteger(order.quantity) && Number.isSafeInteger(order.pricePaise))
    && Array.isArray(candidate.watchlists)
    && candidate.watchlists.length > 0
    && candidate.watchlists.every((list) => list && typeof list.id === "string" && typeof list.name === "string" && Array.isArray(list.symbols) && list.symbols.every((symbol) => typeof symbol === "string"))
    && typeof candidate.activeWatchlistId === "string"
    && candidate.watchlists.some((list) => list.id === candidate.activeWatchlistId)
    && Array.isArray(candidate.equitySnapshots)
    && candidate.equitySnapshots.every((snapshot) => snapshot && typeof snapshot.at === "string" && Number.isSafeInteger(snapshot.valuePaise));
}

export function calculateFees(notionalPaise: number): number {
  return Math.max(100, Math.round(notionalPaise * 0.0003));
}

export function derivePortfolio(
  state: PaperTradingState,
  currentPricesPaise: Readonly<Record<string, number>> = {},
): PortfolioSummary {
  const ledger = new Map<string, { quantity: number; costPaise: number; realizedPnLPaise: number }>();
  const filled = state.orders
    .filter((order) => order.status === "filled")
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const order of filled) {
    const row = ledger.get(order.symbol) ?? { quantity: 0, costPaise: 0, realizedPnLPaise: 0 };
    const notional = order.pricePaise * order.quantity;
    if (order.side === "buy") {
      row.quantity += order.quantity;
      row.costPaise += notional + order.feesPaise;
    } else if (row.quantity > 0) {
      const averageCost = row.costPaise / row.quantity;
      row.realizedPnLPaise += Math.round((order.pricePaise - averageCost) * order.quantity) - order.feesPaise;
      row.quantity -= order.quantity;
      row.costPaise = row.quantity === 0 ? 0 : Math.round(averageCost * row.quantity);
    }
    ledger.set(order.symbol, row);
  }

  const holdings = [...ledger.entries()]
    .filter(([, row]) => row.quantity > 0)
    .map(([symbol, row]) => {
      const quote = demoMarketDataProvider.getInstrument(symbol);
      const averagePricePaise = Math.round(row.costPaise / row.quantity);
      const marketPricePaise = currentPricesPaise[symbol] ?? quote?.pricePaise ?? 0;
      const marketValuePaise = marketPricePaise * row.quantity;
      return {
        symbol,
        quantity: row.quantity,
        averagePricePaise,
        marketValuePaise,
        unrealizedPnLPaise: marketValuePaise - row.costPaise,
        realizedPnLPaise: row.realizedPnLPaise,
      };
    });
  const realizedPnLPaise = [...ledger.values()].reduce((sum, row) => sum + row.realizedPnLPaise, 0);
  const investedPaise = holdings.reduce((sum, holding) => sum + holding.averagePricePaise * holding.quantity, 0);
  const marketValuePaise = holdings.reduce((sum, holding) => sum + holding.marketValuePaise, 0);
  const unrealizedPnLPaise = holdings.reduce((sum, holding) => sum + holding.unrealizedPnLPaise, 0);
  const totalValuePaise = state.cashPaise + marketValuePaise;
  const totalPnLPaise = totalValuePaise - STARTING_CASH_PAISE;

  return {
    cashPaise: state.cashPaise,
    investedPaise,
    marketValuePaise,
    totalValuePaise,
    realizedPnLPaise,
    unrealizedPnLPaise,
    totalPnLPaise,
    returnPct: (totalPnLPaise / STARTING_CASH_PAISE) * 100,
    holdings,
  };
}

export function createOrderId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
