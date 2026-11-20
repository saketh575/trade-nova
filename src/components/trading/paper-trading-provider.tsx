"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { demoMarketDataProvider } from "@/lib/market-data";
import {
  calculateFees,
  createInitialPaperState,
  createOrderId,
  derivePortfolio,
  isPaperTradingState,
  type NewOrder,
  type PaperOrder,
  type PaperTradingState,
  type Watchlist,
} from "@/lib/paper-trading";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const STORAGE_KEY = "trade-nova-paper-state-v1";

interface ActionResult {
  ok: boolean;
  message: string;
  order?: PaperOrder;
}

interface FillResult extends ActionResult {
  nextState?: PaperTradingState;
}

interface StoreSnapshot {
  state: PaperTradingState;
  persistenceWarning: string | null;
}

interface PaperTradingContextValue extends StoreSnapshot {
  hydrated: boolean;
  session: Session | null;
  authConfigured: boolean;
  cloudStatus: "local" | "syncing" | "synced" | "error";
  cloudMessage: string | null;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<string>;
  summary: ReturnType<typeof derivePortfolio>;
  activeWatchlist: Watchlist;
  placeOrder: (order: NewOrder) => ActionResult;
  simulateLimitFill: (orderId: string) => ActionResult;
  cancelOrder: (orderId: string) => ActionResult;
  createWatchlist: (name: string) => ActionResult;
  selectWatchlist: (watchlistId: string) => void;
  deleteWatchlist: (watchlistId: string) => ActionResult;
  toggleSymbol: (symbol: string, watchlistId?: string) => void;
  resetPaperAccount: () => void;
}

const PaperTradingContext = createContext<PaperTradingContextValue | null>(null);
const serverSnapshot: StoreSnapshot = { state: createInitialPaperState(), persistenceWarning: null };
const storeListeners = new Set<() => void>();
let activeAccountId: string | null = null;

function notifyStoreListeners() {
  storeListeners.forEach((notify) => notify());
}

function persistBrowserState(state: PaperTradingState) {
  const key = activeAccountId ? userStorageKey(activeAccountId) : STORAGE_KEY;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
    browserSnapshot = { state, persistenceWarning: null };
  } catch (error) {
    console.error("Could not save the local paper-trading account.", error);
    browserSnapshot = { state, persistenceWarning: "Browser storage is unavailable. Paper trades will only last for this session." };
  }
  notifyStoreListeners();
}

async function syncPaperState(state: PaperTradingState): Promise<string | null> {
  if (!supabase || !activeAccountId) return null;
  const { error } = await supabase.rpc("merge_trade_nova_state", { state_patch: { paperTrading: state } });
  if (error) {
    console.error("Could not sync paper-trading state to Supabase.", error);
    browserSnapshot = { ...browserSnapshot, persistenceWarning: `Account sync failed: ${error.message}` };
    notifyStoreListeners();
    return error.message;
  } else if (browserSnapshot.persistenceWarning?.startsWith("Account sync failed:")) {
    browserSnapshot = { ...browserSnapshot, persistenceWarning: null };
    notifyStoreListeners();
  }
  return null;
}

function readLocalSyncPayload(): Record<string, unknown> {
  try {
    const storedLearning = window.localStorage.getItem("trade-nova-learning-progress-v1");
    const parsedLearning: unknown = storedLearning ? JSON.parse(storedLearning) : [];
    const storedNotifications = window.localStorage.getItem("trade-nova-notification-preferences-v1");
    const parsedNotifications: unknown = storedNotifications ? JSON.parse(storedNotifications) : null;
    const storedName = window.localStorage.getItem("trade-nova-profile-name");
    const storedTheme = window.localStorage.getItem("trade-nova-theme");
    let displayName: unknown = "Student";
    let theme: unknown = "charcoal";
    if (storedName) {
      try { displayName = JSON.parse(storedName); } catch { displayName = storedName; }
    }
    if (storedTheme) {
      try { theme = JSON.parse(storedTheme); } catch { theme = storedTheme; }
    }
    const notifications = parsedNotifications && typeof parsedNotifications === "object"
      ? parsedNotifications
      : { orderFills: true, watchlistChanges: false, learningReminders: true };
    const preferences = notifications as { orderFills?: unknown };
    return {
      learningProgress: Array.isArray(parsedLearning) && parsedLearning.every((item) => typeof item === "string") ? parsedLearning : [],
      settings: {
        displayName: typeof displayName === "string" ? displayName : "Student",
        theme: theme === "oled" ? "oled" : "charcoal",
        notifications,
        notificationsEnabled: preferences.orderFills === true,
        expoPushToken: null,
      },
    };
  } catch (error) {
    console.error("Could not read local account preferences for synchronization.", error);
    return { learningProgress: [] };
  }
}

function readBrowserSnapshot(): StoreSnapshot {
  return readSnapshotForKey(STORAGE_KEY);
}

function userStorageKey(userId: string) {
  return `${STORAGE_KEY}:user:${userId}`;
}

function readSnapshotForKey(key: string): StoreSnapshot {
  if (typeof window === "undefined") return serverSnapshot;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return serverSnapshot;
    const parsed: unknown = JSON.parse(raw);
    if (isPaperTradingState(parsed)) return { state: parsed, persistenceWarning: null };
    console.error("Saved paper-trading state has an invalid shape.");
    return { state: serverSnapshot.state, persistenceWarning: "Saved demo data could not be read; a fresh local paper account is active." };
  } catch (error) {
    console.error("Could not load the local paper-trading account.", error);
    return { state: serverSnapshot.state, persistenceWarning: "Browser storage is unavailable. Paper trades will only last for this session." };
  }
}

let browserSnapshot = readBrowserSnapshot();

function getSnapshot() {
  return browserSnapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function subscribe(listener: () => void) {
  storeListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && !event.key?.startsWith(`${STORAGE_KEY}:`)) return;
    browserSnapshot = readSnapshotForKey(activeAccountId ? userStorageKey(activeAccountId) : STORAGE_KEY);
    storeListeners.forEach((notify) => notify());
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    storeListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function commitState(state: PaperTradingState) {
  let persistenceWarning: string | null = null;
  const key = activeAccountId ? userStorageKey(activeAccountId) : STORAGE_KEY;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error("Could not persist the local paper-trading account.", error);
    persistenceWarning = "Browser storage is unavailable. Paper trades will only last for this session.";
  }
  browserSnapshot = { state, persistenceWarning };
  notifyStoreListeners();
  void syncPaperState(state).catch((error: unknown) => {
    console.error("Could not sync paper-trading state to Supabase.", error);
    browserSnapshot = { ...browserSnapshot, persistenceWarning: "Account sync failed. Your browser copy is still available." };
    notifyStoreListeners();
  });
}

function isMarketable(order: NewOrder, marketPricePaise: number): boolean {
  if (order.orderType === "market" || order.limitPricePaise === undefined) return true;
  return order.side === "buy"
    ? order.limitPricePaise >= marketPricePaise
    : order.limitPricePaise <= marketPricePaise;
}

function applyFill(state: PaperTradingState, order: PaperOrder, fillPricePaise: number): FillResult {
  const notionalPaise = fillPricePaise * order.quantity;
  const feesPaise = calculateFees(notionalPaise);
  const portfolio = derivePortfolio(state);

  if (order.side === "buy" && state.cashPaise < notionalPaise + feesPaise) {
    return { ok: false, message: "Not enough virtual cash for this order, including estimated fees." };
  }
  if (order.side === "sell") {
    const holding = portfolio.holdings.find((item) => item.symbol === order.symbol);
    if (!holding || holding.quantity < order.quantity) {
      return { ok: false, message: `You do not have enough ${order.symbol} shares in this paper account.` };
    }
  }

  const filledOrder: PaperOrder = { ...order, status: "filled", pricePaise: fillPricePaise, feesPaise };
  const cashPaise = state.cashPaise + (order.side === "buy" ? -notionalPaise - feesPaise : notionalPaise - feesPaise);
  const alreadyExists = state.orders.some((item) => item.id === order.id);
  const orders = alreadyExists
    ? state.orders.map((item) => item.id === order.id ? filledOrder : item)
    : [filledOrder, ...state.orders];
  const nextState = { ...state, cashPaise, orders };
  const nextSummary = derivePortfolio(nextState);

  return {
    ok: true,
    message: `${order.side === "buy" ? "Buy" : "Sell"} filled in simulation.`,
    order: filledOrder,
    nextState: {
      ...nextState,
      equitySnapshots: [...state.equitySnapshots, { at: filledOrder.createdAt, valuePaise: nextSummary.totalValuePaise }],
    },
  };
}

function placeOrder(input: NewOrder): ActionResult {
  const current = browserSnapshot.state;
  const instrument = demoMarketDataProvider.getInstrument(input.symbol);
  if (!instrument || instrument.exchange !== "NSE") return { ok: false, message: "Choose an available NSE demo instrument." };
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) return { ok: false, message: "Enter a whole-share quantity greater than zero." };
  const referencePricePaise = input.referencePricePaise ?? instrument.pricePaise;
  if (!Number.isSafeInteger(referencePricePaise) || referencePricePaise <= 0) return { ok: false, message: "The simulated reference price is invalid." };
  if (input.orderType === "limit" && (!input.limitPricePaise || input.limitPricePaise <= 0)) return { ok: false, message: "Enter a valid limit price." };

  const order: PaperOrder = {
    id: createOrderId(),
    symbol: input.symbol,
    side: input.side,
    orderType: input.orderType,
    quantity: input.quantity,
    status: "pending",
    pricePaise: input.limitPricePaise ?? referencePricePaise,
    limitPricePaise: input.orderType === "limit" ? input.limitPricePaise : undefined,
    stopLossPaise: input.stopLossPaise,
    targetPricePaise: input.targetPricePaise,
    feesPaise: 0,
    createdAt: new Date().toISOString(),
  };

  if (!isMarketable(input, referencePricePaise)) {
    commitState({ ...current, orders: [order, ...current.orders] });
    return { ok: true, message: "Limit order added to pending orders.", order };
  }
  const result = applyFill(current, order, referencePricePaise);
  if (result.ok && result.nextState) commitState(result.nextState);
  return { ok: result.ok, message: result.message, order: result.order };
}

function simulateLimitFill(orderId: string): ActionResult {
  const current = browserSnapshot.state;
  const order = current.orders.find((item) => item.id === orderId && item.status === "pending");
  if (!order) return { ok: false, message: "That pending order is no longer available." };
  const result = applyFill(current, order, order.limitPricePaise ?? order.pricePaise);
  if (!result.ok || !result.order || !result.nextState) return { ok: result.ok, message: result.message, order: result.order };
  commitState(result.nextState);
  return { ok: true, order: result.order, message: "Limit order filled at its limit price in simulation." };
}

function cancelOrder(orderId: string): ActionResult {
  const current = browserSnapshot.state;
  const order = current.orders.find((item) => item.id === orderId && item.status === "pending");
  if (!order) return { ok: false, message: "Only pending orders can be cancelled." };
  commitState({ ...current, orders: current.orders.map((item) => item.id === orderId ? { ...item, status: "cancelled" } : item) });
  return { ok: true, message: "Pending order cancelled." };
}

function createWatchlist(name: string): ActionResult {
  const cleanName = name.trim().slice(0, 32);
  if (!cleanName) return { ok: false, message: "Enter a name for the watchlist." };
  const current = browserSnapshot.state;
  if (current.watchlists.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) return { ok: false, message: "A watchlist with that name already exists." };
  const id = createOrderId();
  commitState({ ...current, watchlists: [...current.watchlists, { id, name: cleanName, symbols: [] }], activeWatchlistId: id });
  return { ok: true, message: `${cleanName} watchlist created.` };
}

function selectWatchlist(watchlistId: string) {
  const current = browserSnapshot.state;
  if (current.watchlists.some((item) => item.id === watchlistId)) commitState({ ...current, activeWatchlistId: watchlistId });
}

function deleteWatchlist(watchlistId: string): ActionResult {
  const current = browserSnapshot.state;
  if (current.watchlists.length <= 1) return { ok: false, message: "Keep at least one watchlist in your demo account." };
  const watchlists = current.watchlists.filter((item) => item.id !== watchlistId);
  const activeWatchlistId = current.activeWatchlistId === watchlistId ? watchlists[0].id : current.activeWatchlistId;
  commitState({ ...current, watchlists, activeWatchlistId });
  return { ok: true, message: "Watchlist removed." };
}

function toggleSymbol(symbol: string, watchlistId = browserSnapshot.state.activeWatchlistId) {
  if (!demoMarketDataProvider.getInstrument(symbol)) return;
  const current = browserSnapshot.state;
  const watchlists = current.watchlists.map((list) => list.id !== watchlistId ? list : {
    ...list,
    symbols: list.symbols.includes(symbol)
      ? list.symbols.filter((item) => item !== symbol)
      : [...list.symbols, symbol],
  });
  commitState({ ...current, watchlists });
}

function resetPaperAccount() {
  commitState(createInitialPaperState());
}

export function PaperTradingProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [session, setSession] = useState<Session | null>(null);
  const [cloudStatus, setCloudStatus] = useState<"local" | "syncing" | "synced" | "error">(supabaseConfigured ? "syncing" : "local");
  const [cloudMessage, setCloudMessage] = useState<string | null>(supabaseConfigured ? null : "Supabase is not configured; this paper account stays in browser storage.");

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    const applySession = async (nextSession: Session | null) => {
      activeAccountId = nextSession?.user.id ?? null;
      setSession(nextSession);
      if (!nextSession) {
        browserSnapshot = readSnapshotForKey(STORAGE_KEY);
        notifyStoreListeners();
        setCloudStatus("local");
        setCloudMessage(null);
        return;
      }

      setCloudStatus("syncing");
      const { data, error } = await client
        .from("user_app_state")
        .select("payload")
        .eq("user_id", nextSession.user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setCloudStatus("error");
        setCloudMessage(`Account data could not be loaded: ${error.message}`);
        return;
      }

      const payload = data?.payload && typeof data.payload === "object"
        ? data.payload as { paperTrading?: unknown; learningProgress?: unknown; settings?: unknown }
        : undefined;
      if (payload && isPaperTradingState(payload.paperTrading)) {
        persistBrowserState(payload.paperTrading);
        setCloudStatus("synced");
        setCloudMessage("Paper account and watchlists loaded from your account.");
      } else {
        setCloudMessage("Your current browser paper account will be added to this account.");
      }

      const localPayload = readLocalSyncPayload();
      const patch: Record<string, unknown> = {};
      if (!payload || !Array.isArray(payload.learningProgress)) {
        patch.learningProgress = localPayload.learningProgress;
      } else if (payload.learningProgress.every((item) => typeof item === "string")) {
        window.localStorage.setItem("trade-nova-learning-progress-v1", JSON.stringify(payload.learningProgress));
      }
      if (!payload || !payload.settings || typeof payload.settings !== "object") {
        patch.settings = localPayload.settings;
      } else {
        const remoteSettings = payload.settings as Record<string, unknown>;
        if (typeof remoteSettings.displayName === "string") window.localStorage.setItem("trade-nova-profile-name", JSON.stringify(remoteSettings.displayName));
        if (remoteSettings.theme === "charcoal" || remoteSettings.theme === "oled") window.localStorage.setItem("trade-nova-theme", JSON.stringify(remoteSettings.theme));
        if (remoteSettings.notifications && typeof remoteSettings.notifications === "object") {
          window.localStorage.setItem("trade-nova-notification-preferences-v1", JSON.stringify(remoteSettings.notifications));
        }
      }
      if (!payload || !isPaperTradingState(payload.paperTrading)) patch.paperTrading = browserSnapshot.state;
      if (Object.keys(patch).length) {
        const { error: syncError } = await client.rpc("merge_trade_nova_state", { state_patch: patch });
        if (syncError) {
          if (active) {
            setCloudStatus("error");
            setCloudMessage(`Initial account sync failed: ${syncError.message}`);
          }
          return;
        }
      }
      persistBrowserState(browserSnapshot.state);
      if (active) setCloudStatus("synced");
    };

    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        setCloudStatus("error");
        setCloudMessage(`Authentication session could not be loaded: ${error.message}`);
      }
      return applySession(data.session);
    }).catch((error: unknown) => {
      if (!active) return;
      const message = error instanceof Error ? error.message : "Authentication session could not be loaded.";
      setCloudStatus("error");
      setCloudMessage(message);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession).catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Account data could not be loaded.";
        setCloudStatus("error");
        setCloudMessage(message);
      });
    });

    return () => {
      active = false;
      activeAccountId = null;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return "Supabase is not configured.";
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setCloudStatus("error");
        setCloudMessage(error.message);
        return error.message;
      }
      return "Signed in. Loading your paper account.";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign in.";
      setCloudStatus("error");
      setCloudMessage(message);
      return message;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return "Supabase is not configured.";
    try {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) {
        setCloudStatus("error");
        setCloudMessage(error.message);
        return error.message;
      }
      return "Account created. Check your email if confirmation is enabled in Supabase.";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create an account.";
      setCloudStatus("error");
      setCloudMessage(message);
      return message;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return "Supabase is not configured.";
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) return "Signed out. This browser's saved demo data remains on this device.";
      setCloudStatus("error");
      setCloudMessage(error.message);
      return error.message;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign out.";
      setCloudStatus("error");
      setCloudMessage(message);
      return message;
    }
  }, []);

  const summary = useMemo(() => derivePortfolio(snapshot.state), [snapshot.state]);
  const activeWatchlist = snapshot.state.watchlists.find((item) => item.id === snapshot.state.activeWatchlistId) ?? snapshot.state.watchlists[0];
  const value = useMemo<PaperTradingContextValue>(() => ({
    ...snapshot,
    hydrated: true,
    session,
    authConfigured: supabaseConfigured,
    cloudStatus,
    cloudMessage,
    signIn,
    signUp,
    signOut,
    summary,
    activeWatchlist,
    placeOrder,
    simulateLimitFill,
    cancelOrder,
    createWatchlist,
    selectWatchlist,
    deleteWatchlist,
    toggleSymbol,
    resetPaperAccount,
  }), [snapshot, summary, activeWatchlist, session, cloudStatus, cloudMessage, signIn, signUp, signOut]);

  return <PaperTradingContext.Provider value={value}>{children}</PaperTradingContext.Provider>;
}

export function usePaperTrading(): PaperTradingContextValue {
  const context = useContext(PaperTradingContext);
  if (!context) throw new Error("usePaperTrading must be used inside PaperTradingProvider.");
  return context;
}
