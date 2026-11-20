"use client";

import { useMemo, useState, type FormEvent } from "react";
import { MarketChart } from "@/components/charts/market-chart";
import { Icon } from "@/components/ui/icon";
import { PageHeader, Panel, Tag } from "@/components/workspace/page-frame";
import { demoAssets, demoMarketDataProvider, type Candle } from "@/lib/market-data";
import { useLocalStorageState } from "@/lib/use-local-storage-state";

interface JournalEntry {
  id: string;
  symbol: string;
  thesis: string;
  riskPlan: string;
  createdAt: string;
}

const journalKey = "trade-nova-neon-journal-v1";
const emptyJournal: JournalEntry[] = [];

function isJournalEntry(value: unknown): value is JournalEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<JournalEntry>;
  return typeof entry.id === "string" && typeof entry.symbol === "string" && typeof entry.thesis === "string"
    && typeof entry.riskPlan === "string" && typeof entry.createdAt === "string";
}

function isJournal(value: unknown): value is JournalEntry[] {
  return Array.isArray(value) && value.every(isJournalEntry);
}

function calculateRsi(candles: Candle[]): number {
  const changes = candles.slice(-15).slice(1).map((candle, index) => candle.close - candles.slice(-15)[index].close);
  const gains = changes.filter((change) => change > 0).reduce((sum, change) => sum + change, 0) / 14;
  const losses = Math.abs(changes.filter((change) => change < 0).reduce((sum, change) => sum + change, 0)) / 14;
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

export default function NeonWorkspace() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [thesis, setThesis] = useState("");
  const [riskPlan, setRiskPlan] = useState("");
  const [journal, setJournal] = useLocalStorageState(journalKey, emptyJournal, isJournal);
  const [notice, setNotice] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const candles = useMemo(() => demoMarketDataProvider.getCandles(symbol, "1M"), [symbol]);
  const last = candles[candles.length - 1];
  const sma20 = candles.slice(-20).reduce((sum, candle) => sum + candle.close, 0) / 20;
  const sma50 = candles.slice(-50).reduce((sum, candle) => sum + candle.close, 0) / 50;
  const rsi = calculateRsi(candles);
  const seriesChangePct = ((last.close - candles[0].close) / candles[0].close) * 100;
  const qualityScore = Math.round((checklist.length / 4) * 100);
  const entryPaise = Math.round(last.close * 100);
  const stopPaise = Math.round(entryPaise * 0.985);
  const targetPaise = Math.round(entryPaise * 1.03);
  const rewardRisk = (targetPaise - entryPaise) / (entryPaise - stopPaise);

  const addEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!thesis.trim()) {
      setNotice("Add a short trade thesis before saving your journal entry.");
      return;
    }
    const persisted = setJournal((previous) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, symbol, thesis: thesis.trim(), riskPlan: riskPlan.trim(), createdAt: new Date().toISOString() }, ...previous]);
    setThesis("");
    setRiskPlan("");
    setNotice(persisted ? "Journal entry saved in this browser." : "Journal entry saved for this session only; browser storage is unavailable.");
  };

  const removeEntry = (id: string) => {
    const persisted = setJournal((previous) => previous.filter((entry) => entry.id !== id));
    setNotice(persisted ? "Journal entry removed." : "Entry removed for this session; browser storage is unavailable.");
  };

  const toggleChecklist = (item: string) => setChecklist((previous) => previous.includes(item) ? previous.filter((value) => value !== item) : [...previous, item]);

const generateAiAnalysis = async () => {
  setAiLoading(true);
  setAiError("");
  setAiAnalysis("");

  try {
    const response = await fetch("/api/neon-intelligence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        symbol,
        isSynthetic: true,
        indicators: {
          rsi,
          sma20,
          sma50,
          lastClose: last.close,
          seriesChangePct,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to generate AI analysis.");
    }

    setAiAnalysis(data.analysis);
  } catch (error) {
    setAiError(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setAiLoading(false);
  }
};


  return (
    <main className="workspace-content neon-workspace">
      <PageHeader eyebrow="REVIEW THE PROCESS" title="NEON Intelligence" description="Rule-based demo indicators, a trade-quality checklist and a private local journal." actions={<Tag>NO AI MODEL CONNECTED</Tag>} />
      <div className="neon-disclaimer"><Icon name="spark" size={16} /><span><strong>Calculated demo analysis only.</strong> No model-generated response, real market sentiment, forecast, or buy/sell recommendation is provided.</span></div>
      <div className="neon-controls"><label><span>SIMULATED INSTRUMENT</span><select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{demoAssets.filter((asset) => asset.exchange === "NSE").map((asset) => <option value={asset.symbol} key={asset.symbol}>{asset.symbol}</option>)}</select></label><span className="neon-derived-pill"><i /> CALCULATED FROM SYNTHETIC SERIES</span></div>
      <div className="neon-overview-grid">
        <Panel title="Synthetic trend meter" description="A descriptive measure of this generated series, not market sentiment.">
          <div className="trend-meter-card"><div className="trend-meter-title"><span>DEMO SERIES MOMENTUM</span><strong className={seriesChangePct >= 0 ? "positive" : "negative"}>{seriesChangePct >= 0 ? "+" : ""}{seriesChangePct.toFixed(2)}%</strong></div><div className="trend-meter-track"><i style={{ left: `${Math.min(96, Math.max(4, 50 + seriesChangePct * 8))}%` }} /></div><div className="trend-meter-labels"><span>DOWNWARD SAMPLE</span><span>UPWARD SAMPLE</span></div><p>Trend position is computed from the first and last generated close in this demo window.</p></div>
        </Panel>
        <Panel title="Trade-quality checklist" description="A process-completeness score based on your selections, not trade profitability.">
          <div className="quality-score-row"><div className="quality-score-ring"><strong>{qualityScore}</strong><span>/100</span></div><div><span className="section-kicker">PROCESS SCORE</span><strong>{qualityScore === 100 ? "Checklist complete" : qualityScore ? "Some checks completed" : "Not reviewed"}</strong><p>Completing the checklist does not make a trade safe or profitable.</p></div></div>
          <div className="quality-checklist">{[["thesis", "I can explain my trade thesis"], ["risk", "My stop and risk are defined"], ["size", "Position size fits my plan"], ["exit", "I know what would invalidate the idea"]].map(([key, label]) => <label key={key}><input type="checkbox" checked={checklist.includes(key)} onChange={() => toggleChecklist(key)} /><span><Icon name="check" size={12} /></span>{label}</label>)}</div>
        </Panel>
      </div>
      <div className="neon-analysis-grid">
        <Panel title="Technical indicator snapshot" description="Simple indicators calculated from local synthetic candles only.">
          <div className="indicator-cards"><div><span>RSI · 14 STEP</span><strong>{rsi.toFixed(1)}</strong><small>Computed on generated series</small></div><div><span>SMA · 20 STEP</span><strong>₹{sma20.toFixed(2)}</strong><small>Simple close average</small></div><div><span>SMA · 50 STEP</span><strong>₹{sma50.toFixed(2)}</strong><small>Simple close average</small></div><div><span>LAST DEMO CLOSE</span><strong>₹{last.close.toFixed(2)}</strong><small>Not a market quote</small></div></div>
          <div className="indicator-summary"><Icon name="markets" size={15} /><span>{last.close >= sma20 ? "The latest generated close is above its 20-step demo average." : "The latest generated close is below its 20-step demo average."} This describes the sample only.</span></div>
        </Panel>
        <Panel title="Example risk / reward" description="A sample plan relative to the selected synthetic close; not a recommendation.">
          <div className="risk-reward-visual"><div className="rr-reward"><span>+3% EXAMPLE REWARD</span><i /></div><div className="rr-entry"><span>DEMO ENTRY</span><i /></div><div className="rr-risk"><span>−1.5% EXAMPLE RISK</span><i /></div><strong>{rewardRisk.toFixed(1)} : 1</strong></div>
          <div className="rr-price-row"><span>Reference {formatRupees(entryPaise)}</span><span>Stop {formatRupees(stopPaise)}</span><span>Target {formatRupees(targetPaise)}</span></div>
        </Panel>
      </div>
      <div className="neon-chart-grid">
        <MarketChart symbol={symbol} title={`${symbol} · generated practice series`} />
        <Panel title="Analysis panel" description="Structured output; all values are calculated locally.">
          <div className="analysis-structured"><div><span>DATA SOURCE</span><strong>Local synthetic series</strong></div><div><span>AI RESPONSE</span><strong>Unavailable · no model connected</strong></div><div><span>PREDICTION</span><strong>Not generated</strong></div><div><span>CALCULATED OBSERVATION</span><strong>{last.close >= sma20 ? "Above demo SMA 20" : "Below demo SMA 20"}</strong></div></div><p className="analysis-note">This panel contains deterministic calculations, not an AI interpretation. It does not evaluate real or licensed market information.</p>
        </Panel>
      </div>
      <div className="neon-journal-grid">
        <Panel title="Trade journal" description="Save your thesis and risk plan locally to review your own decisions.">
          <form className="journal-form" onSubmit={addEntry}><label><span>Instrument</span><select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{demoAssets.filter((asset) => asset.exchange === "NSE").map((asset) => <option value={asset.symbol} key={asset.symbol}>{asset.symbol}</option>)}</select></label><label><span>Trade thesis</span><textarea value={thesis} onChange={(event) => setThesis(event.target.value)} rows={3} maxLength={500} placeholder="What are you practising, and what would invalidate the idea?" /></label><label><span>Risk and exit plan</span><textarea value={riskPlan} onChange={(event) => setRiskPlan(event.target.value)} rows={2} maxLength={300} placeholder="Record your stop, position size, and review criteria." /></label><button className="primary-button" type="submit">Save journal entry <Icon name="chevron" size={13} /></button></form>
          {notice && <p className="journal-notice" role="status">{notice}</p>}
        </Panel>
        <Panel title={`Recent notes · ${journal.length}`} description="Stored in this browser only; not synced to an account.">
          {journal.length ? <div className="journal-entry-list">{journal.slice(0, 5).map((entry) => <article className="journal-entry-card" key={entry.id}><div><span className="section-kicker">{entry.symbol} · {new Date(entry.createdAt).toLocaleDateString("en-IN")}</span><button type="button" aria-label={`Delete ${entry.symbol} journal entry`} onClick={() => removeEntry(entry.id)}><Icon name="trash" size={13} /></button></div><p>{entry.thesis}</p>{entry.riskPlan && <small>{entry.riskPlan}</small>}</article>)}</div> : <div className="journal-empty"><Icon name="paper" size={18} /><span>No notes yet. Save a thesis and risk plan to start a review trail.</span></div>}
          <div className="behavior-insight"><span className="section-kicker">BEHAVIOURAL REVIEW</span><p>{journal.length >= 3 ? `You have ${journal.length} local notes to review for recurring decision patterns.` : "Not enough journal history to identify a personal pattern. No behavior is inferred."}</p></div>
        </Panel>
      </div>
    </main>
  );
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
