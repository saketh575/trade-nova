"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { demoMarketDataProvider, type Timeframe } from "@/lib/market-data";

const timeframes: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y"];

function getCoordinates(values: number[], width: number, height: number, padding = 12): string {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 0.01);
  return values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = padding + ((maximum - value) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export function Sparkline({ symbol, positive = true }: { symbol: string; positive?: boolean }) {
  const points = demoMarketDataProvider.getCandles(symbol, "1W").slice(-16).map((candle) => candle.close);
  const coords = getCoordinates(points, 100, 34, 3);
  return (
    <svg className={`mini-sparkline${positive ? " mini-sparkline-positive" : " mini-sparkline-negative"}`} viewBox="0 0 100 34" role="img" aria-label={`${symbol} simulated sparkline`}>
      <polyline points={coords} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function MarketChart({
  symbol,
  title = "Price action",
  showVolume = true,
}: {
  symbol: string;
  title?: string;
  showVolume?: boolean;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [chartType, setChartType] = useState<"line" | "candles">("line");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const candles = useMemo(() => demoMarketDataProvider.getCandles(symbol, timeframe), [symbol, timeframe]);
  const prices = candles.map((candle) => candle.close);
  const linePoints = getCoordinates(prices, 840, 220, 14);
  const id = `chart-${symbol.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const low = Math.min(...candles.map((candle) => candle.low));
  const high = Math.max(...candles.map((candle) => candle.high));
  const current = candles[activeIndex ?? candles.length - 1];
  const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width;
    setActiveIndex(Math.max(0, Math.min(candles.length - 1, Math.floor(position * candles.length))));
  };

  return (
    <section className="chart-card">
      <div className="chart-card-heading">
        <div>
          <span className="section-kicker">SIMULATED SERIES · NOT A QUOTE</span>
          <h2>{title}</h2>
        </div>
        <div className="chart-type-toggle" aria-label="Chart display">
          <button type="button" className={chartType === "line" ? "chart-type-active" : ""} onClick={() => setChartType("line")}>Line</button>
          <button type="button" className={chartType === "candles" ? "chart-type-active" : ""} onClick={() => setChartType("candles")}>Candles</button>
        </div>
      </div>
      <div className="chart-toolbar">
        <div className="chart-price-readout">
          <strong>₹{(current.close).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          <span className={current.close >= current.open ? "positive" : "negative"}>
            {current.close >= current.open ? "+" : ""}{(((current.close - current.open) / current.open) * 100).toFixed(2)}%
          </span>
          <small>{current.high.toFixed(2)} H · {current.low.toFixed(2)} L</small>
        </div>
        <div className="chart-timeframes" aria-label="Chart timeframe">
          {timeframes.map((range) => (
            <button type="button" key={range} className={timeframe === range ? "chart-timeframe-active" : ""} aria-pressed={timeframe === range} onClick={() => { setTimeframe(range); setActiveIndex(null); }}>
              {range}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-plot">
        <div className="chart-y-axis"><span>₹{high.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span><span>₹{((high + low) / 2).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span><span>₹{low.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></div>
        <svg
          className="market-chart-svg"
          viewBox="0 0 840 220"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${symbol} ${chartType} chart, simulated ${timeframe} demo series`}
          onPointerMove={pointerMove}
          onPointerLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--lime)" stopOpacity=".18" /><stop offset="100%" stopColor="var(--lime)" stopOpacity="0" /></linearGradient>
          </defs>
          <path className="market-chart-grid" d="M0 14H840M0 110H840M0 206H840" />
          {chartType === "line" ? (
            <>
              <polygon points={`14,220 ${linePoints} 826,220`} fill={`url(#${id}-fill)`} />
              <polyline points={linePoints} fill="none" stroke="var(--lime)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </>
          ) : candles.map((candle, index) => {
            const x = 14 + (index / candles.length) * 812;
            const y = (price: number) => 14 + ((high - price) / Math.max(high - low, 0.01)) * 192;
            const rising = candle.close >= candle.open;
            return (
              <g key={candle.step} className={rising ? "candle-up" : "candle-down"}>
                <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <rect x={x - 3.2} y={Math.min(y(candle.open), y(candle.close))} width="6.4" height={Math.max(1.5, Math.abs(y(candle.open) - y(candle.close)))} fill="currentColor" rx="1" />
              </g>
            );
          })}
          {activeIndex !== null && <line className="chart-crosshair" x1={14 + (activeIndex / Math.max(candles.length - 1, 1)) * 812} x2={14 + (activeIndex / Math.max(candles.length - 1, 1)) * 812} y1="10" y2="210" />}
          <rect x="0" y="0" width="840" height="220" fill="transparent" />
        </svg>
      </div>
      {showVolume && (
        <div className="volume-strip" aria-label="Simulated volume bars">
          {candles.slice(-28).map((candle) => <i key={candle.step} style={{ height: `${Math.max(9, (candle.volume / 1_420_000) * 100)}%` }} />)}
        </div>
      )}
      <div className="chart-x-axis"><span>DEMO SERIES START</span><span>SIMULATED STEPS · {timeframe}</span><span>NO HISTORICAL FEED</span></div>
    </section>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ slices, centerLabel, centerValue }: { slices: DonutSlice[]; centerLabel: string; centerValue: string }) {
  const circumference = 2 * Math.PI * 42;
  const total = slices.reduce((sum, slice) => sum + Math.max(slice.value, 0), 0);
  const activeSlices = slices.filter((slice) => slice.value > 0);
  return (
    <div className="donut-chart-wrap">
      <svg className="donut-chart-svg" viewBox="0 0 120 120" role="img" aria-label={`${centerLabel}: ${slices.map((slice) => `${slice.label} ${total ? Math.round((slice.value / total) * 100) : 0}%`).join(", ")}`}>
        <circle cx="60" cy="60" r="42" fill="none" stroke="#252d29" strokeWidth="13" />
        {activeSlices.map((slice, index) => {
          const length = (slice.value / total) * circumference;
          const currentOffset = activeSlices.slice(0, index).reduce((sum, item) => sum + (item.value / total) * circumference, 0);
          return <circle key={slice.label} cx="60" cy="60" r="42" fill="none" stroke={slice.color} strokeWidth="13" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-currentOffset} transform="rotate(-90 60 60)" />;
        })}
        <text x="60" y="57" textAnchor="middle" className="donut-center-label">{centerLabel}</text>
        <text x="60" y="73" textAnchor="middle" className="donut-center-value">{centerValue}</text>
      </svg>
      <div className="donut-legend">
        {slices.map((slice) => <div key={slice.label}><i style={{ backgroundColor: slice.color }} /><span>{slice.label}</span><strong>{total ? `${Math.round((slice.value / total) * 100)}%` : "0%"}</strong></div>)}
      </div>
    </div>
  );
}
