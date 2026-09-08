// T3.5: dir -> its README or a flat child listing; file -> image/markdown/
// code/unsupported branches. Whether `path` is a file or a directory is
// resolved live: /api/file 404s on a directory (the server's readFileSync
// hits EISDIR), so a single harmless extra round-trip tells us which one
// we're looking at without the router needing to track entry types itself.

import { useEffect, useState } from 'react';
import type { DirEntry, DirListing, FileContent } from '../../../shared/types';
import { fetchFile, fetchTree, isImageExt, rawUrl } from '../lib/api';
import { MarkdownView } from './MarkdownView';
import { CodeView } from './CodeView';
import { FileBox } from './FileBox';
import { ChevronIcon } from './icons';

type ContentState =
  | { kind: 'loading' }
  | { kind: 'dir'; listing: DirListing; readme: FileContent | null }
  | { kind: 'file'; file: FileContent }
  | { kind: 'error'; message: string };

function findReadme(entries: DirEntry[]): DirEntry | undefined {
  return entries.find((e) => e.type === 'file' && /^readme\.md$/i.test(e.name));
}

// GitHub-style boxed directory listing -- Name only, no per-file commit
// info (nothing in DirEntry carries it, and a git-log-per-file round trip
// isn't worth it here).
function DirBox({ path, entries, onNavigate }: { path: string; entries: DirEntry[]; onNavigate: (path: string) => void }) {
  const [collapsed, setCollapsed] = useState(true);
  const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
  return (
    <div className="file-box dir-box">
      <div
        className={`file-box-header file-box-header--plain dir-box-toggle${collapsed ? '' : ' dir-box-toggle--open'}`}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="tree-chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
        {entries.length} {entries.length === 1 ? 'item' : 'items'}
      </div>
      {!collapsed && (
        <div className="dir-box-body">
          {path !== '' && (
            <div className="dir-box-row" onClick={() => onNavigate(parent)}>
              <span className="tree-icon" aria-hidden="true">📁</span>
              <span className="dir-box-name">..</span>
            </div>
          )}
          {entries.map((e) => (
            <div key={e.path} className="dir-box-row" onClick={() => onNavigate(e.path)}>
              <span className="tree-icon" aria-hidden="true">{e.type === 'dir' ? '📁' : '📄'}</span>
              <span className="dir-box-name">{e.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ContentPaneProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function ContentPane({ path, onNavigate }: ContentPaneProps) {
  const [state, setState] = useState<ContentState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });

    (async () => {
      try {
        const file = await fetchFile(path).catch(() => null);
        if (cancelled) return;
        if (file) {
          setState({ kind: 'file', file });
          return;
        }
        const listing = await fetchTree(path);
        if (cancelled) return;
        const readmeEntry = findReadme(listing.entries);
        const readme = readmeEntry ? await fetchFile(readmeEntry.path) : null;
        if (cancelled) return;
        setState({ kind: 'dir', listing, readme });
      } catch (err) {
        if (!cancelled) setState({ kind: 'error', message: String(err) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (state.kind === 'loading') return <div className="content-pane">Loading…</div>;
  if (state.kind === 'error') return <div className="content-pane error">{state.message}</div>;

  if (state.kind === 'dir') {
    const hasReadme = state.readme && state.readme.content && state.readme.content.trim() !== '';
    return (
      <div className="content-pane">
        <DirBox path={path} entries={state.listing.entries} onNavigate={onNavigate} />
        {hasReadme && (
          <div className="file-box">
            <div className="file-box-header file-box-header--plain">{state.readme!.path.split('/').pop()}</div>
            <div className="file-box-body">
              <MarkdownView path={state.readme!.path} content={state.readme!.content ?? ''} onNavigate={onNavigate} />
            </div>
          </div>
        )}
      </div>
    );
  }

  const { file } = state;
  if (isImageExt(file.ext)) {
    return (
      <div className="content-pane">
        <img src={rawUrl(file.path)} alt={file.path} />
      </div>
    );
  }
  if (file.tooLarge) {
    return <div className="content-pane placeholder">File too large to display ({file.size} bytes).</div>;
  }
  if (file.binary) {
    return <div className="content-pane placeholder">Binary file not shown.</div>;
  }
  if (file.ext === '.md') {
    return (
      <div className="content-pane">
        <FileBox path={file.path} showPreview>
          {(mode) =>
            mode === 'preview' ? (
              <MarkdownView path={file.path} content={file.content ?? ''} onNavigate={onNavigate} />
            ) : (
              <CodeView path={file.path} ext={file.ext} content={file.content ?? ''} />
            )
          }
        </FileBox>
      </div>
    );
  }
  return (
    <div className="content-pane">
      <FileBox path={file.path} showPreview={false}>
        {() => <CodeView path={file.path} ext={file.ext} content={file.content ?? ''} />}
      </FileBox>
    </div>
  );
}
