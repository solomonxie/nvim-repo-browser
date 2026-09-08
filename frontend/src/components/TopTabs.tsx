// T6.4: GitHub's Code/Issues/Pull requests tabs, made local: Code /
// Commits / Branches.

import type { Route } from '../lib/router';

const TABS: { page: Route['page']; label: string }[] = [
  { page: 'code', label: 'Code' },
  { page: 'commits', label: 'Commits' },
  { page: 'branches', label: 'Branches' },
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
          {t.label}
        </button>
      ))}
    </nav>
  );
}
