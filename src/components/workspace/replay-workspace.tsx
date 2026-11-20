"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { usePaperTrading } from "@/components/trading/paper-trading-provider";
import { PageHeader, Panel, Tag } from "@/components/workspace/page-frame";
import { demoMarketDataProvider, formatINR, type Candle } from "@/lib/market-data";
import type { TradeSide } from "@/lib/paper-trading";

const speedOptions = [0.5, 1, 2, 4];

export default function ReplayWorkspace() {
  const { placeOrder, summary } = usePaperTrading();
  const [symbol, setSymbol] = useState("RELIANCE");
  const [sessionDate, setSessionDate] = useState("2025-01-15");
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<TradeSide>("buy");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [replayTrades, setReplayTrades] = useState<{ side: TradeSide; price: number; quantity: number; step: number }[]>([]);
  const candles = useMemo(() => demoMarketDataProvider.getCandles(symbol, "1D"), [symbol]);
  const visible = candles.slice(0, index + 1);
  const current: Candle = candles[index] ?? candles[0];
  const high = Math.max(...candles.map((candle) => candle.high));
  const low = Math.min(...candles.map((candle) => candle.low));
  const coordinates = visible.map((candle, candleIndex) => {
    const x = 14 + (candleIndex / Math.max(candles.length - 1, 1)) * 812;
    const y = (price: number) => 14 + ((high - price) / Math.max(high - low, 0.01)) * 192;
    return { x, open: y(candle.open), close: y(candle.close), high: y(candle.high), low: y(candle.low), rising: candle.close >= candle.open };
  });

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIndex((previous) => {
        if (previous >= candles.length - 1) {
          setPlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 850 / speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, candles.length]);

  const reset = () => {
    setPlaying(false);
    setIndex(0);
    setReplayTrades([]);
    setFeedback("Replay reset. Previous paper orders remain in your account ledger.");
  };

  const placeReplayTrade = () => {
    const referencePricePaise = Math.round(current.close * 100);
    const result = placeOrder({ symbol, side, orderType: "market", quantity, referencePricePaise });
    setFeedback(result.message);
    if (result.ok) setReplayTrades((previous) => [...previous, { side, price: current.close, quantity, step: index }]);
  };

  return (
    <main className="workspace-content replay-workspace">
      <PageHeader eyebrow="SIMULATED CANDLE PRACTICE" title="Market Replay Lab" description="Step through a generated practice series and place virtual trades against each revealed candle." actions={<Tag>SYNTHETIC REPLAY · NOT HISTORICAL</Tag>} />
      <div className="replay-disclaimer"><Icon name="risk" size={15} /><span>This replay is generated locally. It is not past exchange data, does not recreate a real session, and must not be used for strategy validation.</span></div>
      <div className="replay-config-bar">
        <label><span>DEMO INSTRUMENT</span><select value={symbol} onChange={(event) => { setSymbol(event.target.value); setIndex(0); setPlaying(false); setReplayTrades([]); }}><option value="RELIANCE">RELIANCE</option><option value="TCS">TCS</option><option value="INFY">INFY</option><option value="HDFCBANK">HDFCBANK</option><option value="SBIN">SBIN</option></select></label>
        <label><span>SCENARIO DATE LABEL</span><input type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} /></label>
        <div className="replay-current-quote"><span>SIMULATED CLOSE</span><strong>₹{current.close.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><small>Step {index + 1} of {candles.length}</small></div>
        <span className="replay-data-pill"><i /> GENERATED SERIES</span>
      </div>
      <Panel title={`${symbol} · simulated candle replay`} description={`Scenario label ${sessionDate} · dates do not correspond to historical market candles`}>
        <div className="replay-chart-legend"><span><i className="legend-bull" /> Synthetic up candle</span><span><i className="legend-bear" /> Synthetic down candle</span><span className="replay-progress-count">{index + 1} / {candles.length} candles</span></div>
        <div className="replay-chart-stage">
          <div className="replay-y-axis"><span>₹{high.toFixed(0)}</span><span>₹{((high + low) / 2).toFixed(0)}</span><span>₹{low.toFixed(0)}</span></div>
          <svg className="replay-candle-chart" viewBox="0 0 840 220" preserveAspectRatio="none" role="img" aria-label={`${symbol} synthetic replay chart at candle ${index + 1}`}>
            <path className="market-chart-grid" d="M0 14H840M0 110H840M0 206H840" />
            {coordinates.map((candle, candleIndex) => <g key={candleIndex} className={candle.rising ? "candle-up" : "candle-down"} opacity={candleIndex === index ? 1 : .82}><line x1={candle.x} x2={candle.x} y1={candle.high} y2={candle.low} stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /><rect x={candle.x - 3.2} y={Math.min(candle.open, candle.close)} width="6.4" height={Math.max(1.5, Math.abs(candle.open - candle.close))} fill="currentColor" rx="1" /></g>)}
          </svg>
        </div>
        <div className="replay-volume-row">{candles.slice(0, index + 1).map((candle) => <i key={candle.step} style={{ height: `${Math.max(8, candle.volume / 14200)}%` }} />)}</div>
        <div className="replay-timeline-wrap"><input aria-label="Replay candle position" type="range" min="0" max={candles.length - 1} value={index} onChange={(event) => { setPlaying(false); setIndex(Number(event.target.value)); }} /><div><span>START · GENERATED SERIES</span><span>STEP {index + 1} / {candles.length}</span><span>END · NOT HISTORICAL</span></div></div>
      </Panel>
      <div className="replay-control-trade-grid">
        <Panel title="Playback controls" description="Inspect the synthetic candles at your own pace.">
          <div className="replay-control-buttons"><button type="button" className="replay-round-button" aria-label="Reset replay" onClick={reset}><Icon name="rotate" size={17} /></button><button type="button" className="replay-main-button" onClick={() => setPlaying(!playing)}><Icon name={playing ? "pause" : "play"} size={16} />{playing ? "Pause" : "Play"}</button><button type="button" className="replay-round-button" aria-label="Step backward" onClick={() => { setPlaying(false); setIndex(Math.max(0, index - 1)); }}><Icon name="arrow-down" size={15} /></button><button type="button" className="replay-round-button" aria-label="Step forward" onClick={() => { setPlaying(false); setIndex(Math.min(candles.length - 1, index + 1)); }}><Icon name="arrow-up" size={15} /></button><label className="replay-speed-select"><span>SPEED</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{speedOptions.map((option) => <option value={option} key={option}>{option}×</option>)}</select></label></div>
          <div className="replay-step-info"><span>Current synthetic step</span><strong>{String(index + 1).padStart(2, "0")} <small>/ {candles.length}</small></strong></div>
        </Panel>
        <Panel title="Place a practice trade" description="Orders use the currently revealed synthetic candle close.">
          <div className="replay-trade-controls"><div className="replay-side-toggle"><button type="button" className={side === "buy" ? "buy-active" : ""} onClick={() => setSide("buy")}>Buy</button><button type="button" className={side === "sell" ? "sell-active" : ""} onClick={() => setSide("sell")}>Sell</button></div><label><span>SHARES</span><input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} /></label><strong>{formatINR(Math.round(current.close * 100) * quantity)}</strong><button className={`place-order-button ${side}`} type="button" onClick={placeReplayTrade}>Simulate {side} <Icon name="chevron" size={13} /></button></div>
          {feedback && <div className="inline-feedback replay-feedback" role="status">{feedback}</div>}
          <small className="replay-trade-balance">Virtual cash after trade: {formatINR(summary.cashPaise)} · no real order is sent.</small>
        </Panel>
      </div>
      <div className="replay-review-grid">
        <Panel title="Replay performance" description="Session-level counts from trades placed in this replay view.">
          <div className="replay-performance-stats"><div><span>VIRTUAL ACTIONS</span><strong>{replayTrades.length}</strong></div><div><span>CANDLES REVEALED</span><strong>{index + 1}</strong></div><div><span>PAPER CASH</span><strong>{formatINR(summary.cashPaise)}</strong></div></div>
        </Panel>
        <Panel title="Decision review" description="Use the journal to capture what you noticed before each practice action.">
          <div className="replay-review-copy"><span>What was visible at entry?</span><p>Compare the candle sequence you could see with the rationale you recorded. This tool provides no historical edge or prediction.</p><Link className="text-button" href="/neon-intelligence">Open journal <Icon name="chevron" size={13} /></Link></div>
        </Panel>
      </div>
    </main>
  );
}
