"use client";

import { useState } from "react";
import type { EquitySnapshot } from "@/lib/paper-trading";
import { formatINR } from "@/lib/market-data";

export default function EquityChart({ snapshots }: { snapshots: EquitySnapshot[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const data = snapshots.length > 1 ? snapshots : [...snapshots, ...(snapshots.length ? [{ ...snapshots[0], at: `${snapshots[0].at}-preview` }] : [])];
  const values = data.map((item) => item.valuePaise);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = Math.max(maximum - minimum, 100);
  const coords = values.map((value, index) => {
    const x = 14 + (index / Math.max(values.length - 1, 1)) * 812;
    const y = 16 + ((maximum - value) / spread) * 170;
    return `${x},${y}`;
  }).join(" ");
  const active = hovered === null ? data[data.length - 1] : data[hovered];
  const point = hovered === null ? null : coords.split(" ")[hovered];

  if (!data.length) return <div className="equity-chart-empty">Place a paper trade to begin a local account-value history.</div>;

  return (
    <div className="equity-chart-wrap">
      <div className="equity-chart-readout"><span>LOCAL PAPER EQUITY</span><strong>{formatINR(active.valuePaise)}</strong>{hovered !== null && <small>{new Date(active.at).toLocaleString("en-IN")}</small>}</div>
      <svg className="equity-chart-svg" viewBox="0 0 840 210" preserveAspectRatio="none" role="img" aria-label="Portfolio value snapshots derived from this local paper account" onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - bounds.left) / bounds.width;
        setHovered(Math.max(0, Math.min(data.length - 1, Math.floor(ratio * data.length))));
      }} onPointerLeave={() => setHovered(null)}>
        <defs><linearGradient id="equity-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c5f36b" stopOpacity=".17" /><stop offset="100%" stopColor="#c5f36b" stopOpacity="0" /></linearGradient></defs>
        <path className="market-chart-grid" d="M0 16H840M0 101H840M0 186H840" />
        <polygon points={`14,210 ${coords} 826,210`} fill="url(#equity-fill)" />
        <polyline points={coords} fill="none" stroke="#c5f36b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {point && <circle cx={point.split(",")[0]} cy={point.split(",")[1]} r="4" fill="#c5f36b" stroke="#121714" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="equity-axis-labels"><span>STARTING CASH</span><span>{data.length} ACCOUNT SNAPSHOT{data.length === 1 ? "" : "S"}</span><span>DEMO · LOCAL ONLY</span></div>
    </div>
  );
}
