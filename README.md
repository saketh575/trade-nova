# TRADE NOVA

**Think Smarter. Trade Wiser.**

TRADE NOVA is an educational market-intelligence and paper-trading workspace. It is being developed in phases for a college project and hackathon demonstration; it does not connect to a broker or place real-money trades.

## Current status

TRADE NOVA currently runs as an educational demo with a responsive dark workspace, dedicated pages, interactive SVG charts, and browser-persisted practice settings and paper-account activity. The paper account starts with ₹10,00,000 in virtual cash; balances, holdings, fees, and P&L are derived from its simulated order ledger.

**All instrument prices, index values, movements, chart candles, and replay candles are illustrative synthetic samples—not live, delayed, or historical market data.** There is no licensed market-data provider, exchange connection, real-money brokerage, or AI model configured. NEON indicators are locally calculated from sample series; stop-loss and target values on paper orders are notes only and are not auto-triggered. Without Supabase credentials, browser storage is for this demo only and is not a shared account database.

## Workspace routes

- `/overview` — illustrative index snapshot, paper-account summary, charts, movers, and activity
- `/markets` — searchable demo instrument explorer, filters, charts, and watchlist controls
- `/watchlist` — local custom lists, instrument search, and sorting
- `/portfolio` — ledger-derived holdings, allocation, equity history, and order activity
- `/paper-trading` — virtual market/limit orders, pending-order actions, positions, and simulated fills
- `/neon-intelligence` — sample-series indicators, review checklist, and local trading journal
- `/market-replay` — synthetic practice-candle playback and virtual replay trades (not historical replay)
- `/risk-simulator` — interactive position sizing, risk/reward, and drawdown scenarios
- `/learning` — lessons, quizzes, progress, and achievements stored locally
- `/settings` — local profile/theme/preferences, demo data status, and reset controls

The root route `/` redirects to `/overview`. Sidebar navigation is shared through the route-group layout.

## Run locally

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Run the checks with:

```bash
npm run lint
npm run build
```

## Technology

- Next.js 16 App Router
- React and TypeScript
- Tailwind CSS 4 plus project-specific CSS for the dashboard design system

No external market-data, authentication, charting, or database packages are required for the local demo. The chart and sample-data adapters are replaceable; provider integration remains a separate phase.

## Optional account synchronization

The web app and `apps/mobile` support the same Supabase Auth project and `user_app_state` row format. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the website's `.env.local`, configure the `EXPO_PUBLIC_` equivalents in `apps/mobile/.env`, and run [apps/mobile/supabase/schema.sql](./apps/mobile/supabase/schema.sql) in that project. The schema enables row-level security and restricts each account to its own state. The browser's pre-existing anonymous demo data is not automatically migrated unless the signed-in user has no remote state; review before sharing a device.

## Mobile app

The Expo Router app is isolated under [apps/mobile](./apps/mobile). Follow [its README](./apps/mobile/README.md) for Android emulator, iOS simulator, Expo Go, Supabase and EAS build setup. It shares the existing market and paper-portfolio TypeScript logic; without a configured backend it uses clearly labeled sample data.

## Planned implementation

Supabase Postgres and Auth are the preferred database/auth direction for a future phase, subject to project setup. Market-data vendors remain under evaluation: API access, Indian symbol/index coverage, historical endpoints, WebSocket availability, pricing, exchange licensing and demo-display rights must be verified before choosing a provider. Keep all credentials server-side and never expose provider keys in client code.

See the approved phased plan in the project conversation before starting later-phase integrations.
