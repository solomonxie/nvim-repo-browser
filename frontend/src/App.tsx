// T3.6: layout shell -- sidebar (FileTree) + breadcrumb + content pane,
// wired to the hash router.

import { useHashPath } from './lib/router';
import { FileTree } from './components/FileTree';
import { Breadcrumb } from './components/Breadcrumb';
import { ContentPane } from './components/ContentPane';

export function App() {
  const [path, setPath] = useHashPath();

  return (
    <div className="app">
      <aside className="sidebar">
        <FileTree selectedPath={path} onSelect={setPath} />
      </aside>
      <main className="main">
        <Breadcrumb path={path} onNavigate={setPath} />
        <ContentPane path={path} onNavigate={setPath} />
      </main>
    </div>
  );
}
