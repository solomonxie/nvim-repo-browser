// T6.4/T6.5: GitHub's Code/Issues/Pull requests tabs, made local: Code /
// Commits / Insights.

import type { ReactNode } from 'react';
import type { Route } from '../lib/router';
import { CodeIcon, CommitIcon, InsightsIcon } from './icons';

const TABS: { page: Route['page']; label: string; icon: ReactNode }[] = [
  { page: 'code', label: 'Code', icon: <CodeIcon /> },
  { page: 'commits', label: 'Commits', icon: <CommitIcon /> },
  { page: 'insights', label: 'Insights', icon: <InsightsIcon /> },
];

interface TopTabsProps {
  page: Route['page'];
  onSelect: (page: Route['page']) => void;
}

export function TopTabs({ page, onSelect }: TopTabsProps) {
  return (
    <nav className="top-tabs">
      {TABS.map((t) => (
        <button key={t.page} className={`top-tab${page === t.page ? ' active' : ''}`} onClick={() => onSelect(t.page)}>
          {t.icon}
          {t.label}
        </button>
      ))}
    </nav>
  );
}
