import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="page-heading">
      <div>
        <div className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </section>
  );
}

export function PhaseNotice({ phase, children }: { phase: string; children: ReactNode }) {
  return (
    <div className="phase-notice">
      <span className="phase-notice-icon"><Icon name="spark" size={16} /></span>
      <span><strong>{phase}</strong><span className="banner-divider">/</span>{children}</span>
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`module-panel ${className}`}>
      <div className="module-panel-heading">
        <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="module-empty">
      <div className="module-empty-icon"><Icon name={icon} size={22} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {href && action && <Link className="text-button" href={href}>{action}<Icon name="chevron" size={14} /></Link>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: IconName;
}) {
  return (
    <article className="module-stat">
      <div className="module-stat-top"><span>{label}</span><Icon name={icon} size={17} /></div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="module-tag">{children}</span>;
}
