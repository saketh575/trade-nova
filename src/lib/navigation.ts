import type { IconName } from "@/components/ui/icon";

export const navigationSections: {
  label: string;
  items: { label: string; href: string; icon: IconName; badge?: string }[];
}[] = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Overview", href: "/overview", icon: "overview" },
      { label: "Markets", href: "/markets", icon: "markets" },
      { label: "Watchlist", href: "/watchlist", icon: "watchlist" },
      { label: "Portfolio", href: "/portfolio", icon: "portfolio" },
      { label: "Paper Trading", href: "/paper-trading", icon: "paper" },
    ],
  },
  {
    label: "YOUR EDGE",
    items: [
      { label: "NEON Intelligence", href: "/neon-intelligence", icon: "intelligence", badge: "NEW" },
      { label: "Market Replay Lab", href: "/market-replay", icon: "replay" },
      { label: "Risk Simulator", href: "/risk-simulator", icon: "risk" },
      { label: "Learning Centre", href: "/learning", icon: "learning" },
    ],
  },
  {
    label: "PREFERENCES",
    items: [{ label: "Settings", href: "/settings", icon: "settings" }],
  },
];
