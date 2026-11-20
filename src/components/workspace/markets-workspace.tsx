"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MarketChart, Sparkline } from "@/components/charts/market-chart";
import { Icon } from "@/components/ui/icon";
import { usePaperTrading } from "@/components/trading/paper-trading-provider";
import { PageHeader, Panel, Tag } from "@/components/workspace/page-frame";
import { demoAssets, formatCompactNumber, formatINR, type Instrument } from "@/lib/market-data";

type MarketFilter = "India" | "NSE" | "Global";
type SortKey = "symbol" | "changePct" | "pricePaise";

export default function MarketsWorkspace({ initialQuery = "" }: { initialQuery?: string }) {
  const { activeWatchlist, toggleSymbol } = usePaperTrading();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<MarketFilter>("India");
  const [sortKey, setSortKey] = useState<SortKey>("changePct");
  const [descending, setDescending] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return demoAssets
      .filter((instrument) => {
        const matchesFilter = filter === "India" ? instrument.exchange === "NSE" || instrument.exchange === "BSE" : filter === "NSE" ? instrument.exchange === "NSE" : instrument.exchange === "NASDAQ";
        const matchesQuery = !needle || `${instrument.symbol} ${instrument.company} ${instrument.sector}`.toLowerCase().includes(needle);
        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => {
        const comparison = sortKey === "symbol" ? a.symbol.localeCompare(b.symbol) : a[sortKey] - b[sortKey];
        return comparison * (descending ? -1 : 1);
      });
  }, [filter, query, sortKey, descending]);
  const selected: Instrument = demoAssets.find((instrument) => instrument.symbol === selectedSymbol) ?? demoAssets[0];
  const isWatched = activeWatchlist.symbols.includes(selected.symbol);

  const changeSort = (key: SortKey) => {
    if (sortKey === key) setDescending(!descending);
    else {
      setSortKey(key);
      setDescending(key !== "symbol");
    }
  };

  return (
    <main className="workspace-content markets-workspace">
      <PageHeader eyebrow="EXPLORE INSTRUMENTS" title="Markets" description="Browse a small NSE and global sample catalog, then inspect simulated price action." actions={<Tag>DEMO · no live provider</Tag>} />
      <div className="data-status-strip"><span className="data-state-dot" /><strong>SIMULATED SAMPLE DATA</strong><span>Reference prices, movements, volume and candles below are generated for interface practice only.</span><Link href="/settings">Provider status <Icon name="chevron" size={12} /></Link></div>
      <div className="market-controls">
        <form className="market-search-form market-search-live" onSubmit={(event) => event.preventDefault()}>
          <label className="module-search"><Icon name="search" size={16} /><span className="sr-only">Search symbols, companies or sectors</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search RELIANCE, company or sector" /></label>
          <button type="button" className="primary-button" onClick={() => setQuery("")}><Icon name={query ? "close" : "filter"} size={14} />{query ? "Clear" : "All filters"}</button>
        </form>
        <div className="market-filter-tabs" role="tablist" aria-label="Market region">
          {(["India", "NSE", "Global"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={filter === item} className={filter === item ? "market-filter-active" : ""} onClick={() => setFilter(item)}>{item === "India" ? "All India" : item === "NSE" ? "NSE stocks" : "Global sample"}</button>)}
        </div>
      </div>

      <div className="market-explorer-grid">
        <Panel title="Instrument directory" description={`${filtered.length} simulated instruments · click a row to inspect`}>
          <div className="instrument-table-wrap">
            <table className="instrument-table">
              <thead><tr><th>INSTRUMENT</th><th><button type="button" onClick={() => changeSort("pricePaise")}>DEMO PRICE <Icon name="chevron-down" size={11} /></button></th><th><button type="button" onClick={() => changeSort("changePct")}>CHANGE <Icon name="chevron-down" size={11} /></button></th><th className="instrument-volume-head">VOLUME</th><th aria-label="Watchlist action" /></tr></thead>
              <tbody>
                {filtered.map((instrument) => {
                  const watched = activeWatchlist.symbols.includes(instrument.symbol);
                  return (
                    <tr key={instrument.symbol} className={selectedSymbol === instrument.symbol ? "instrument-row-selected" : ""}>
                      <td><button className="instrument-identity" type="button" onClick={() => setSelectedSymbol(instrument.symbol)}><span className={`instrument-avatar tone-${instrument.sector.charCodeAt(0) % 4}`}>{instrument.symbol.slice(0, 1)}</span><span><strong>{instrument.symbol}</strong><small>{instrument.company} · {instrument.exchange}</small></span></button></td>
                      <td><strong className="instrument-price">{formatINR(instrument.pricePaise)}</strong></td>
                      <td><span className={`change-pill ${instrument.changePct >= 0 ? "up" : "down"}`}>{instrument.changePct > 0 ? "+" : ""}{instrument.changePct.toFixed(2)}%</span></td>
                      <td className="instrument-volume-head"><span className="instrument-volume">{formatCompactNumber(instrument.volume)}</span></td>
                      <td><button type="button" className={`watch-toggle${watched ? " is-watched" : ""}`} aria-label={`${watched ? "Remove" : "Add"} ${instrument.symbol} ${watched ? "from" : "to"} watchlist`} aria-pressed={watched} onClick={(event) => { event.stopPropagation(); toggleSymbol(instrument.symbol); }}><Icon name="watchlist" size={16} /></button></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td className="instrument-empty-cell" colSpan={5}>No instruments match this search. Try another symbol or company name.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <aside className="instrument-detail-column">
          <article className="instrument-detail-card">
            <div className="instrument-detail-top"><div><span className="section-kicker">{selected.exchange} · SIMULATED</span><h2>{selected.symbol}</h2><p>{selected.company}</p></div><button className={`watch-toggle watch-toggle-large${isWatched ? " is-watched" : ""}`} type="button" aria-label={`${isWatched ? "Remove" : "Add"} ${selected.symbol} ${isWatched ? "from" : "to"} watchlist`} onClick={() => toggleSymbol(selected.symbol)}><Icon name="watchlist" size={17} /></button></div>
            <strong className="instrument-detail-price">{formatINR(selected.pricePaise)}</strong>
            <span className={`detail-change ${selected.changePct >= 0 ? "positive" : "negative"}`}>{selected.changePct > 0 ? "+" : ""}{selected.changePct.toFixed(2)}% <small>sample daily movement</small></span>
            <div className="detail-stat-grid"><div><span>SECTOR</span><strong>{selected.sector}</strong></div><div><span>MARKET CAP</span><strong>{selected.marketCapCrore ? `₹${formatCompactNumber(selected.marketCapCrore)} Cr` : "Not sampled"}</strong></div><div><span>VOLUME</span><strong>{selected.volume ? formatCompactNumber(selected.volume) : "Not sampled"}</strong></div><div><span>DATA MODE</span><strong>Simulated</strong></div></div>
            <div className="detail-chart-wrap"><MarketChart symbol={selected.symbol} title={`${selected.symbol} simulated chart`} showVolume={false} /></div>
            <div className="detail-actions"><Link href={`/paper-trading?symbol=${selected.symbol}`} className="primary-link">Practice trade <Icon name="chevron" size={13} /></Link><Link href={`/watchlist?symbol=${selected.symbol}`} className="secondary-link">Add to a list</Link></div>
          </article>
          <article className="market-context-card"><div className="section-heading"><div><h2>Instrument context</h2><p>Display-only sample data</p></div><Sparkline symbol={selected.symbol} positive={selected.changePct >= 0} /></div><p>This explorer uses a replaceable market-data adapter. The current local dataset is synthetic and is not suitable for investment decisions or historical analysis.</p></article>
        </aside>
      </div>
    </main>
  );
}
