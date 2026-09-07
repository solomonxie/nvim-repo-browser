// T3.3: recursive file tree via native <details>/<summary> (free
// expand/collapse), lazily fetching a directory's children on first
// expand rather than the whole tree upfront.

import { useEffect, useState } from 'react';
import type { DirEntry } from '../../../shared/types';
import { fetchTree } from '../lib/api';

interface TreeNodeProps {
  entry: DirEntry;
  selectedPath: string;
  onSelect: (path: string) => void;
}

function TreeNode({ entry, selectedPath, onSelect }: TreeNodeProps) {
  const [children, setChildren] = useState<DirEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (entry.type === 'file') {
    const selected = entry.path === selectedPath;
    return (
      <div className={`tree-row tree-file${selected ? ' selected' : ''}`} onClick={() => onSelect(entry.path)}>
        {entry.name}
      </div>
    );
  }

  async function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    if (e.currentTarget.open && children === null) {
      setLoading(true);
      const listing = await fetchTree(entry.path);
      setChildren(listing.entries);
      setLoading(false);
    }
  }

  return (
    <details onToggle={handleToggle}>
      <summary className={`tree-row${entry.path === selectedPath ? ' selected' : ''}`} onClick={() => onSelect(entry.path)}>
        {entry.name}
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
