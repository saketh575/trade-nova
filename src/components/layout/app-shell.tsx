"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { PaperTradingProvider } from "@/components/trading/paper-trading-provider";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { demoIndices } from "@/lib/market-data";
import { navigationSections } from "@/lib/navigation";

const pageTitles: Record<string, string> = Object.fromEntries(
  navigationSections.flatMap((section) => section.items.map((item) => [item.href, item.label])),
);

function isTheme(value: unknown): value is "charcoal" | "oled" {
  return value === "charcoal" || value === "oled";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useLocalStorageState("trade-nova-theme", "charcoal", isTheme);
  const [profileName] = useLocalStorageState("trade-nova-profile-name", "Student", isString);
  const title = pageTitles[pathname] ?? "Overview";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <PaperTradingProvider>
    <div className="app-shell">
      {mobileNavOpen && (
        <button
          aria-label="Close navigation"
          className="mobile-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className={`sidebar${mobileNavOpen ? " sidebar-open" : ""}`}>
        <Link className="brand" href="/overview" onClick={() => setMobileNavOpen(false)}>
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M4 23.5 11.1 8l5.1 10.2 4.2-7.1L28 23.5h-7.2l-4.6-7.1-3.1 7.1H4Z" fill="currentColor" />
              <path d="M22.4 8.5h5.1v5.1" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          <span className="brand-wordmark">TRADE<span>NOVA</span></span>
        </Link>

        <div className="workspace-switcher">
          <div className="workspace-avatar">TN</div>
          <div className="workspace-copy"><span>Workspace</span><strong>College project</strong></div>
          <Icon name="chevron" size={15} className="workspace-chevron" />
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {navigationSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <p className="nav-caption">{section.label}</p>
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    className={`nav-item${active ? " nav-item-active" : ""}`}
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                    {item.badge && <span className="nav-new">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon"><Icon name="spark" size={17} /></div>
            <div><strong>Think Smarter.</strong><p>Learn, practise, and review.</p></div>
            <Icon name="chevron" size={14} className="help-chevron" />
          </div>
          <Link className="profile-card" href="/settings" onClick={() => setMobileNavOpen(false)}>
            <div className="profile-avatar">TN</div>
            <div className="profile-copy"><strong>{profileName} workspace</strong><span>Educational demo</span></div>
            <Icon name="more" size={18} />
          </Link>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu-button"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <Icon name={mobileNavOpen ? "close" : "menu"} size={20} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span><Icon name="chevron" size={13} /><strong>{title}</strong>
          </div>
          <form className="global-search" action="/markets">
            <Icon name="search" size={17} />
            <input aria-label="Search instruments" name="q" placeholder="Search instruments..." />
            <kbd>↵</kbd>
          </form>
          <div className="topbar-actions">
            <span className="mode-pill"><span /> DEMO MODE</span>
            <button
              className="icon-button theme-toggle"
              type="button"
              aria-label={theme === "charcoal" ? "Switch to OLED theme" : "Switch to charcoal theme"}
              title={theme === "charcoal" ? "Switch to OLED theme" : "Switch to charcoal theme"}
              onClick={() => setTheme(theme === "charcoal" ? "oled" : "charcoal")}
            >
              <Icon name={theme === "charcoal" ? "moon" : "sun"} size={17} />
            </button>
            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Icon name="bell" size={19} />
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <div className="popover-heading"><strong>Updates</strong><span>Demo</span></div>
                  <p><b>Market data</b><br />No licensed market-data provider is connected.</p>
                  <p><b>Paper trading</b><br />No real-money orders are placed by Trade Nova.</p>
                </div>
              )}
            </div>
            <div className="profile-menu-wrap">
              <button className="top-profile" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen(!profileOpen)}>
                <div className="profile-avatar">TN</div>
                <div><strong>{profileName}</strong><span>Educational demo</span></div>
                <Icon name="chevron" size={14} />
              </button>
              {profileOpen && <div className="profile-popover"><strong>{profileName} workspace</strong><span>Local browser demo account</span><Link href="/portfolio" onClick={() => setProfileOpen(false)}>Paper portfolio</Link><Link href="/settings" onClick={() => setProfileOpen(false)}>Preferences and data</Link><button type="button" onClick={() => setProfileOpen(false)}>Close menu</button></div>}
            </div>
          </div>
        </header>
        <div className="ticker-bar">
          <span className="ticker-status"><i /> DEMO TICKER</span>
          {demoIndices.slice(0, 3).map((index) => <span className="ticker-index" key={index.symbol}><b>{index.name}</b><strong>{index.displayValue}</strong><em className={index.changePct >= 0 ? "positive" : "negative"}>{index.changePct > 0 ? "+" : ""}{index.changePct.toFixed(2)}%</em></span>)}
          <span className="ticker-disclaimer">Illustrative · not live</span>
        </div>
        {children}
      </div>
    </div>
    </PaperTradingProvider>
  );
}
