"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { usePaperTrading } from "@/components/trading/paper-trading-provider";
import { mergeAccountState, readAccountState } from "@/lib/supabase";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { PageHeader, Panel, Tag } from "@/components/workspace/page-frame";

interface NotificationPreferences {
  orderFills: boolean;
  watchlistChanges: boolean;
  learningReminders: boolean;
}

const notificationKey = "trade-nova-notification-preferences-v1";
const defaultNotifications: NotificationPreferences = { orderFills: true, watchlistChanges: false, learningReminders: true };

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isTheme(value: unknown): value is "charcoal" | "oled" {
  return value === "charcoal" || value === "oled";
}

function isNotificationPreferences(value: unknown): value is NotificationPreferences {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NotificationPreferences>;
  return typeof candidate.orderFills === "boolean" && typeof candidate.watchlistChanges === "boolean" && typeof candidate.learningReminders === "boolean";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export default function SettingsWorkspace() {
  const { authConfigured, cloudMessage, cloudStatus, persistenceWarning, resetPaperAccount, session, signIn, signOut, signUp } = usePaperTrading();
  const [displayName, setDisplayName] = useLocalStorageState("trade-nova-profile-name", "Student", isString);
  const [savedMessage, setSavedMessage] = useState("");
  const [theme, setTheme] = useLocalStorageState("trade-nova-theme", "charcoal", isTheme);
  const [notifications, setNotifications] = useLocalStorageState(notificationKey, defaultNotifications, isNotificationPreferences);
  const [learningProgress, setLearningProgress] = useLocalStorageState("trade-nova-learning-progress-v1", [] as string[], isStringArray);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [accountSettings, setAccountSettings] = useState<Record<string, unknown>>({});
  const sessionUserId = session?.user.id;

  useEffect(() => {
    if (!sessionUserId) return;
    let active = true;
    void readAccountState().then((result) => {
      if (!active) return;
      if (!result.ok || !result.payload || typeof result.payload !== "object") {
        if (!result.ok) setSavedMessage(`Account data could not be loaded: ${result.message}`);
        return;
      }
      const payload = result.payload as { settings?: unknown; learningProgress?: unknown };
      if (payload.settings && typeof payload.settings === "object") {
        const remote = payload.settings as Record<string, unknown>;
        setAccountSettings(remote);
        if (typeof remote.displayName === "string" && remote.displayName.trim()) setDisplayName(remote.displayName);
        if (isTheme(remote.theme)) setTheme(remote.theme);
        if (isNotificationPreferences(remote.notifications)) setNotifications(remote.notifications);
      }
      if (isStringArray(payload.learningProgress)) setLearningProgress(payload.learningProgress);
    }).catch((error: unknown) => {
      if (active) setSavedMessage(`Account data could not be loaded: ${error instanceof Error ? error.message : "unknown error"}`);
    });
    return () => { active = false; };
  }, [sessionUserId, setDisplayName, setLearningProgress, setNotifications, setTheme]);

  const syncSettings = (patch: Record<string, unknown>) => {
    if (!session) return;
    const next = { ...accountSettings, ...patch };
    setAccountSettings(next);
    void mergeAccountState({ settings: next }).then((result) => {
      setSavedMessage(result.ok ? "Account preferences synced." : `Preference sync failed: ${result.message}`);
    }).catch((error: unknown) => {
      setSavedMessage(`Preference sync failed: ${error instanceof Error ? error.message : "unknown error"}`);
    });
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = displayName.trim().slice(0, 40);
    if (!nextName) {
      setSavedMessage("Display name cannot be empty.");
      return;
    }
    const persisted = setDisplayName(nextName);
    setSavedMessage(persisted ? session ? "Profile preferences saved." : "Profile preferences saved in this browser." : "Profile updated for this session, but browser storage is unavailable.");
    syncSettings({ displayName: nextName });
  };

  const changeTheme = (nextTheme: "charcoal" | "oled") => {
    const persisted = setTheme(nextTheme);
    setSavedMessage(persisted ? `${nextTheme === "oled" ? "OLED" : "Charcoal"} theme selected.` : "Theme changed for this session, but browser storage is unavailable.");
    syncSettings({ theme: nextTheme });
  };

  const toggleNotification = (key: keyof NotificationPreferences) => {
    const next = { ...notifications, [key]: !notifications[key] };
    const persisted = setNotifications(next);
    syncSettings({ notifications: next, notificationsEnabled: next.orderFills });
    if (!persisted) setSavedMessage("Preference changed for this session only; browser storage is unavailable.");
  };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authEmail.trim() || authPassword.length < 6) {
      setSavedMessage("Enter an email address and a password with at least six characters.");
      return;
    }
    const message = authMode === "sign-in" ? await signIn(authEmail, authPassword) : await signUp(authEmail, authPassword);
    setSavedMessage(message);
  };

  const resetWorkspace = () => {
    if (!window.confirm(`Reset the ${session ? "synced" : "local"} paper account, orders and watchlists? This cannot be undone.`)) return;
    resetPaperAccount();
    setSavedMessage(`Paper account and watchlists reset${session ? " and synced" : " locally"}.`);
  };

  return (
    <main className="workspace-content settings-workspace">
      <PageHeader eyebrow="WORKSPACE CONTROL" title="Settings" description="Manage your profile, account sync, preferences, notifications and demo data status." actions={<Tag>{session ? "ACCOUNT SYNC" : "LOCAL DEMO"}</Tag>} />
      {savedMessage && <div className="inline-feedback settings-feedback" role="status">{savedMessage}<button type="button" aria-label="Dismiss message" onClick={() => setSavedMessage("")}><Icon name="close" size={13} /></button></div>}
      {persistenceWarning && <div className="settings-storage-warning"><Icon name="risk" size={14} />{persistenceWarning}</div>}
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections"><a className="settings-nav-active" href="#profile">Profile</a><a href="#preferences">Preferences</a><a href="#data">Market data</a><a href="#about">About</a></nav>
        <div className="settings-sections">
          <Panel title="Shared account" description="Use the same Supabase project on web and mobile to synchronize paper trades, watchlists, learning progress and preferences.">
            {!authConfigured ? <div className="settings-storage-warning"><Icon name="risk" size={14} />Supabase is not configured. This site continues to use browser-local demo storage.</div> : session ? <div className="settings-account-row"><div><strong>{session.user.email}</strong><small>{cloudStatus === "synced" ? "Account connected" : cloudStatus === "syncing" ? "Syncing account data…" : cloudStatus === "error" ? cloudMessage : "Signed in"}</small></div><button type="button" className="secondary-button" onClick={async () => setSavedMessage(await signOut())}>Sign out</button></div> : <form className="settings-auth-form" onSubmit={(event) => void handleAuth(event)}><label><span>EMAIL</span><input type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required /></label><label><span>PASSWORD</span><input type="password" autoComplete={authMode === "sign-in" ? "current-password" : "new-password"} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} minLength={6} required /></label><button className="primary-button" type="submit">{authMode === "sign-in" ? "Sign in" : "Create account"}</button><button type="button" className="text-button" onClick={() => setAuthMode((mode) => mode === "sign-in" ? "sign-up" : "sign-in")}>{authMode === "sign-in" ? "Create a new account" : "Already have an account? Sign in"}</button></form>}
            {session && cloudMessage && cloudStatus !== "synced" && <div className="settings-storage-warning"><Icon name="risk" size={14} />{cloudMessage}</div>}
            {session && <p className="settings-sync-note">{learningProgress.length} learning lessons are saved on this browser and account. Existing anonymous data is not automatically migrated.</p>}
          </Panel>
          <Panel title="Profile preferences" description={session ? "Profile details sync to your Trade Nova account." : "These details stay in this browser until an account is configured."}>
            <form className="settings-profile-form" id="profile" onSubmit={saveProfile}><div className="settings-profile-avatar"><Icon name="user" size={24} /></div><label><span>DISPLAY NAME</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value.slice(0, 40))} maxLength={40} /><small>{session ? "Saved to this account and browser." : "Stored only in this browser."}</small></label><button className="primary-button" type="submit">Confirm profile</button></form>
          </Panel>
          <Panel title="Theme preference" description="Choose a dark workspace palette; both themes preserve contrast for financial values.">
            <div className="theme-option-grid" id="preferences"><button type="button" className={`theme-option${theme === "charcoal" ? " theme-option-active" : ""}`} onClick={() => changeTheme("charcoal")}><span className="theme-preview theme-charcoal" /><span><strong>Charcoal</strong><small>Current Trade Nova default</small></span>{theme === "charcoal" && <Icon name="check" size={15} />}</button><button type="button" className={`theme-option${theme === "oled" ? " theme-option-active" : ""}`} onClick={() => changeTheme("oled")}><span className="theme-preview theme-oled" /><span><strong>OLED</strong><small>Near-black surfaces</small></span>{theme === "oled" && <Icon name="check" size={15} />}</button></div>
          </Panel>
          <Panel title="Notifications" description={session ? "Preferences sync to your account. Browser push notifications are not configured." : "Preferences are stored locally. Browser push notifications are not configured."}>
            <div className="settings-preferences">{([["orderFills", "Paper order updates", "Show in-app feedback after a simulated order."], ["watchlistChanges", "Watchlist changes", "Confirm when a symbol is added or removed."], ["learningReminders", "Learning progress", "Keep local lesson completion reminders visible."]] as const).map(([key, title, detail]) => <label className="settings-row settings-toggle-row" key={key}><span><strong>{title}</strong><small>{detail}</small></span><input type="checkbox" checked={notifications[key]} onChange={() => toggleNotification(key)} /><i aria-hidden="true"><b /></i></label>)}</div>
          </Panel>
          <Panel title="Market data source" description="Provider adapter is replaceable; no credentials or provider subscription are configured.">
            <div className="provider-status-card" id="data"><div className="provider-status-icon"><Icon name="markets" size={18} /></div><div><span className="section-kicker">ACTIVE MODE</span><strong>Local simulated sample data</strong><p>Generated instrument references and candles · not live, delayed, or historical data.</p></div><span className="provider-offline-pill"><i /> NO LICENSED FEED</span></div><div className="provider-notes"><span><Icon name="check" size={13} /> API keys are not stored in the browser</span><span><Icon name="risk" size={13} /> No display license has been approved</span><span><Icon name="external" size={13} /> Historical data replay is simulated</span></div>
          </Panel>
          <Panel title="Application information" description="TRADE NOVA · Think Smarter. Trade Wiser.">
            <div className="settings-about-grid" id="about"><div><span>APP VERSION</span><strong>0.1.0 · educational demo</strong></div><div><span>ACCOUNT STORAGE</span><strong>{session ? "Supabase + browser cache" : "Local browser storage"}</strong></div><div><span>ORDER EXECUTION</span><strong>Virtual only · no broker</strong></div><div><span>DATABASE / AUTH</span><strong>{authConfigured ? "Supabase configured" : "Not configured"}</strong></div></div>            <div className="settings-reset-row"><div><strong>Reset paper workspace</strong><small>Clears paper trades and restores the virtual starting balance and starter list{session ? " on this account" : " in this browser"}.</small></div><button type="button" className="danger-outline-button" onClick={resetWorkspace}><Icon name="refresh" size={14} /> Reset paper account</button></div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
