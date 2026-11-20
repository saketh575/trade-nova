"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { MarketChart } from "@/components/charts/market-chart";
import { Icon } from "@/components/ui/icon";
import { usePaperTrading } from "@/components/trading/paper-trading-provider";
import { PageHeader, Panel, Tag } from "@/components/workspace/page-frame";
import { demoAssets, formatINR, type Instrument } from "@/lib/market-data";
import type { OrderType, TradeSide } from "@/lib/paper-trading";

function parsePrice(value: string): number | undefined {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return Math.round(amount * 100);
}

export default function PaperTradingTerminal({ initialSymbol = "RELIANCE", initialSide = "buy" }: { initialSymbol?: string; initialSide?: TradeSide }) {
  const { state, summary, placeOrder, cancelOrder, simulateLimitFill } = usePaperTrading();
  const [selectedSymbol, setSelectedSymbol] = useState(demoAssets.some((asset) => asset.symbol === initialSymbol && asset.exchange === "NSE") ? initialSymbol : "RELIANCE");
  const [side, setSide] = useState<TradeSide>(initialSide);
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const instrument: Instrument = demoAssets.find((asset) => asset.symbol === selectedSymbol) ?? demoAssets[0];
  const position = summary.holdings.find((holding) => holding.symbol === selectedSymbol);
  const referencePricePaise = instrument.pricePaise;
  const effectivePricePaise = orderType === "limit" ? parsePrice(limitPrice) ?? referencePricePaise : referencePricePaise;
  const estimatedNotionalPaise = effectivePricePaise * quantity;
  const estimatedFeesPaise = Math.max(100, Math.round(estimatedNotionalPaise * 0.0003));
  const canAfford = side === "sell" ? (position?.quantity ?? 0) >= quantity : summary.cashPaise >= estimatedNotionalPaise + estimatedFeesPaise;
  const openOrders = state.orders.filter((order) => order.status === "pending");
  const filteredOrders = state.orders.filter((order) => !orderSearch || order.symbol.toLowerCase().includes(orderSearch.toLowerCase()));
  const orderIssue = !Number.isSafeInteger(quantity) || quantity < 1
    ? "Quantity must be a whole number above zero."
    : orderType === "limit" && !parsePrice(limitPrice)
      ? "Enter a valid limit price."
      : !canAfford
        ? side === "sell" ? `Your paper account has ${position?.quantity ?? 0} ${selectedSymbol} shares.` : "This order exceeds available virtual cash."
        : "";

  const reviewOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (orderIssue) {
      setMessage(orderIssue);
      setMessageError(true);
      return;
    }
    setMessage("");
    setConfirmOpen(true);
  };

  const confirmOrder = () => {
    const result = placeOrder({
      symbol: selectedSymbol,
      side,
      orderType,
      quantity,
      limitPricePaise: orderType === "limit" ? parsePrice(limitPrice) : undefined,
      stopLossPaise: parsePrice(stopLoss),
      targetPricePaise: parsePrice(targetPrice),
    });
    setMessage(result.message);
    setMessageError(!result.ok);
    setConfirmOpen(false);
    if (result.ok) {
      setStopLoss("");
      setTargetPrice("");
    }
  };

  const showActionMessage = (result: { ok: boolean; message: string }) => {
    setMessage(result.message);
    setMessageError(!result.ok);
  };

  const feeSummary = useMemo(() => formatINR(estimatedFeesPaise), [estimatedFeesPaise]);

  return (
    <main className="workspace-content paper-terminal-page">
      <PageHeader eyebrow="SIMULATION TERMINAL" title="Paper Trading" description="Practise order decisions with a ₹10 lakh virtual starting balance." actions={<Tag>NO BROKER CONNECTION</Tag>} />
      <div className="terminal-safety-banner"><Icon name="risk" size={16} /><span><strong>Simulation only.</strong> Reference prices are synthetic; fills do not represent exchange execution.</span><span className="terminal-mode-label">LOCAL DEMO</span></div>
      <div className="terminal-account-strip"><div><span>AVAILABLE VIRTUAL CASH</span><strong>{formatINR(summary.cashPaise)}</strong></div><div><span>PORTFOLIO VALUE</span><strong>{formatINR(summary.totalValuePaise)}</strong></div><div><span>OPEN POSITIONS</span><strong>{summary.holdings.length}</strong></div><div><span>PENDING ORDERS</span><strong>{openOrders.length}</strong></div><Link href="/portfolio">Account ledger <Icon name="chevron" size={13} /></Link></div>

      <div className="terminal-layout">
        <section className="terminal-chart-column">
          <div className="terminal-instrument-bar"><label><span>INSTRUMENT</span><select value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)}>{demoAssets.filter((asset) => asset.exchange === "NSE").map((asset) => <option value={asset.symbol} key={asset.symbol}>{asset.symbol} · {asset.company}</option>)}</select></label><div><span className="section-kicker">DEMO REFERENCE PRICE</span><strong>{formatINR(referencePricePaise)}</strong><small className={instrument.changePct >= 0 ? "positive" : "negative"}>{instrument.changePct > 0 ? "+" : ""}{instrument.changePct.toFixed(2)}% illustrative sample</small></div></div>
          <MarketChart symbol={selectedSymbol} title={`${selectedSymbol} · simulated chart`} />
          <Panel title="Open positions" description="Current holdings are derived from confirmed paper fills.">
            {summary.holdings.length ? <div className="terminal-position-list">{summary.holdings.map((holding) => <div className="terminal-position-row" key={holding.symbol}><strong>{holding.symbol}</strong><span>{holding.quantity} shares</span><span>Avg {formatINR(holding.averagePricePaise)}</span><strong className={holding.unrealizedPnLPaise >= 0 ? "positive" : "negative"}>{formatINR(holding.unrealizedPnLPaise)}</strong><button type="button" className="secondary-link" onClick={() => { setSelectedSymbol(holding.symbol); setSide("sell"); }}>Sell position</button></div>)}</div> : <div className="activity-empty">No open positions yet. A filled demo buy will appear here.</div>}
          </Panel>
        </section>

        <aside className="order-ticket">
          <div className="order-ticket-header"><div><span className="section-kicker">NEW SIMULATED ORDER</span><h2>Order ticket</h2></div><span className="order-ticket-security"><Icon name="risk" size={13} /> PAPER ONLY</span></div>
          <div className="trade-side-tabs"><button type="button" className={side === "buy" ? "buy-active" : ""} onClick={() => setSide("buy")}>Buy</button><button type="button" className={side === "sell" ? "sell-active" : ""} onClick={() => setSide("sell")}>Sell</button></div>
          <form onSubmit={reviewOrder}>
            <label className="ticket-field"><span>ORDER TYPE</span><div className="order-type-selector"><button type="button" className={orderType === "market" ? "selected" : ""} onClick={() => setOrderType("market")}>Market</button><button type="button" className={orderType === "limit" ? "selected" : ""} onClick={() => setOrderType("limit")}>Limit</button></div></label>
            {orderType === "limit" && <label className="ticket-field"><span>LIMIT PRICE <small>₹ / share</small></span><input type="number" min="0.01" step="0.01" value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)} placeholder={(referencePricePaise / 100).toFixed(2)} required /></label>}
            <label className="ticket-field"><span>QUANTITY <small>shares</small></span><div className="quantity-input"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Icon name="minus" size={14} /></button><input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.max(1, quantity + 1))}><Icon name="plus" size={14} /></button></div></label>
            <div className="ticket-field-row"><label className="ticket-field"><span>STOP LOSS <small>optional</small></span><input type="number" min="0.01" step="0.01" value={stopLoss} onChange={(event) => setStopLoss(event.target.value)} placeholder="₹ / share" /></label><label className="ticket-field"><span>TARGET <small>optional</small></span><input type="number" min="0.01" step="0.01" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} placeholder="₹ / share" /></label></div>
            <div className="order-estimate"><div><span>Reference notional</span><strong>{formatINR(estimatedNotionalPaise)}</strong></div><div><span>Estimated fees</span><strong>{feeSummary}</strong></div><div><span>Execution</span><strong>{orderType === "market" ? "Immediate demo fill" : "Marketable limit or pending"}</strong></div></div>
            {(stopLoss || targetPrice) && <p className="attached-order-note">Stop / target values are saved as notes only. They are not monitored or auto-triggered in local demo mode.</p>}
            {orderIssue && <p className="order-validation-note">{orderIssue}</p>}
            <button type="submit" className={`place-order-button ${side}`} disabled={Boolean(orderIssue)}>{side === "buy" ? "Review simulated buy" : "Review simulated sell"} <Icon name="chevron" size={14} /></button>
            <p className="order-disclaimer">No real-money trades · no exchange connection · demo prices only.</p>
          </form>
        </aside>
      </div>

      {message && <div className={`inline-feedback terminal-feedback${messageError ? " feedback-error" : ""}`} role="status">{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss message"><Icon name="close" size={13} /></button></div>}

      <Panel title="Order activity" description="Review pending limits, simulated fills and cancellations.">
        <div className="activity-table-toolbar"><span>{state.orders.length} orders in this browser</span><label><Icon name="search" size={14} /><input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Filter symbol" /></label></div>
        <div className="watchlist-table-wrap"><table className="watchlist-table terminal-order-table"><thead><tr><th>SIDE / TYPE</th><th>INSTRUMENT</th><th>QTY</th><th>PRICE</th><th>FEES</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>
          {filteredOrders.map((order) => <tr key={order.id}><td><span className={`trade-side-pill ${order.side}`}>{order.side.toUpperCase()} · {order.orderType.toUpperCase()}</span></td><td><strong>{order.symbol}</strong>{order.stopLossPaise && <small className="order-attached-label">SL {formatINR(order.stopLossPaise)}</small>}{order.targetPricePaise && <small className="order-attached-label">TP {formatINR(order.targetPricePaise)}</small>}</td><td>{order.quantity}</td><td>{formatINR(order.pricePaise)}</td><td>{formatINR(order.feesPaise)}</td><td><span className={`order-status-pill status-${order.status}`}>{order.status}</span></td><td>{order.status === "pending" ? <span className="pending-order-actions"><button type="button" onClick={() => showActionMessage(simulateLimitFill(order.id))}>Simulate fill</button><button type="button" onClick={() => showActionMessage(cancelOrder(order.id))}>Cancel</button></span> : <span className="order-time">{new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}</td></tr>)}
          {!filteredOrders.length && <tr><td className="instrument-empty-cell" colSpan={7}>No matching order history yet. Place a simulated order to start the account ledger.</td></tr>}
        </tbody></table></div>
      </Panel>

      {confirmOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmOpen(false); }}><section className="confirm-order-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-order-title"><div className="modal-heading"><span className="modal-icon"><Icon name={side === "buy" ? "arrow-up" : "arrow-down"} size={18} /></span><button type="button" className="modal-close" aria-label="Close confirmation" onClick={() => setConfirmOpen(false)}><Icon name="close" size={16} /></button></div><span className="section-kicker">SIMULATION CHECK</span><h2 id="confirm-order-title">Confirm {side} order?</h2><p>This order only changes your local paper account. It will not be sent to a broker or exchange.</p><div className="confirm-order-summary"><span>{side.toUpperCase()} · {orderType.toUpperCase()}</span><strong>{quantity} {selectedSymbol}</strong><span>Estimated value + fee</span><strong>{formatINR(estimatedNotionalPaise + estimatedFeesPaise)}</strong></div>{orderType === "limit" && <div className="confirm-order-explainer">Non-marketable limits remain pending until you explicitly choose <b>Simulate fill</b>. No market feed will trigger them.</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setConfirmOpen(false)}>Go back</button><button type="button" className={`primary-button confirm-${side}`} onClick={confirmOrder}>Confirm simulated {side}</button></div></section></div>}
    </main>
  );
}
