import type { ReactNode } from "react";

export type IconName =
  | "overview"
  | "markets"
  | "watchlist"
  | "portfolio"
  | "paper"
  | "intelligence"
  | "replay"
  | "risk"
  | "learning"
  | "settings"
  | "search"
  | "bell"
  | "chevron"
  | "arrow-up"
  | "arrow-down"
  | "plus"
  | "minus"
  | "more"
  | "menu"
  | "close"
  | "external"
  | "calendar"
  | "spark"
  | "moon"
  | "sun"
  | "chevron-down"
  | "check"
  | "filter"
  | "refresh"
  | "trash"
  | "play"
  | "pause"
  | "rotate"
  | "user";

const iconContent: Record<IconName, ReactNode> = {
  overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="4" rx="1.5" /><rect x="13.5" y="10.5" width="7" height="10" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  markets: <><path d="M3 19.5h18" /><path d="m5 15 4-4 3 2 6-7" /><path d="M15 6h3v3" /></>,
  watchlist: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></>,
  portfolio: <><path d="M4 19.5h16" /><path d="M6 16V9m6 7V5m6 11v-4" /></>,
  paper: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12h8m-8 4h5M8 8h3" /></>,
  intelligence: <><path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64" /><circle cx="12" cy="12" r="4" /></>,
  replay: <><path d="M4 11a8 8 0 1 1 2.3 5.7" /><path d="M4 5v6h6" /><path d="m12 8 3 4-3 4" /></>,
  risk: <><path d="M12 3 21 19H3L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  learning: <><path d="m3 8 9-5 9 5-9 5-9-5Z" /><path d="M7 10.5v5c3.1 2.5 6.9 2.5 10 0v-5M21 8v6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1) scale(.92)" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  "arrow-up": <><path d="M12 19V5m-6 6 6-6 6 6" /></>,
  "arrow-down": <><path d="M12 5v14m6-6-6 6-6-6" /></>,
  plus: <><path d="M12 5v14m-7-7h14" /></>,
  minus: <path d="M5 12h14" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  external: <><path d="M14 4h6v6m-11 5L20 4" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M7.5 3v4m9-4v4M3.5 10h17" /></>,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
  moon: <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  filter: <><path d="M4 6h16M7 12h10m-7 6h4" /><circle cx="9" cy="6" r="1.5" fill="currentColor" /><circle cx="15" cy="12" r="1.5" fill="currentColor" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 12-2L20 12m-16 0 2.5 5a7 7 0 0 0 12-2" /></>,
  trash: <><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
  play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
  pause: <><path d="M8 5h3v14H8zM15 5h3v14h-3z" fill="currentColor" stroke="none" /></>,
  rotate: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
};

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconContent[name]}
    </svg>
  );
}
