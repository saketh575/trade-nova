"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePaperTrading } from "@/components/trading/paper-trading-provider";
import { Icon } from "@/components/ui/icon";
import { PageHeader, Tag } from "@/components/workspace/page-frame";
import { demoAssets, formatINR } from "@/lib/market-data";

export default function WatchlistWorkspace({ initialSymbol = "" }: { initialSymbol?: string }) {
  const { state, activeWatchlist, createWatchlist, deleteWatchlist, selectWatchlist, toggleSymbol } = usePaperTrading();
  const [query, setQuery] = useState(initialSymbol);
  const [listName, setListName] = useState("");
  const [sortBy, setSortBy] = useState<"symbol" | "changePct">("symbol");
  const [message, setMessage] = useState("");
  const instruments = useMemo(() => activeWatchlist.symbols.map((symbol) => demoAssets.find((asset) => asset.symbol === symbol)).filter((asset) => asset !== undefined).sort((a, b) => sortBy === "symbol" ? a.symbol.localeCompare(b.symbol) : b.changePct - a.changePct), [activeWatchlist.symbols, sortBy]);
  const suggestions = demoAssets.filter((asset) => asset.exchange === "NSE" && query.trim() && !activeWatchlist.symbols.includes(asset.symbol) && `${asset.symbol} ${asset.company}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5);

  const addList = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = createWatchlist(listName);
    setMessage(result.message);
    if (result.ok) setListName("");
  };

  return (
    <main className="workspace-content">
      <PageHeader eyebrow="PERSONAL MARKET TRACKING" title="Watchlists" description="Keep an eye on instruments with local, browser-persisted demo lists." actions={<Tag>LOCAL DEMO STORAGE</Tag>} />
      <div className="data-status-strip"><span className="data-state-dot" /><strong>SIMULATED PRICES</strong><span>Quotes and sparklines are interface examples; they are not current market data.</span></div>
      <div className="watchlist-workspace-grid">
        <aside className="watchlist-sidebar-panel">
          <div className="watchlist-sidebar-heading"><span className="section-kicker">YOUR LISTS</span><span>{state.watchlists.length.toString().padStart(2, "0")}</span></div>
          <div className="watchlist-switcher-list">
            {state.watchlists.map((list) => <button type="button" className={`watchlist-switcher-item${list.id === activeWatchlist.id ? " selected" : ""}`} key={list.id} onClick={() => selectWatchlist(list.id)}><span><Icon name="watchlist" size={15} />{list.name}</span><small>{list.symbols.length}</small></button>)}
          </div>
          <form className="create-list-form" onSubmit={addList}><label htmlFor="watchlist-name">Create a watchlist</label><div><input id="watchlist-name" value={listName} onChange={(event) => setListName(event.target.value)} placeholder="e.g. Long-term ideas" maxLength={32} /><button type="submit" aria-label="Create watchlist"><Icon name="plus" size={15} /></button></div></form>
          {state.watchlists.length > 1 && <button className="watchlist-delete-list" type="button" onClick={() => { const result = deleteWatchlist(activeWatchlist.id); setMessage(result.message); }}><Icon name="trash" size={13} /> Delete selected list</button>}
        </aside>
        <section className="watchlist-main-panel">
          <div className="watchlist-page-toolbar"><div><span className="section-kicker">ACTIVE WATCHLIST</span><h2>{activeWatchlist.name}</h2><p>{instruments.length} instruments · saved on this browser</p></div><div className="watchlist-toolbar-actions"><label className="module-search"><Icon name="search" size={15} /><span className="sr-only">Search instruments to add</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Add symbol..." /></label><label className="sort-select-wrap"><span className="sr-only">Sort watchlist</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as "symbol" | "changePct")}><option value="symbol">Sort: Symbol</option><option value="changePct">Sort: Change</option></select></label></div></div>
          {suggestions.length > 0 && <div className="watchlist-suggestions" role="listbox" aria-label="Matching instruments">{suggestions.map((asset) => <button key={asset.symbol} type="button" onClick={() => { toggleSymbol(asset.symbol); setQuery(""); setMessage(`${asset.symbol} added to ${activeWatchlist.name}.`); }}><span><strong>{asset.symbol}</strong><small>{asset.company}</small></span><Icon name="plus" size={15} /></button>)}</div>}
          {message && <div className="inline-feedback" role="status">{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss message"><Icon name="close" size={13} /></button></div>}
          {instruments.length ? <div className="watchlist-table-wrap"><table className="watchlist-table"><thead><tr><th>INSTRUMENT</th><th>SIMULATED PRICE</th><th>DAY CHANGE</th><th>DEMO TREND</th><th>MARKET</th><th /></tr></thead><tbody>{instruments.map((instrument) => <tr key={instrument.symbol}><td><Link href={`/markets?q=${instrument.symbol}`} className="watchlist-instrument"><span className="instrument-avatar">{instrument.symbol.slice(0, 1)}</span><span><strong>{instrument.symbol}</strong><small>{instrument.company}</small></span></Link></td><td><strong>{formatINR(instrument.pricePaise)}</strong></td><td><span className={`change-pill ${instrument.changePct >= 0 ? "up" : "down"}`}>{instrument.changePct > 0 ? "+" : ""}{instrument.changePct.toFixed(2)}%</span></td><td><svg className={`mini-sparkline${instrument.changePct >= 0 ? " mini-sparkline-positive" : " mini-sparkline-negative"}`} viewBox="0 0 100 34" aria-label={`${instrument.symbol} simulated trend`}><polyline points="0,24 12,20 21,23 34,12 45,18 57,7 69,12 82,6 100,9" fill="none" stroke="currentColor" strokeWidth="2" /></svg></td><td><span className="market-exchange-tag">{instrument.exchange} · DEMO</span></td><td><button className="watch-remove-button" type="button" aria-label={`Remove ${instrument.symbol}`} onClick={() => { toggleSymbol(instrument.symbol); setMessage(`${instrument.symbol} removed from ${activeWatchlist.name}.`); }}><Icon name="close" size={15} /></button></td></tr>)}</tbody></table></div> : <div className="watchlist-empty-state"><div className="empty-visual"><span className="empty-orbit orbit-one" /><span className="empty-orbit orbit-two" /><Icon name="watchlist" size={29} /></div><h3>This list is ready for its first symbol</h3><p>Search a demo NSE instrument above or open the Markets explorer to add symbols to this local practice list.</p><Link className="primary-link" href="/markets">Browse the market directory <Icon name="chevron" size={13} /></Link></div>}
          <div className="watchlist-footnote"><Icon name="spark" size={13} /> Lists are stored in local browser storage and are not synced to an account.</div>
        </section>
      </div>
    </main>
  );
}
