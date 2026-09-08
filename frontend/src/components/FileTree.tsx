// T3.3: recursive file tree via native <details>/<summary> (free
// expand/collapse), lazily fetching a directory's children on first
// expand rather than the whole tree upfront. Emoji icons (📁/📂/📄)
// instead of custom SVGs -- trivial to resize via font-size, no markup.

import { useEffect, useState } from 'react';
import type { DirEntry } from '../../../shared/types';
import { fetchTree } from '../lib/api';
import { ChevronIcon } from './icons';

interface TreeNodeProps {
  entry: DirEntry;
  selectedPath: string;
  onSelect: (path: string) => void;
}

function TreeNode({ entry, selectedPath, onSelect }: TreeNodeProps) {
  const [children, setChildren] = useState<DirEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (entry.type === 'file') {
    const selected = entry.path === selectedPath;
    return (
      <div className={`tree-row tree-file${selected ? ' selected' : ''}`} onClick={() => onSelect(entry.path)}>
        {/* empty chevron slot -- keeps this icon aligned under folder icons,
            which sit past their own chevron */}
        <span className="tree-chevron" aria-hidden="true" />
        <span className="tree-icon" aria-hidden="true">📄</span>
        <span className="tree-label">{entry.name}</span>
      </div>
    );
  }

  const isAncestorOfSelection = selectedPath === entry.path || selectedPath.startsWith(`${entry.path}/`);

  // Navigating to a path via something other than the tree itself (a
  // markdown link, the breadcrumb, browser back/forward) never fires
  // <details onToggle>, so without this the ancestor folders of the newly
  // selected file would stay collapsed and its row wouldn't even be in the
  // DOM yet (children are fetched lazily on open).
  useEffect(() => {
    if (isAncestorOfSelection && (!isOpen || children === null)) {
      setIsOpen(true);
      if (children === null) {
        setLoading(true);
        fetchTree(entry.path).then((listing) => {
          setChildren(listing.entries);
          setLoading(false);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath]);

  async function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    setIsOpen(e.currentTarget.open);
    if (e.currentTarget.open && children === null) {
      setLoading(true);
      const listing = await fetchTree(entry.path);
      setChildren(listing.entries);
      setLoading(false);
    }
  }

  return (
    <details open={isOpen} onToggle={handleToggle}>
      <summary className={`tree-row${entry.path === selectedPath ? ' selected' : ''}`} onClick={() => onSelect(entry.path)}>
        {/* replaces the native <details> marker; rotates via CSS on
            details[open] rather than swapping glyphs */}
        <span className="tree-chevron" aria-hidden="true"><ChevronIcon /></span>
        <span className="tree-icon" aria-hidden="true">{isOpen ? '📂' : '📁'}</span>
        <span className="tree-label">{entry.name}</span>
      </summary>
      {loading && <div className="tree-row tree-loading">Loading…</div>}
      <div className="tree-children">
        {children?.map((child) => (
          <TreeNode key={child.path} entry={child} selectedPath={selectedPath} onSelect={onSelect} />
        ))}
      </div>
    </details>
  );
}

interface FileTreeProps {
  selectedPath: string;
  onSelect: (path: string) => void;
}

export function FileTree({ selectedPath, onSelect }: FileTreeProps) {
  const [root, setRoot] = useState<DirEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTree('')
      .then((listing) => setRoot(listing.entries))
      .catch((err) => setError(String(err)));
  }, []);

  if (error) return <div className="tree-row tree-error">{error}</div>;
  if (root === null) return <div className="tree-row tree-loading">Loading…</div>;

  return (
    <div className="file-tree">
      {root.map((entry) => (
        <TreeNode key={entry.path} entry={entry} selectedPath={selectedPath} onSelect={onSelect} />
      ))}
    </div>
  );
}
