"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { usePaperTrading } from "@/components/trading/paper-trading-provider";
import { mergeAccountState } from "@/lib/supabase";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { PageHeader, Panel, Tag } from "@/components/workspace/page-frame";

type Level = "Beginner" | "Intermediate" | "Advanced";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  summary: string;
  body: string;
}

const paths: Record<Level, Lesson[]> = {
  Beginner: [
    { id: "market-basics", title: "How a market works", duration: "6 min", summary: "Exchanges, participants and what an order represents.", body: "A stock exchange is a marketplace where buyers and sellers submit orders. A quote is not a guarantee of execution, and a displayed price can change before an order is matched. Trade Nova's local values are synthetic examples rather than exchange quotes." },
    { id: "order-types", title: "Market and limit orders", duration: "8 min", summary: "Understand price certainty, execution and order conditions.", body: "A market order prioritizes execution but can receive a different price than expected. A limit order sets a maximum buy price or minimum sell price, but may not execute. In this practice app, fills are simulated and do not reach an exchange." },
    { id: "read-risk", title: "Define risk before entry", duration: "7 min", summary: "Plan the amount you can lose before thinking about potential return.", body: "A disciplined practice plan identifies invalidation, position size and the amount at risk before an entry. A stop instruction cannot guarantee a specific exit price during a fast or illiquid market." },
  ],
  Intermediate: [
    { id: "chart-volume", title: "Price, candles and volume", duration: "10 min", summary: "Read a candle's open, high, low and close without overclaiming.", body: "A candlestick summarizes price observations over a time interval. Volume describes how many units traded in that interval. Neither a candle pattern nor volume alone predicts future movement." },
    { id: "position-size", title: "Position sizing", duration: "9 min", summary: "Relate a planned loss to the distance between entry and stop.", body: "A simple educational sizing formula is risk budget divided by per-share risk. It does not account for gaps, slippage, fees, liquidity or changing prices. Use the Risk Simulator to see the arithmetic." },
    { id: "portfolio-exposure", title: "Portfolio concentration", duration: "8 min", summary: "Notice exposure by holding and by related business sector.", body: "Several positions can share exposure to the same industry or risk factor. Diversification does not eliminate losses, but looking at concentration can reveal risks that are easy to miss when reviewing each position separately." },
  ],
  Advanced: [
    { id: "expectancy", title: "Measure a process, not a prediction", duration: "12 min", summary: "Review samples, assumptions and uncertainty in a strategy.", body: "A historical sample can be affected by survivorship, data quality, regime selection and transaction-cost assumptions. Past performance does not ensure future results. Trade Nova's synthetic charts are not suitable for backtesting." },
    { id: "drawdown", title: "Drawdowns and recovery", duration: "9 min", summary: "Understand peak-to-trough loss and the asymmetric recovery math.", body: "A portfolio that falls by a given percentage needs a larger percentage gain to return to its prior value. A drawdown measure describes a past path; a scenario calculation is not a forecast or probability estimate." },
    { id: "review", title: "Build a post-trade review", duration: "10 min", summary: "Separate decision quality from a single outcome.", body: "A well-reasoned decision can have a losing outcome, and a poorly reasoned decision can win by chance. Compare your thesis, risk plan and execution with a series of decisions rather than judging only by the last result." },
  ],
};

const quizQuestion: Record<Level, { question: string; options: string[]; answer: number; rationale: string }> = {
  Beginner: { question: "What does a limit order guarantee?", options: ["Execution at any price", "A specified price or better, if it executes", "A profitable outcome"], answer: 1, rationale: "A limit sets a price condition; execution is not guaranteed." },
  Intermediate: { question: "What is the basic quantity formula in this example?", options: ["Risk budget ÷ entry price", "Risk budget ÷ per-share risk", "Target price ÷ stop price"], answer: 1, rationale: "The simplified formula divides risk budget by the distance from entry to stop." },
  Advanced: { question: "What can a synthetic series establish about a real strategy?", options: ["Reliable expected returns", "Future market direction", "Neither; it is not market history"], answer: 2, rationale: "Synthetic examples do not provide evidence about actual markets or strategy outcomes." },
};

const levels: Level[] = ["Beginner", "Intermediate", "Advanced"];
const progressKey = "trade-nova-learning-progress-v1";
const emptyProgress: string[] = [];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export default function LearningWorkspace() {
  const [level, setLevel] = useState<Level>("Beginner");
  const [completed, setCompleted] = useLocalStorageState(progressKey, emptyProgress, isStringArray);
  const { session } = usePaperTrading();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const lessons = paths[level];
  const totalLessons = Object.values(paths).flat().length;
  const overallProgress = Math.round((completed.length / totalLessons) * 100);
  const achievementCount = useMemo(() => Number(completed.length > 0) + Number(levels.every((item) => paths[item].some((lesson) => completed.includes(lesson.id)))), [completed]);

  const markCompleted = (id: string) => {
    const next = completed.includes(id) ? completed : [...completed, id];
    const persisted = setCompleted(next);
    if (!persisted) setSyncMessage("Progress is only available for this browser session.");
    if (session) {
      void mergeAccountState({ learningProgress: next }).then((result) => {
        setSyncMessage(result.ok ? "Learning progress synced to your account." : `Learning progress sync failed: ${result.message}`);
      }).catch((error: unknown) => {
        setSyncMessage(`Learning progress sync failed: ${error instanceof Error ? error.message : "unknown error"}`);
      });
    }
  };

  return (
    <main className="workspace-content learning-workspace">
      <PageHeader eyebrow="KNOWLEDGE BEFORE EXECUTION" title="Learning Centre" description="Short, practical lessons on markets, analysis, trading mechanics and risk." actions={<Tag>{session ? "ACCOUNT SYNC" : "PROGRESS SAVED LOCALLY"}</Tag>} />
      {syncMessage && <div className="inline-feedback" role="status">{syncMessage}</div>}
      <section className="learning-progress-hero"><div><span className="section-kicker">YOUR LEARNING PATH</span><h2>Build your market toolkit.</h2><p>Learn a concept, test your understanding, then practise without real money.</p><div className="learning-progress-track"><i style={{ width: `${overallProgress}%` }} /></div><small>{completed.length} of {totalLessons} lessons complete · {overallProgress}% overall</small></div><div className="learning-achievements"><div className="achievement-medal"><Icon name="learning" size={23} /></div><span>ACHIEVEMENTS</span><strong>{achievementCount} earned</strong><small>{achievementCount ? "Practice milestone recorded" : "Complete a lesson to earn one"}</small></div></section>
      <div className="learning-level-tabs" role="tablist" aria-label="Course difficulty">{levels.map((item) => <button key={item} type="button" role="tab" aria-selected={level === item} className={level === item ? "selected" : ""} onClick={() => { setLevel(item); setActiveLesson(null); setQuizOpen(false); setSubmitted(false); }}>{item}<span>{paths[item].filter((lesson) => completed.includes(lesson.id)).length}/{paths[item].length}</span></button>)}</div>
      <div className="learning-course-grid">
        <section className="learning-courses-column"><div className="learning-course-intro"><div><span className="section-kicker">{level.toUpperCase()} PATH</span><h2>{level === "Beginner" ? "Start with the essentials" : level === "Intermediate" ? "Read a market with context" : "Think in systems and evidence"}</h2></div><span className="learning-estimate">{lessons.length * 8} min total</span></div>
          {lessons.map((lesson, index) => {
            const done = completed.includes(lesson.id);
            return <article className={`learning-course-card${activeLesson?.id === lesson.id ? " expanded" : ""}`} key={lesson.id}><button className="learning-course-summary" type="button" onClick={() => { setActiveLesson(activeLesson?.id === lesson.id ? null : lesson); setQuizOpen(false); }}><span className={`lesson-number${done ? " lesson-complete" : ""}`}>{done ? <Icon name="check" size={14} /> : `0${index + 1}`}</span><span className="learning-course-copy"><small>{lesson.duration} · {level}</small><strong>{lesson.title}</strong><span>{lesson.summary}</span></span><Icon className="learning-course-chevron" name="chevron" size={15} /></button>{activeLesson?.id === lesson.id && <div className="learning-lesson-body"><p>{lesson.body}</p><div><button type="button" className={done ? "completed-lesson-button" : "primary-button"} onClick={() => markCompleted(lesson.id)}>{done ? <><Icon name="check" size={14} /> Completed</> : "Mark lesson complete"}</button><button type="button" className="secondary-button" onClick={() => { setQuizOpen(true); setAnswer(null); setSubmitted(false); }}>Take knowledge check</button></div>{quizOpen && <div className="quiz-panel"><span className="section-kicker">KNOWLEDGE CHECK · {level.toUpperCase()}</span><strong>{quizQuestion[level].question}</strong>{quizQuestion[level].options.map((option, optionIndex) => <label key={option}><input type="radio" name="lesson-quiz" checked={answer === optionIndex} onChange={() => setAnswer(optionIndex)} /><span>{option}</span></label>)}<button type="button" className="primary-button" disabled={answer === null} onClick={() => setSubmitted(true)}>Check answer</button>{submitted && <p className={answer === quizQuestion[level].answer ? "quiz-correct" : "quiz-incorrect"}>{answer === quizQuestion[level].answer ? "Correct. " : "Review this concept. "}{quizQuestion[level].rationale}</p>}</div>}</div>}</article>;
          })}
        </section>
        <aside className="learning-side-column"><Panel title="Learning principles" description="The goal is informed practice, not a shortcut."><div className="learning-principles">{[["01", "Understand before applying", "Learn what an indicator measures and what it cannot tell you."], ["02", "Protect your downside", "Define risk and size before exploring a trade idea."], ["03", "Review more than outcomes", "Reflect on the process across multiple decisions."]].map(([number, title, description]) => <div key={number}><span>{number}</span><div><strong>{title}</strong><p>{description}</p></div></div>)}</div></Panel><Panel title="Your milestones" description="Badges reflect completion only."><div className="learning-badges"><div className={completed.length > 0 ? "badge-earned" : ""}><Icon name="check" size={15} /><span><strong>First lesson</strong><small>{completed.length ? "Earned" : "Locked"}</small></span></div><div className={achievementCount > 1 ? "badge-earned" : ""}><Icon name="spark" size={15} /><span><strong>Multi-level explorer</strong><small>{achievementCount > 1 ? "Earned" : "Complete one lesson per level"}</small></span></div></div></Panel><div className="learning-advice-note"><Icon name="risk" size={15} /><span>Educational content only. Not individualized financial advice or a recommendation to trade.</span></div></aside>
      </div>
    </main>
  );
}
