// T6.4: Tig-like commit list -- sha, subject, author, date; click for the
// full diff (CommitDetail). Paged via git log's own `~1` boundary trick
// (see server/git.ts), not offset-based, so it stays correct even if
// commits land while the list is open.

import { useEffect, useState } from 'react';
import type { CommitSummary } from '../../../shared/types';
import { ApiError, fetchCommits } from '../lib/api';

interface CommitListProps {
  onSelect: (sha: string) => void;
}

export function CommitList({ onSelect }: CommitListProps) {
  const [commits, setCommits] = useState<CommitSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(before: string | null, initial = false) {
    setLoading(true);
    try {
      const result = await fetchCommits(30, before);
      setCommits((prev) => (initial ? result.commits : [...prev, ...result.commits]));
      setCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (error) return <div className="content-pane error">{error === 'not a git repository' ? 'Not a git repository.' : error}</div>;

  return (
    <div className="commit-list">
      {commits.map((c) => (
        <div key={c.sha} className="commit-row" onClick={() => onSelect(c.sha)}>
          <span className="commit-subject">{c.subject}</span>
          <span className="commit-meta">
            <code className="commit-sha">{c.shortSha}</code>
            {c.author} · {new Date(c.date).toLocaleDateString()}
          </span>
        </div>
      ))}
      {loading && <div className="tree-loading">Loading…</div>}
      {!loading && cursor && (
        <button className="commit-load-more" onClick={() => load(cursor)}>
          Load more
        </button>
      )}
    </div>
  );
}
