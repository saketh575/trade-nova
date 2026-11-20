import WatchlistWorkspace from "@/components/workspace/watchlist-workspace";

export default async function WatchlistPage({ searchParams }: PageProps<"/watchlist">) {
  const { symbol } = await searchParams;
  return <WatchlistWorkspace initialSymbol={typeof symbol === "string" ? symbol.toUpperCase() : ""} />;
}
