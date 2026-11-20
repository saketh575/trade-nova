import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
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
} from '../../../src/lib/paper-trading';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Alert } from 'react-native';
import { currentInstrument, currentPrices, fetchMarketSnapshot, getDemoMarketSnapshot, marketApiBaseUrl, type MarketSnapshot } from './market-data';
import { supabase, supabaseConfigured } from './supabase';

interface AccountSettings {
  displayName: string;
  notificationsEnabled: boolean;
  expoPushToken: string | null;
  [key: string]: unknown;
}

interface PersistedAppState {
  paperTrading: PaperTradingState;
  learningProgress: string[];
  journalEntries: JournalEntry[];
  settings: AccountSettings;
}

export interface JournalEntry {
  id: string;
  symbol: string;
  note: string;
  createdAt: string;
}

type CloudStatus = 'local' | 'syncing' | 'synced' | 'error';

interface MobileAppContextValue {
  appState: PersistedAppState;
  paperState: PaperTradingState;
  summary: ReturnType<typeof derivePortfolio>;
  activeWatchlist: Watchlist;
  market: MarketSnapshot | null;
  marketStale: boolean;
  marketLoading: boolean;
  marketError: string | null;
  refreshMarket: () => Promise<void>;
  hydrated: boolean;
  session: Session | null;
  authConfigured: boolean;
  authError: string | null;
  cloudStatus: CloudStatus;
  cloudMessage: string | null;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
  toggleSymbol: (symbol: string, watchlistId?: string) => void;
  createWatchlist: (name: string) => string | null;
  selectWatchlist: (id: string) => void;
  deleteWatchlist: (id: string) => string | null;
  placeOrder: (input: NewOrder) => { ok: boolean; message: string; order?: PaperOrder };
  fillLimitOrder: (orderId: string) => { ok: boolean; message: string };
  cancelOrder: (orderId: string) => boolean;
  markLessonComplete: (lessonId: string) => void;
  addJournalEntry: (symbol: string, note: string) => string | null;
  setDisplayName: (name: string) => void;
  setNotifications: (enabled: boolean, pushToken?: string | null) => void;
}

const APP_STATE_VERSION = 1;
const DEFAULT_SETTINGS: AccountSettings = { displayName: 'Trader', notificationsEnabled: false, expoPushToken: null };
const MobileAppContext = createContext<MobileAppContextValue | null>(null);

function makeDefaultState(): PersistedAppState {
  return { paperTrading: createInitialPaperState(), learningProgress: [], journalEntries: [], settings: DEFAULT_SETTINGS };
}

function normalizePersistedAppState(value: unknown): PersistedAppState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<PersistedAppState>;
  if (!isPaperTradingState(candidate.paperTrading)) return null;
  const learningProgress = Array.isArray(candidate.learningProgress)
    ? candidate.learningProgress.filter((item): item is string => typeof item === 'string')
    : [];
  const journalEntries = Array.isArray(candidate.journalEntries)
    ? candidate.journalEntries.filter((item): item is JournalEntry => Boolean(item)
      && typeof item.id === 'string'
      && typeof item.symbol === 'string'
      && typeof item.note === 'string'
      && typeof item.createdAt === 'string')
    : [];
  const incomingSettings = candidate.settings && typeof candidate.settings === 'object'
    ? candidate.settings as Partial<AccountSettings>
    : {};
  const settings: AccountSettings = {
    ...DEFAULT_SETTINGS,
    ...incomingSettings,
    displayName: typeof incomingSettings.displayName === 'string' ? incomingSettings.displayName : DEFAULT_SETTINGS.displayName,
    notificationsEnabled: typeof incomingSettings.notificationsEnabled === 'boolean' ? incomingSettings.notificationsEnabled : DEFAULT_SETTINGS.notificationsEnabled,
    expoPushToken: typeof incomingSettings.expoPushToken === 'string' ? incomingSettings.expoPushToken : null,
  };
  return { paperTrading: candidate.paperTrading, learningProgress, journalEntries, settings };
}

function storageKey(userId: string | null) {
  return `trade-nova-mobile-state-v${APP_STATE_VERSION}:${userId ?? 'guest'}`;
}

function isMarketable(input: NewOrder, marketPricePaise: number) {
  if (input.orderType === 'market' || input.limitPricePaise === undefined) return true;
  return input.side === 'buy'
    ? input.limitPricePaise >= marketPricePaise
    : input.limitPricePaise <= marketPricePaise;
}

export function MobileAppProvider({ children }: PropsWithChildren) {
  const [appState, setAppState] = useState<PersistedAppState>(makeDefaultState);
  const [market, setMarket] = useState<MarketSnapshot | null>(marketApiBaseUrl ? null : getDemoMarketSnapshot());
  const [marketLoading, setMarketLoading] = useState(Boolean(marketApiBaseUrl));
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketStale, setMarketStale] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(supabaseConfigured ? 'syncing' : 'local');
  const [cloudMessage, setCloudMessage] = useState<string | null>(supabaseConfigured ? null : 'Supabase is not configured; data is saved on this device.');
  const [hydrated, setHydrated] = useState(false);
  const loadedKey = useRef<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshMarket = useCallback(async () => {
    if (!marketApiBaseUrl) {
      setMarket(getDemoMarketSnapshot());
      setMarketError(null);
      setMarketStale(false);
      setMarketLoading(false);
      return;
    }

    setMarketLoading(true);
    setMarketError(null);
    try {
      const next = await fetchMarketSnapshot();
      setMarket(next);
      setMarketStale(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Market data service is unavailable.';
      setMarketError(message);
      setMarketStale(true);
      setMarket((previous) => previous ? { ...previous } : null);
    } finally {
      setMarketLoading(false);
    }
  }, []);

  const loadForUser = useCallback(async (userId: string | null) => {
    const key = storageKey(userId);
    let nextState = makeDefaultState();

    try {
      const local = await AsyncStorage.getItem(key);
      if (local) {
        const parsed: unknown = JSON.parse(local);
        const normalized = normalizePersistedAppState(parsed);
        if (normalized) nextState = normalized;
        else setCloudMessage('Saved device data could not be read; a fresh local practice account is active.');
      }
    } catch (error) {
      setCloudMessage(error instanceof Error ? `Device storage error: ${error.message}` : 'Device storage is unavailable.');
    }

    if (userId && supabase) {
      setCloudStatus('syncing');
      try {
        const { data, error } = await supabase
          .from('user_app_state')
          .select('payload')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) throw error;
        const normalized = normalizePersistedAppState(data?.payload);
        if (normalized) {
          nextState = normalized;
          await AsyncStorage.setItem(key, JSON.stringify(nextState));
          setCloudMessage(null);
        } else {
          setCloudMessage('Account connected. Device data will sync to your Supabase account.');
        }
        setCloudStatus('synced');
      } catch (error) {
        setCloudStatus('error');
        setCloudMessage(error instanceof Error ? `Cloud data could not be loaded: ${error.message}` : 'Cloud data could not be loaded.');
      }
    } else {
      setCloudStatus('local');
      if (!supabaseConfigured) setCloudMessage('Supabase is not configured; data is saved on this device.');
    }

    setAppState(nextState);
    loadedKey.current = key;
    setHydrated(true);
  }, []);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      void Promise.resolve().then(() => loadForUser(null));
      return () => { active = false; };
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      void loadForUser(data.session?.user.id ?? null);
    }).catch((error: unknown) => {
      if (!active) return;
      setAuthError(error instanceof Error ? error.message : 'Could not restore the signed-in session.');
      void loadForUser(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthError(null);
      void loadForUser(nextSession?.user.id ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadForUser]);

  useEffect(() => {
    if (!marketApiBaseUrl) return;
    void Promise.resolve().then(() => refreshMarket());
    const interval = setInterval(() => { void refreshMarket(); }, 60_000);
    return () => clearInterval(interval);
  }, [refreshMarket]);

  useEffect(() => {
    if (!market?.updatedAt) return;
    const interval = setInterval(() => {
      setMarketStale(Date.now() - Date.parse(market.updatedAt!) > 5 * 60_000);
    }, 30_000);
    return () => clearInterval(interval);
  }, [market?.updatedAt]);

  useEffect(() => {
    const key = storageKey(session?.user.id ?? null);
    if (!hydrated || loadedKey.current !== key) return;

    const persist = async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(appState));
      } catch (error) {
        setCloudStatus('error');
        setCloudMessage(error instanceof Error ? `Could not save device data: ${error.message}` : 'Could not save device data.');
        return;
      }
      if (!session?.user.id || !supabase) return;
      const client = supabase;

      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(async () => {
        setCloudStatus('syncing');
        const { error } = await client.rpc('merge_trade_nova_state', { state_patch: appState });
        if (error) {
          setCloudStatus('error');
          setCloudMessage(`Cloud sync failed: ${error.message}`);
        } else {
          setCloudStatus('synced');
          setCloudMessage(null);
        }
      }, 700);
    };

    void persist();
  }, [appState, hydrated, session]);

  useEffect(() => () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Add Supabase URL and anon key to enable account sign-in.';
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setAuthError(error.message);
      return error.message;
    }
    setAuthError(null);
    return 'Signed in successfully.';
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Add Supabase URL and anon key to enable account sign-in.';
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      setAuthError(error.message);
      return error.message;
    }
    setAuthError(null);
    return 'Account created. Check your email if confirmation is enabled in Supabase.';
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
  }, []);

  const activeWatchlist = appState.paperTrading.watchlists.find((list) => list.id === appState.paperTrading.activeWatchlistId)
    ?? appState.paperTrading.watchlists[0];
  const prices = useMemo(() => currentPrices(market), [market]);
  const summary = useMemo(() => derivePortfolio(appState.paperTrading, prices), [appState.paperTrading, prices]);

  const toggleSymbol = useCallback((symbol: string, watchlistId = appState.paperTrading.activeWatchlistId) => {
    if (!currentInstrument(symbol, market)) return;
    setAppState((current) => ({
      ...current,
      paperTrading: {
        ...current.paperTrading,
        watchlists: current.paperTrading.watchlists.map((list) => list.id !== watchlistId ? list : {
          ...list,
          symbols: list.symbols.includes(symbol)
            ? list.symbols.filter((item) => item !== symbol)
            : [...list.symbols, symbol],
        }),
      },
    }));
  }, [appState.paperTrading.activeWatchlistId, market]);

  const createWatchlist = useCallback((name: string) => {
    const cleanName = name.trim().slice(0, 32);
    if (!cleanName) return 'Enter a name for the watchlist.';
    if (appState.paperTrading.watchlists.some((list) => list.name.toLowerCase() === cleanName.toLowerCase())) {
      return 'A watchlist with that name already exists.';
    }
    const id = createOrderId();
    setAppState((current) => ({
      ...current,
      paperTrading: {
        ...current.paperTrading,
        watchlists: [...current.paperTrading.watchlists, { id, name: cleanName, symbols: [] }],
        activeWatchlistId: id,
      },
    }));
    return null;
  }, [appState.paperTrading.watchlists]);

  const selectWatchlist = useCallback((id: string) => {
    setAppState((current) => current.paperTrading.watchlists.some((list) => list.id === id)
      ? { ...current, paperTrading: { ...current.paperTrading, activeWatchlistId: id } }
      : current);
  }, []);

  const deleteWatchlist = useCallback((id: string) => {
    const lists = appState.paperTrading.watchlists;
    if (lists.length <= 1) return 'Keep at least one watchlist in your practice account.';
    const nextLists = lists.filter((list) => list.id !== id);
    setAppState((current) => ({
      ...current,
      paperTrading: {
        ...current.paperTrading,
        watchlists: nextLists,
        activeWatchlistId: current.paperTrading.activeWatchlistId === id ? nextLists[0].id : current.paperTrading.activeWatchlistId,
      },
    }));
    return null;
  }, [appState.paperTrading.watchlists]);

  const placeOrder = useCallback((input: NewOrder) => {
    const instrument = currentInstrument(input.symbol, market);
    if (!instrument || instrument.exchange !== 'NSE') return { ok: false, message: 'Choose an available NSE practice instrument.' };
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) return { ok: false, message: 'Enter a whole-share quantity greater than zero.' };
    const referencePricePaise = prices[input.symbol] ?? input.referencePricePaise ?? instrument.pricePaise;
    if (!Number.isSafeInteger(referencePricePaise) || referencePricePaise <= 0) return { ok: false, message: 'The current practice quote is invalid.' };
    if (input.orderType === 'limit' && (!input.limitPricePaise || input.limitPricePaise <= 0)) return { ok: false, message: 'Enter a valid limit price.' };

    const order: PaperOrder = {
      id: createOrderId(),
      symbol: input.symbol,
      side: input.side,
      orderType: input.orderType,
      quantity: input.quantity,
      status: 'pending',
      pricePaise: input.limitPricePaise ?? referencePricePaise,
      limitPricePaise: input.orderType === 'limit' ? input.limitPricePaise : undefined,
      stopLossPaise: input.stopLossPaise,
      targetPricePaise: input.targetPricePaise,
      feesPaise: 0,
      createdAt: new Date().toISOString(),
    };
    const state = appState.paperTrading;
    if (!isMarketable(input, referencePricePaise)) {
      setAppState((current) => ({ ...current, paperTrading: { ...current.paperTrading, orders: [order, ...current.paperTrading.orders] } }));
      return { ok: true, message: 'Limit order added to pending practice orders.', order };
    }

    const notional = referencePricePaise * input.quantity;
    const fees = calculateFees(notional);
    const portfolio = derivePortfolio(state, prices);
    if (input.side === 'buy' && state.cashPaise < notional + fees) {
      return { ok: false, message: 'Not enough virtual cash for this order, including estimated fees.' };
    }
    if (input.side === 'sell') {
      const holding = portfolio.holdings.find((item) => item.symbol === input.symbol);
      if (!holding || holding.quantity < input.quantity) return { ok: false, message: `Not enough ${input.symbol} shares in the practice account.` };
    }
    const filledOrder: PaperOrder = { ...order, status: 'filled', pricePaise: referencePricePaise, feesPaise: fees };
    const cashPaise = state.cashPaise + (input.side === 'buy' ? -notional - fees : notional - fees);
    const nextState: PaperTradingState = {
      ...state,
      cashPaise,
      orders: [filledOrder, ...state.orders],
    };
    const nextSummary = derivePortfolio(nextState, prices);
    nextState.equitySnapshots = [...state.equitySnapshots, { at: filledOrder.createdAt, valuePaise: nextSummary.totalValuePaise }];
    setAppState((current) => ({ ...current, paperTrading: nextState }));
    return { ok: true, message: 'Practice order filled. No real-money trade was placed.', order: filledOrder };
  }, [appState.paperTrading, market, prices]);

  const cancelOrder = useCallback((orderId: string) => {
    const order = appState.paperTrading.orders.find((item) => item.id === orderId && item.status === 'pending');
    if (!order) return false;
    setAppState((current) => ({
      ...current,
      paperTrading: {
        ...current.paperTrading,
        orders: current.paperTrading.orders.map((item) => item.id === orderId ? { ...item, status: 'cancelled' } : item),
      },
    }));
    return true;
  }, [appState.paperTrading.orders]);

  const fillLimitOrder = useCallback((orderId: string) => {
    const state = appState.paperTrading;
    const order = state.orders.find((item) => item.id === orderId && item.status === 'pending');
    if (!order) return { ok: false, message: 'That pending order is no longer available.' };
    const fillPricePaise = order.limitPricePaise ?? order.pricePaise;
    const notional = fillPricePaise * order.quantity;
    const fees = calculateFees(notional);
    if (order.side === 'buy' && state.cashPaise < notional + fees) {
      return { ok: false, message: 'Not enough virtual cash to fill this limit order, including fees.' };
    }
    if (order.side === 'sell') {
      const holding = derivePortfolio(state, prices).holdings.find((item) => item.symbol === order.symbol);
      if (!holding || holding.quantity < order.quantity) {
        return { ok: false, message: `Not enough ${order.symbol} shares to fill this limit order.` };
      }
    }
    const filledOrder = { ...order, status: 'filled' as const, pricePaise: fillPricePaise, feesPaise: fees };
    const cashPaise = state.cashPaise + (order.side === 'buy' ? -notional - fees : notional - fees);
    const nextState: PaperTradingState = {
      ...state,
      cashPaise,
      orders: state.orders.map((item) => item.id === orderId ? filledOrder : item),
    };
    const totalValuePaise = derivePortfolio(nextState, prices).totalValuePaise;
    nextState.equitySnapshots = [...state.equitySnapshots, { at: filledOrder.createdAt, valuePaise: totalValuePaise }];
    setAppState((current) => ({ ...current, paperTrading: nextState }));
    return { ok: true, message: 'Limit order filled at its limit price in simulation. No real-money trade was placed.' };
  }, [appState.paperTrading, prices]);

  const markLessonComplete = useCallback((lessonId: string) => {
    setAppState((current) => current.learningProgress.includes(lessonId)
      ? current
      : { ...current, learningProgress: [...current.learningProgress, lessonId] });
  }, []);

  const addJournalEntry = useCallback((symbol: string, note: string) => {
    const trimmed = note.trim();
    if (!trimmed) return 'Write a short note before saving the review.';
    const entry: JournalEntry = { id: createOrderId(), symbol: symbol.trim().toUpperCase() || 'MARKET', note: trimmed.slice(0, 500), createdAt: new Date().toISOString() };
    setAppState((current) => ({ ...current, journalEntries: [entry, ...current.journalEntries] }));
    return null;
  }, []);

  const setDisplayName = useCallback((displayName: string) => {
    setAppState((current) => ({ ...current, settings: { ...current.settings, displayName: displayName.slice(0, 40) } }));
  }, []);

  const setNotifications = useCallback((enabled: boolean, pushToken: string | null = null) => {
    setAppState((current) => ({
      ...current,
      settings: { ...current.settings, notificationsEnabled: enabled, expoPushToken: pushToken },
    }));
  }, []);

  const value = useMemo<MobileAppContextValue>(() => ({
    appState,
    paperState: appState.paperTrading,
    summary,
    activeWatchlist,
    market,
    marketStale,
    marketLoading,
    marketError,
    refreshMarket,
    hydrated,
    session,
    authConfigured: supabaseConfigured,
    authError,
    cloudStatus,
    cloudMessage,
    signIn,
    signUp,
    signOut,
    toggleSymbol,
    createWatchlist,
    selectWatchlist,
    deleteWatchlist,
    placeOrder,
    fillLimitOrder,
    cancelOrder,
    markLessonComplete,
    addJournalEntry,
    setDisplayName,
    setNotifications,
  }), [
    appState, summary, activeWatchlist, market, marketStale, marketLoading, marketError, refreshMarket, hydrated,
    session, authError, cloudStatus, cloudMessage, signIn, signUp, signOut, toggleSymbol,
    createWatchlist, selectWatchlist, deleteWatchlist, placeOrder, fillLimitOrder, cancelOrder, markLessonComplete,
    addJournalEntry, setDisplayName, setNotifications,
  ]);

  return <MobileAppContext.Provider value={value}>{children}</MobileAppContext.Provider>;
}

export function useMobileApp() {
  const context = useContext(MobileAppContext);
  if (!context) throw new Error('useMobileApp must be used inside MobileAppProvider.');
  return context;
}

export function showMessage(title: string, message: string) {
  Alert.alert(title, message);
}
