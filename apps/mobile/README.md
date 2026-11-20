# TRADE NOVA mobile

Expo Router app for Android and iOS, located separately from the Next.js website.
The app shares the website's market-data and paper-portfolio TypeScript modules;
the mobile-only dependency lockfile is in this directory.

## Run on a device or emulator

From the repository root:

```powershell
cd apps\mobile
npm install
npm start
```

Press `a` to open an Android emulator or scan the Expo Go QR code on a device.
Android Studio and an installed emulator are required for `npm run android`.
To use the Next.js market endpoint on an Android emulator, copy `.env.example` to
`.env` and set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000`. On an iOS
simulator use `http://localhost:3000`; on a physical device use the development
computer's LAN address. Restart Expo after editing environment values.

An iOS simulator and native iOS builds require macOS. On macOS, run
`npm run ios`; on Windows, use Expo Go on a physical iOS device or submit a
cloud EAS build. The app includes `development`, `preview`, and `production`
profiles in `eas.json`; link a real Expo project with `npx eas-cli@latest init`
before EAS builds or remote push-token registration.

## Market and account configuration

Without an API URL, mobile uses the existing shared local adapter and displays
**DEMO** status. Its sample quotes, index movements, candles and replay series
are illustrative, not live, delayed, or historical data. If a configured market
endpoint is unavailable, the app shows the error and does not relabel fallback
values as live. The Next.js endpoint at `/api/mobile/market` currently returns
the same demo adapter; it is a replaceable service boundary, not a licensed
feed.

To enable Supabase Auth and cross-device app-state sync, set
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`, then
run the SQL in `supabase/schema.sql` in the same Supabase project used by the
website. These are client-side project values; never use a service-role key in
the app. Row-level security restricts the JSON app-state row to its owner.
Without credentials, paper trading, watchlists, preferences, journal entries
and learning progress persist locally.

The website's existing practice account is browser-local until Supabase is
configured. To synchronize a website account, configure that website with the
same Supabase project and `user_app_state` schema, then sign in on both clients.
Pre-existing anonymous browser data is not automatically migrated into an
account that already has remote state.

Notification permission and local test notifications work on-device. Remote
push delivery requires an EAS project, APNs/FCM setup and a trusted server
sender; no push service credentials are included in this repository.

## Validation

```powershell
npm run typecheck
npm run doctor
npx expo export --platform android
```
