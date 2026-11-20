"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import EquityChart from "@/components/charts/equity-chart";
import { DonutChart } from "@/components/charts/market-chart";
import { usePaperTrading } from "@/components/trading/paper-trading-provider";
import { PageHeader, Panel, Tag } from "@/components/workspace/page-frame";
import { demoAssets, formatINR } from "@/lib/market-data";

const allocationColors = ["#c5f36b", "#57c4d2", "#b99be7", "#e7b36a", "#e17b76", "#81b8e4"];

export default function PortfolioWorkspace() {
  const { state, summary, resetPaperAccount } = usePaperTrading();
  const [activityFilter, setActivityFilter] = useState<"all" | "filled" | "pending">("all");
  const holdings = summary.holdings.map((holding) => ({ ...holding, instrument: demoAssets.find((asset) => asset.symbol === holding.symbol) })).filter((holding) => holding.instrument);
  const allocation = [
    { label: "Virtual cash", value: summary.cashPaise, color: "#39433c" },
    ...holdings.map((holding, index) => ({ label: holding.symbol, value: holding.marketValuePaise, color: allocationColors[index % allocationColors.length] })),
  ];
  const orders = useMemo(() => state.orders.filter((order) => activityFilter === "all" || order.status === activityFilter), [state.orders, activityFilter]);

  return (
    <main className="workspace-content portfolio-workspace">
      <PageHeader eyebrow="SIMULATED ACCOUNT" title="Portfolio" description="A ledger-driven view of your virtual balance, holdings, fees and paper-trade performance." actions={<Tag>LOCAL PAPER ACCOUNT</Tag>} />
      <div className="data-status-strip"><span className="data-state-dot" /><strong>DEMO PORTFOLIO</strong><span>Valuations use simulated reference prices; no brokerage account is connected.</span><button type="button" className="text-button" onClick={() => { if (window.confirm("Reset this local paper account, orders, and watchlists?")) resetPaperAccount(); }}>Reset demo account</button></div>
      <section className="portfolio-summary-hero">
        <div className="portfolio-equity-main"><span className="section-kicker">TOTAL PAPER PORTFOLIO VALUE</span><strong>{formatINR(summary.totalValuePaise)}</strong><span className={`portfolio-return ${summary.totalPnLPaise >= 0 ? "positive" : "negative"}`}>{summary.totalPnLPaise >= 0 ? "+" : ""}{formatINR(summary.totalPnLPaise)} <small>({summary.returnPct.toFixed(2)}% overall)</small></span><small>Virtual cash + open positions at simulated reference values</small></div>
        <div className="portfolio-summary-metrics"><div><span>INVESTED</span><strong>{formatINR(summary.investedPaise)}</strong></div><div><span>AVAILABLE CASH</span><strong>{formatINR(summary.cashPaise)}</strong></div><div><span>UNREALIZED P&amp;L</span><strong className={summary.unrealizedPnLPaise >= 0 ? "positive" : "negative"}>{formatINR(summary.unrealizedPnLPaise)}</strong></div><div><span>REALIZED P&amp;L</span><strong className={summary.realizedPnLPaise >= 0 ? "positive" : "negative"}>{formatINR(summary.realizedPnLPaise)}</strong></div></div>
      </section>
      <div className="portfolio-analytics-grid">
        <Panel title="Paper account equity" description="Snapshots recorded after confirmed simulated fills.">
          <EquityChart snapshots={state.equitySnapshots} />
        </Panel>
        <Panel title="Asset allocation" description="Current cash and holdings; calculated from this ledger.">
          <DonutChart slices={allocation} centerLabel="PAPER" centerValue={formatINR(summary.totalValuePaise, { compact: true, decimals: 0 })} />
        </Panel>
      </div>
      <Panel title="Open holdings" description={`${holdings.length} positions · no real assets held`}>
        {holdings.length ? <div className="watchlist-table-wrap"><table className="watchlist-table"><thead><tr><th>INSTRUMENT</th><th>QUANTITY</th><th>AVERAGE COST</th><th>DEMO VALUE</th><th>UNREALIZED P&amp;L</th><th /></tr></thead><tbody>{holdings.map((holding) => <tr key={holding.symbol}><td><Link className="watchlist-instrument" href={`/markets?q=${holding.symbol}`}><span className="instrument-avatar">{holding.symbol.slice(0, 1)}</span><span><strong>{holding.symbol}</strong><small>{holding.instrument?.company}</small></span></Link></td><td>{holding.quantity}</td><td>{formatINR(holding.averagePricePaise)}</td><td>{formatINR(holding.marketValuePaise)}</td><td className={holding.unrealizedPnLPaise >= 0 ? "positive" : "negative"}>{formatINR(holding.unrealizedPnLPaise)}</td><td><Link className="secondary-link" href={`/paper-trading?symbol=${holding.symbol}&side=sell`}>Sell</Link></td></tr>)}</tbody></table></div> : <div className="portfolio-empty-row"><span className="portfolio-empty-icon">0</span><div><strong>No open positions</strong><p>Place a practice order to see positions and market-value allocation here.</p></div><Link className="secondary-link" href="/paper-trading">Open terminal</Link></div>}
      </Panel>
      <Panel title="Order and transaction history" description="Virtual fills, pending limits, cancellations and estimated fees.">
        <div className="portfolio-activity-toolbar">{(["all", "filled", "pending"] as const).map((filter) => <button key={filter} type="button" className={activityFilter === filter ? "active-filter-button" : ""} onClick={() => setActivityFilter(filter)}>{filter === "all" ? "All activity" : filter[0].toUpperCase() + filter.slice(1)}</button>)}</div>
        {orders.length ? <div className="watchlist-table-wrap"><table className="watchlist-table"><thead><tr><th>TYPE</th><th>INSTRUMENT</th><th>QUANTITY</th><th>PRICE</th><th>FEES</th><th>STATUS</th><th>TIME</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><span className={`trade-side-pill ${order.side}`}>{order.side.toUpperCase()} · {order.orderType}</span></td><td>{order.symbol}</td><td>{order.quantity}</td><td>{formatINR(order.pricePaise)}</td><td>{formatINR(order.feesPaise)}</td><td><span className={`order-status-pill status-${order.status}`}>{order.status}</span></td><td>{new Date(order.createdAt).toLocaleString("en-IN")}</td></tr>)}</tbody></table></div> : <div className="activity-empty"><span>No matching order activity yet.</span><Link href="/paper-trading">Place a simulated order</Link></div>}
      </Panel>
    </main>
  );
}
