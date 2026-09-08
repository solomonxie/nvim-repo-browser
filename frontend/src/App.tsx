// T3.6 (extended for T6.4/T6.5): layout shell -- top tabs (Code/Commits/
// Insights) + a global theme toggle + per-page content, wired to the
// hash router.

import { useEffect, useState } from 'react';
import { useRoute } from './lib/router';
import { useTheme } from './lib/theme';
import { fetchMeta } from './lib/api';
import { TopTabs } from './components/TopTabs';
import { FileTree } from './components/FileTree';
import { Breadcrumb } from './components/Breadcrumb';
import { ContentPane } from './components/ContentPane';
import { CommitList } from './components/CommitList';
import { CommitDetail } from './components/CommitDetail';
import { Insights } from './components/Insights';

export function App() {
  const [route, navigate] = useRoute();
  const { theme, toggle } = useTheme();
  const [repoName, setRepoName] = useState('root');

  useEffect(() => {
    fetchMeta()
      .then((meta) => {
        document.title = meta.name;
        setRepoName(meta.name);
      })
      .catch(() => {
        // leave the static fallback title from index.html and "root"
      });
  }, []);

  return (
    <div className="app-shell">
      <div className="top-bar">
        <TopTabs
          page={route.page}
          onSelect={(page) => {
            if (page === 'code') navigate({ page: 'code', path: '' });
            else if (page === 'commits') navigate({ page: 'commits', sha: null });
            else navigate({ page: 'insights' });
          }}
        />
        <button className="theme-toggle" onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {route.page === 'code' && (
        <div className="app">
          <aside className="sidebar">
            <FileTree selectedPath={route.path} onSelect={(path) => navigate({ page: 'code', path })} />
          </aside>
          <main className="main">
            <Breadcrumb path={route.path} rootLabel={repoName} onNavigate={(path) => navigate({ page: 'code', path })} />
            <ContentPane path={route.path} onNavigate={(path) => navigate({ page: 'code', path })} />
          </main>
        </div>
      )}

      {route.page === 'commits' && (
        <main className="main main-full">
          {route.sha ? (
            <CommitDetail sha={route.sha} onBack={() => navigate({ page: 'commits', sha: null })} />
          ) : (
            <CommitList onSelect={(sha) => navigate({ page: 'commits', sha })} />
          )}
        </main>
      )}

      {route.page === 'insights' && (
        <main className="main main-full">
          <Insights />
        </main>
      )}
    </div>
  );
}
