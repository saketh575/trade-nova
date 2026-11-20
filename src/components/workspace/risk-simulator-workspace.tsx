"use client";

import { useMemo, useState } from "react";
import { usePaperTrading } from "@/components/trading/paper-trading-provider";
import { Icon } from "@/components/ui/icon";
import { PageHeader, Panel, Tag } from "@/components/workspace/page-frame";
import { formatINR } from "@/lib/market-data";

function currencyInput(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
}

export default function RiskSimulatorWorkspace() {
  const { summary } = usePaperTrading();
  const [riskPct, setRiskPct] = useState(1);
  const [entryPrice, setEntryPrice] = useState("1000");
  const [stopPrice, setStopPrice] = useState("970");
  const [targetPrice, setTargetPrice] = useState("1060");
  const [stressPct, setStressPct] = useState(12);
  const entryPaise = currencyInput(entryPrice);
  const stopPaise = currencyInput(stopPrice);
  const targetPaise = currencyInput(targetPrice);
  const riskBudgetPaise = Math.round(summary.totalValuePaise * riskPct / 100);
  const riskPerSharePaise = entryPaise && stopPaise ? Math.abs(entryPaise - stopPaise) : 0;
  const validPlan = Boolean(entryPaise && stopPaise && targetPaise && stopPaise < entryPaise && targetPaise > entryPaise);
  const quantity = validPlan && riskPerSharePaise > 0 ? Math.floor(riskBudgetPaise / riskPerSharePaise) : 0;
  const positionValuePaise = quantity * (entryPaise ?? 0);
  const maxLossPaise = quantity * riskPerSharePaise;
  const potentialRewardPaise = quantity * ((targetPaise ?? 0) - (entryPaise ?? 0));
  const rewardRisk = maxLossPaise > 0 ? potentialRewardPaise / maxLossPaise : 0;
  const stressLossPaise = Math.round(summary.totalValuePaise * stressPct / 100);
  const exposures = useMemo(() => summary.holdings.map((holding) => ({ ...holding, percentage: summary.totalValuePaise > 0 ? (holding.marketValuePaise / summary.totalValuePaise) * 100 : 0 })).sort((a, b) => b.percentage - a.percentage), [summary]);
  const riskGauge = Math.min(100, (riskPct / 5) * 100);

  return (
    <main className="workspace-content risk-simulator-workspace">
      <PageHeader eyebrow="EDUCATIONAL RISK TOOLS" title="Risk Simulator" description="Explore how order size, stop distance and portfolio shocks affect a simulated account." actions={<Tag>CALCULATIONS · NOT ADVICE</Tag>} />
      <div className="data-status-strip"><span className="data-state-dot" /><strong>LOCAL CALCULATIONS</strong><span>Nothing is sent to a broker. Demo portfolio exposure updates from this paper account.</span></div>
      <div className="risk-workspace-grid">
        <Panel title="Position sizing planner" description="Set an example entry, stop and target. Quantity is rounded down to whole shares.">
          <div className="risk-input-grid">
            <label><span>Account risk <strong>{riskPct.toFixed(2)}%</strong></span><input type="range" min="0.25" max="5" step="0.25" value={riskPct} onChange={(event) => setRiskPct(Number(event.target.value))} /><small>Budget: {formatINR(riskBudgetPaise)} of current paper equity</small></label>
            <label><span>Entry price · ₹</span><input type="number" min="0.01" step="0.01" value={entryPrice} onChange={(event) => setEntryPrice(event.target.value)} /></label>
            <label><span>Stop price · ₹</span><input type="number" min="0.01" step="0.01" value={stopPrice} onChange={(event) => setStopPrice(event.target.value)} /></label>
            <label><span>Target price · ₹</span><input type="number" min="0.01" step="0.01" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} /></label>
          </div>
          {!validPlan && <p className="risk-validation"><Icon name="risk" size={14} /> For this long-position example, set stop below entry and target above entry.</p>}
          <div className="risk-result-grid"><div><span>Example quantity</span><strong>{quantity.toLocaleString("en-IN")} <small>shares</small></strong></div><div><span>Position value</span><strong>{formatINR(positionValuePaise)}</strong></div><div><span>Loss at stop</span><strong className="negative">{formatINR(maxLossPaise)}</strong></div><div><span>Reward / risk</span><strong>{validPlan ? `${rewardRisk.toFixed(2)} : 1` : "—"}</strong></div></div>
          <div className="risk-gauge"><div><span>RISK BUDGET USED AT STOP</span><strong>{riskBudgetPaise ? `${Math.min(100, Math.round((maxLossPaise / riskBudgetPaise) * 100))}%` : "0%"}</strong></div><div className="risk-gauge-track"><i style={{ width: `${validPlan ? riskGauge : 0}%` }} /></div><small>Illustrative estimate before slippage or execution costs.</small></div>
        </Panel>

        <Panel title="Portfolio stress scenario" description="Apply a hypothetical mark-down to the current simulated holdings.">
          <div className="stress-result"><span>PORTFOLIO SHOCK</span><strong>{stressPct}%</strong><span>Estimated value change</span><b className="negative">−{formatINR(stressLossPaise)}</b></div>
          <label className="stress-slider"><span>Scenario decline <b>{stressPct}%</b></span><input type="range" min="0" max="40" step="1" value={stressPct} onChange={(event) => setStressPct(Number(event.target.value))} /><div><span>0%</span><span>40%</span></div></label>
          <div className="drawdown-visual"><div className="drawdown-bar"><i style={{ width: `${stressPct * 2.5}%` }} /></div><div className="drawdown-labels"><span>Current {formatINR(summary.totalValuePaise, { compact: true, decimals: 0 })}</span><strong>Scenario {formatINR(summary.totalValuePaise - stressLossPaise, { compact: true, decimals: 0 })}</strong></div></div>
          <p className="risk-disclaimer">A static stress test only. It does not predict market behavior, probabilities or future portfolio results.</p>
        </Panel>
      </div>
      <div className="risk-workspace-grid">
        <Panel title="Exposure by position" description="Current demo holding value as a share of virtual portfolio equity.">
          {exposures.length ? <div className="exposure-list">{exposures.map((holding) => <div className="exposure-row" key={holding.symbol}><div><strong>{holding.symbol}</strong><span>{holding.quantity} shares · {formatINR(holding.marketValuePaise)}</span></div><div className="exposure-track"><i style={{ width: `${Math.min(100, holding.percentage)}%` }} /></div><b>{holding.percentage.toFixed(1)}%</b></div>)}</div> : <div className="risk-empty"><Icon name="portfolio" size={20} /><span>No holdings to analyze. Exposure appears after a simulated order is filled.</span></div>}
        </Panel>
        <Panel title="Calculator assumptions" description="These simple examples omit instrument-specific costs and market constraints.">
          <div className="risk-assumption-list"><div><span>Risk budget</span><strong>Account value × selected risk %</strong></div><div><span>Share quantity</span><strong>Risk budget ÷ entry-to-stop distance</strong></div><div><span>Reward / risk</span><strong>Potential reward ÷ potential loss</strong></div><div><span>Drawdown scenario</span><strong>Portfolio value × selected shock %</strong></div></div>
        </Panel>
      </div>
    </main>
  );
}
