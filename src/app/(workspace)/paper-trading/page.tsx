import PaperTradingTerminal from "@/components/trading/paper-trading-terminal";

export default async function PaperTradingPage({ searchParams }: PageProps<"/paper-trading">) {
  const { symbol, side } = await searchParams;
  return <PaperTradingTerminal initialSymbol={typeof symbol === "string" ? symbol.toUpperCase() : "RELIANCE"} initialSide={side === "sell" ? "sell" : "buy"} />;
}
