"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MarketChart, Sparkline } from "@/components/charts/market-chart";
import { Icon } from "@/components/ui/icon";
import { usePaperTrading } from "@/components/trading/paper-trading-provider";
import { demoAssets, demoIndices, formatINR } from "@/lib/market-data";

const sectorSamples = [
  { label: "Financials", change: 1.18, color: "var(--lime)" },
  { label: "Energy", change: 0.74, color: "var(--cyan)" },
  { label: "Technology", change: -0.32, color: "var(--amber)" },
  { label: "Auto", change: -0.86, color: "var(--red)" },
  { label: "Consumer", change: 0.21, color: "var(--violet)" },
];

export default function Dashboard() {
  const { state, activeWatchlist, summary, toggleSymbol } = usePaperTrading();
  const [selectedSymbol, setSelectedSymbol] = useState("NIFTY 50");
  const watchlistInstruments = activeWatchlist.symbols
    .map((symbol) => demoAssets.find((instrument) => instrument.symbol === symbol))
    .filter((instrument) => instrument !== undefined);
  const nseAssets = demoAssets.filter((item) => item.exchange === "NSE");
  const gainers = nseAssets.slice().sort((a, b) => b.changePct - a.changePct).slice(0, 3);
  const losers = nseAssets.slice().sort((a, b) => a.changePct - b.changePct).slice(0, 3);
  const advancingCount = nseAssets.filter((item) => item.changePct > 0).length;
  const decliningCount = nseAssets.filter((item) => item.changePct < 0).length;
  const advancingPct = nseAssets.length ? (advancingCount / nseAssets.length) * 100 : 0;
  const recentOrders = state.orders.slice(0, 4);
  const openPositions = summary.holdings.length;
  const sessionOrderCount = useMemo(() => state.orders.filter((order) => order.status === "filled" && new Date(order.createdAt).toDateString() === new Date().toDateString()).length, [state.orders]);

  return (
    <main className="dashboard-content overview-dashboard">
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> EDUCATIONAL MARKET WORKSPACE</div>
          <h1>Good to see you, trader <Icon className="welcome-spark" name="spark" size={19} /></h1>
          <p className="welcome-subtitle">A focused view of your practice account and the market landscape.</p>
        </div>
        <div className="session-status"><span className="session-status-dot" /><span><strong>DEMO SESSION</strong><small>Exchange hours not connected</small></span></div>
      </section>

      <div className="demo-banner">
        <span className="demo-mark"><Icon name="spark" size={16} /></span>
        <span><strong>Simulated demo mode</strong><span className="banner-divider">/</span> All prices and charts on this workspace are illustrative, not live, delayed, or historical market data.</span>
        <Link className="demo-mode-link" href="/settings">Data status <Icon name="chevron" size={13} /></Link>
      </div>

      <section className="market-section">
        <div className="section-heading">
          <div><h2>Indian indices</h2><p>Simulated reference values · market status unavailable</p></div>
          <Link className="text-button" href="/markets">Market explorer <Icon name="chevron" size={14} /></Link>
        </div>
        <div className="index-grid">
          {demoIndices.map((index, indexNumber) => (
            <article className="index-card index-card-premium" key={index.symbol}>
              <div className="index-topline"><span className="index-symbol">NSE · DEMO INDEX</span><span className="demo-dot-label">SIMULATED</span></div>
              <h3>{index.name}</h3>
              <div className="index-value-row"><strong>{index.displayValue}</strong><span className={index.changePct >= 0 ? "positive" : "negative"}>{index.changePct > 0 ? "+" : ""}{index.changePct.toFixed(2)}%</span></div>
              <div className="index-card-bottom">
                <span className={`direction-label${index.changePct >= 0 ? " direction-up" : " direction-down"}`}>
                  <Icon name={index.changePct >= 0 ? "arrow-up" : "arrow-down"} size={12} /> Sample movement
                </span>
                <svg className={`sparkline${index.changePct >= 0 ? " sparkline-up" : " sparkline-down"}`} viewBox="0 0 82 28" aria-label={`${index.name} simulated trend`}>
                  <polyline points={indexNumber % 2 === 0 ? "0,24 12,20 21,22 32,13 44,17 53,8 64,11 75,4 82,7" : "0,5 12,8 21,6 32,13 44,11 53,20 64,16 75,23 82,20"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-stat-grid">
        <article className="overview-stat-card overview-stat-primary"><span className="overview-stat-icon"><Icon name="portfolio" size={17} /></span><span className="card-kicker">PAPER PORTFOLIO VALUE</span><strong>{formatINR(summary.totalValuePaise)}</strong><small>Cash + demo-valued holdings</small></article>
        <article className="overview-stat-card"><span className="overview-stat-icon"><Icon name="arrow-up" size={17} /></span><span className="card-kicker">TOTAL PAPER P&amp;L</span><strong className={summary.totalPnLPaise >= 0 ? "positive" : "negative"}>{formatINR(summary.totalPnLPaise)}</strong><small>Calculated from this demo account</small></article>
        <article className="overview-stat-card"><span className="overview-stat-icon"><Icon name="markets" size={17} /></span><span className="card-kicker">INVESTED AMOUNT</span><strong>{formatINR(summary.investedPaise)}</strong><small>{openPositions} open position{openPositions === 1 ? "" : "s"}</small></article>
        <article className="overview-stat-card"><span className="overview-stat-icon"><Icon name="paper" size={17} /></span><span className="card-kicker">VIRTUAL CASH</span><strong>{formatINR(summary.cashPaise)}</strong><small>{sessionOrderCount} fills in this browser session day</small></article>
      </section>

      <section className="overview-main-grid">
        <div className="overview-main-chart">
          <div className="overview-chart-header">
            <div><span className="section-kicker">SIMULATED MARKET SERIES</span><h2>Market performance</h2><p>Practice visuals only · no market history</p></div>
            <label className="instrument-select-wrap"><span className="sr-only">Chart instrument</span><select value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)}><optgroup label="INDICES · DEMO">{demoIndices.slice(0, 3).map((index) => <option key={index.symbol} value={index.symbol}>{index.name}</option>)}</optgroup><optgroup label="NSE STOCKS · DEMO">{nseAssets.map((asset) => <option key={asset.symbol} value={asset.symbol}>{asset.symbol}</option>)}</optgroup></select></label>
          </div>
          <MarketChart symbol={selectedSymbol} title={`${demoIndices.find((index) => index.symbol === selectedSymbol)?.name ?? selectedSymbol} · illustrative sample series`} />
        </div>
        <aside className="market-overview-panel">
          <div className="section-heading"><div><h2>Market overview</h2><p>Session and breadth · DEMO</p></div><span className="demo-dot-label">SAMPLE</span></div>
          <div className="market-session-card"><span className="session-status-dot" /><div><strong>MARKET STATUS UNAVAILABLE</strong><small>Exchange hours are not connected</small></div></div>
          <div className="breadth-summary"><div><span>Advancing</span><strong className="positive">{advancingCount}</strong></div><div><span>Declining</span><strong className="negative">{decliningCount}</strong></div><small>{nseAssets.length} NSE sample instruments</small></div>
          <div className="breadth-track" aria-label={`${advancingCount} advancing and ${decliningCount} declining demo instruments`}><span style={{ width: `${advancingPct}%` }} /></div>
          <div className="market-leader-pair">
            <div><span>TOP GAINER</span><strong>{gainers[0]?.symbol ?? "—"}</strong><b className="positive">+{(gainers[0]?.changePct ?? 0).toFixed(2)}%</b></div>
            <div><span>TOP LAGGER</span><strong>{losers[0]?.symbol ?? "—"}</strong><b className="negative">{(losers[0]?.changePct ?? 0).toFixed(2)}%</b></div>
          </div>
          <p className="market-overview-note">Illustrative breadth only. This dashboard has no live or licensed exchange feed.</p>
        </aside>
      </section>

      <section className="overview-watch-panel overview-watchlist-table-panel">
        <div className="section-heading card-section-heading"><div><h2>Watchlist</h2><p>{activeWatchlist.name} · locally saved demo list</p></div><Link className="text-button" href="/watchlist">Manage lists <Icon name="chevron" size={13} /></Link></div>
        {watchlistInstruments.length ? <div className="dashboard-watchlist-scroll"><table className="dashboard-watchlist-table"><thead><tr><th>INSTRUMENT</th><th>DEMO PRICE</th><th>CHANGE</th><th>PERFORMANCE · SIMULATED</th><th aria-label="Watchlist action" /></tr></thead><tbody>
          {watchlistInstruments.slice(0, 6).map((instrument, index) => <tr key={instrument.symbol}>
            <td><Link className="dashboard-watch-instrument" href={`/markets?q=${instrument.symbol}`}><span className={`instrument-avatar tone-${index % 4}`}>{instrument.symbol.slice(0, 1)}</span><span><strong>{instrument.symbol}</strong><small>{instrument.company}</small></span></Link></td>
            <td className="dashboard-watch-price">{formatINR(instrument.pricePaise)}</td>
            <td><span className={`change-pill ${instrument.changePct >= 0 ? "up" : "down"}`}>{instrument.changePct > 0 ? "+" : ""}{instrument.changePct.toFixed(2)}%</span></td>
            <td><Sparkline symbol={instrument.symbol} positive={instrument.changePct >= 0} /></td>
            <td><button className="watch-toggle is-watched" type="button" aria-label={`Remove ${instrument.symbol} from watchlist`} onClick={() => toggleSymbol(instrument.symbol)}><Icon name="watchlist" size={15} /></button></td>
          </tr>)}
        </tbody></table></div> : <div className="overview-inline-empty">Your watchlist is empty. Add instruments from Markets to see them here.</div>}
      </section>

      <section className="overview-lower-grid">
        <article className="overview-panel">
          <div className="section-heading"><div><h2>Top movers</h2><p>Illustrative daily changes · not exchange data</p></div><span className="demo-dot-label">DEMO</span></div>
          <div className="movers-columns">
            <div><span className="movers-heading">GAINERS</span>{gainers.map((instrument) => <div className="mover-row mover-row-premium" key={instrument.symbol}><span className="mover-initial">{instrument.symbol.slice(0, 1)}</span><div className="mover-name"><strong>{instrument.symbol}</strong><span>{instrument.company}</span></div><Sparkline symbol={instrument.symbol} /><strong className="positive">+{instrument.changePct.toFixed(2)}%</strong></div>)}</div>
            <div><span className="movers-heading">LOSERS</span>{losers.map((instrument) => <div className="mover-row mover-row-premium" key={instrument.symbol}><span className="mover-initial mover-initial-red">{instrument.symbol.slice(0, 1)}</span><div className="mover-name"><strong>{instrument.symbol}</strong><span>{instrument.company}</span></div><Sparkline symbol={instrument.symbol} positive={false} /><strong className="negative">{instrument.changePct.toFixed(2)}%</strong></div>)}</div>
          </div>
        </article>
        <article className="overview-panel sector-panel">
          <div className="section-heading"><div><h2>Sector pulse</h2><p>Illustrative breadth · sample data</p></div><Icon name="markets" size={16} /></div>
          <div className="sector-bars">{sectorSamples.map((sector) => <div className="sector-bar-row" key={sector.label}><span>{sector.label}</span><div><i style={{ width: `${Math.min(100, Math.abs(sector.change) * 55 + 12)}%`, background: sector.color }} /></div><strong className={sector.change >= 0 ? "positive" : "negative"}>{sector.change > 0 ? "+" : ""}{sector.change.toFixed(2)}%</strong></div>)}</div>
          <div className="sector-legend"><span><i className="positive-dot" />Positive sample</span><span><i className="negative-dot" />Negative sample</span></div>
        </article>
      </section>

      <section className="overview-lower-grid overview-activity-grid">
        <article className="overview-panel">
          <div className="section-heading"><div><h2>Recent paper-trading activity</h2><p>Orders from this local virtual account</p></div><Link className="text-button" href="/paper-trading">Open terminal <Icon name="chevron" size={13} /></Link></div>
          <div className="dashboard-activity-scroll"><table className="dashboard-activity-table"><thead><tr><th>SIDE</th><th>INSTRUMENT</th><th>QUANTITY</th><th>DEMO VALUE</th><th>STATUS</th></tr></thead><tbody>
            {recentOrders.map((order) => <tr key={order.id}><td><span className={`trade-side-pill ${order.side}`}>{order.side.toUpperCase()}</span></td><td><strong>{order.symbol}</strong></td><td>{order.quantity} shares</td><td>{formatINR(order.pricePaise * order.quantity)}</td><td><span className={`order-status-pill status-${order.status}`}>{order.status}</span></td></tr>)}
            {!recentOrders.length && <tr><td className="dashboard-activity-empty-cell" colSpan={5}><Icon name="paper" size={16} /><span>No paper trades yet</span><Link href="/paper-trading">Place a simulated order <Icon name="chevron" size={11} /></Link></td></tr>}
          </tbody></table></div>
        </article>
        <article className="overview-panel account-snapshot-panel">
          <div className="section-heading"><div><h2>Practice account</h2><p>Calculated from confirmed simulated fills</p></div><Link className="text-button" href="/portfolio">Portfolio <Icon name="chevron" size={13} /></Link></div>
          <div className="account-snapshot-grid"><div><span>PORTFOLIO VALUE</span><strong>{formatINR(summary.totalValuePaise)}</strong></div><div><span>VIRTUAL CASH</span><strong>{formatINR(summary.cashPaise)}</strong></div><div><span>INVESTED</span><strong>{formatINR(summary.investedPaise)}</strong></div><div><span>OPEN POSITIONS</span><strong>{openPositions}</strong></div></div>
          <Link className="overview-panel-footer" href="/portfolio">View complete account ledger <Icon name="chevron" size={13} /></Link>
        </article>
      </section>

      <footer className="dashboard-footer">
        <span><i /> EDUCATIONAL DEMO · NO LICENSED FEED</span>
        <span>TRADE NOVA <b>·</b> Think Smarter. Trade Wiser.</span>
        <span>Virtual trading only · Not investment advice</span>
      </footer>
    </main>
  );
}
