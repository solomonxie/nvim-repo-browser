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

type ContentState =
  | { kind: 'loading' }
  | { kind: 'dir'; listing: DirListing; readme: FileContent | null }
  | { kind: 'file'; file: FileContent }
  | { kind: 'error'; message: string };

function findReadme(entries: DirEntry[]): DirEntry | undefined {
  return entries.find((e) => e.type === 'file' && /^readme\.md$/i.test(e.name));
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
    if (state.readme && state.readme.content && state.readme.content.trim() !== '') {
      return (
        <div className="content-pane">
          <MarkdownView content={state.readme.content ?? ''} />
        </div>
      );
    }
    return (
      <div className="content-pane">
        <ul className="dir-listing">
          {state.listing.entries.map((e) => (
            <li key={e.path}>
              <a onClick={() => onNavigate(e.path)}>{e.type === 'dir' ? `${e.name}/` : e.name}</a>
            </li>
          ))}
        </ul>
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
        <MarkdownView content={file.content ?? ''} />
      </div>
    );
  }
  return (
    <div className="content-pane">
      <CodeView path={file.path} ext={file.ext} content={file.content ?? ''} />
    </div>
  );
}
