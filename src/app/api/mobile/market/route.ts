import { demoIndices, demoMarketDataProvider, type Timeframe } from "@/lib/market-data";

const timeframes = new Set<Timeframe>(["1D", "1W", "1M", "3M", "1Y"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase() ?? "NIFTY 50";
  const requestedTimeframe = searchParams.get("timeframe") as Timeframe | null;
  const timeframe = requestedTimeframe && timeframes.has(requestedTimeframe) ? requestedTimeframe : "1D";
  const knownInstrument = demoMarketDataProvider.listInstruments().some((instrument) => instrument.symbol === symbol);
  const knownIndex = demoIndices.some((index) => index.symbol === symbol);
  if (!knownInstrument && !knownIndex) {
    return Response.json({ error: "Instrument is not available in the configured market adapter." }, { status: 404 });
  }

  return Response.json({
    mode: demoMarketDataProvider.mode.toUpperCase(),
    provider: demoMarketDataProvider.displayName,
    updatedAt: null,
    indices: demoIndices,
    instruments: demoMarketDataProvider.listInstruments(),
    candles: demoMarketDataProvider.getCandles(symbol, timeframe),
    timeframe,
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
