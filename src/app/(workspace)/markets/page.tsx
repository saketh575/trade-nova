import MarketsWorkspace from "@/components/workspace/markets-workspace";

export default async function MarketsPage({
  searchParams,
}: PageProps<"/markets">) {
  const { q } = await searchParams;
  return <MarketsWorkspace initialQuery={typeof q === "string" ? q : ""} />;
}
