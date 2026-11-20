
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Indicators = {
  rsi: number;
  sma20: number;
  sma50: number;
  lastClose: number;
  seriesChangePct: number;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { symbol, indicators, isSynthetic } = body as {
      symbol?: string;
      indicators?: Indicators;
      isSynthetic?: boolean;
    };

    if (
      typeof symbol !== "string" ||
      !/^[A-Z0-9._-]{1,20}$/i.test(symbol) ||
      !indicators ||
      !["rsi", "sma20", "sma50", "lastClose", "seriesChangePct"].every(
        (key) =>
          typeof indicators[key as keyof Indicators] === "number" &&
          Number.isFinite(indicators[key as keyof Indicators])
      )
    ) {
      return NextResponse.json(
        { error: "Invalid symbol or indicator data." },
        { status: 400 }
      );
    }

    if (isSynthetic !== true) {
      return NextResponse.json(
        {
          error:
            "This endpoint currently accepts synthetic demo data only.",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: `
Explain these TRADE NOVA educational demo indicators for ${symbol}.

IMPORTANT:
- The supplied values are synthetic practice data, NOT live exchange data.
- Do not claim to know current market conditions or real company performance.
- Do not give buy, sell, or hold recommendations.
- Do not predict guaranteed prices or returns.
- Explain what the indicators may suggest and their limitations.
- Clearly mention that this is educational analysis, not financial advice.

Demo indicators:
RSI: ${indicators.rsi}
SMA 20: ${indicators.sma20}
SMA 50: ${indicators.sma50}
Last simulated close: ${indicators.lastClose}
Simulated series change: ${indicators.seriesChangePct}%

Respond with these short sections:
1. Trend observation
2. Momentum observation
3. Indicator comparison
4. Risks and limitations
5. Learning takeaway
`,
      config: {
        temperature: 0.4,
        maxOutputTokens: 700,
      },
    });

    const analysis = response.text;

    if (!analysis) {
      return NextResponse.json(
        { error: "Gemini returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      analysis,
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      dataSource: "SYNTHETIC_DEMO",
    });
  } catch (error) {
    console.error("Neon Intelligence API error:", error);

    return NextResponse.json(
      { error: "Unable to generate analysis. Please try again." },
      { status: 500 }
    );
  }
}
