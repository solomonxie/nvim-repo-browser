// T3.6 (extended for T6.4): layout shell -- top tabs (Code/Commits/
// Branches) + per-page content, wired to the hash router.

import { useRoute } from './lib/router';
import { TopTabs } from './components/TopTabs';
import { FileTree } from './components/FileTree';
import { Breadcrumb } from './components/Breadcrumb';
import { ContentPane } from './components/ContentPane';
import { CommitList } from './components/CommitList';
import { CommitDetail } from './components/CommitDetail';
import { BranchList } from './components/BranchList';

export function App() {
  const [route, navigate] = useRoute();

  return (
    <div className="app-shell">
      <TopTabs
        page={route.page}
        onSelect={(page) => {
          if (page === 'code') navigate({ page: 'code', path: '' });
          else if (page === 'commits') navigate({ page: 'commits', sha: null });
          else navigate({ page: 'branches' });
        }}
      />

      {route.page === 'code' && (
        <div className="app">
          <aside className="sidebar">
            <FileTree selectedPath={route.path} onSelect={(path) => navigate({ page: 'code', path })} />
          </aside>
          <main className="main">
            <Breadcrumb path={route.path} onNavigate={(path) => navigate({ page: 'code', path })} />
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

      {route.page === 'branches' && (
        <main className="main main-full">
          <BranchList />
        </main>
      )}
    </div>
  );
}
