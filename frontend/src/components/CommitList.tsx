// T6.4: Tig-like commit list, grouped by day (GitHub's own commit-list
// layout) -- a date header per day, then each commit as a card: subject,
// "author committed X ago", sha. Click for the full diff (CommitDetail).
// Paged via git log's own `~1` boundary trick (see server/git.ts), not
// offset-based, so it stays correct even if commits land while the list
// is open.

import { useEffect, useState } from 'react';
import type { CommitSummary } from '../../../shared/types';
import { ApiError, fetchCommits } from '../lib/api';
import { longDate, relativeTime, shortDate } from '../lib/format';

interface CommitListProps {
  onSelect: (sha: string) => void;
}

function groupByDay(commits: CommitSummary[]): [string, CommitSummary[]][] {
  const groups = new Map<string, CommitSummary[]>();
  for (const c of commits) {
    const day = shortDate(c.date);
    const group = groups.get(day);
    if (group) group.push(c);
    else groups.set(day, [c]);
  }
  return [...groups.entries()];
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
      {groupByDay(commits).map(([day, group]) => (
        <div key={day} className="commit-group">
          <div className="commit-group-header">Commits on {longDate(day)}</div>
          {group.map((c) => (
            <div key={c.sha} className="commit-card" onClick={() => onSelect(c.sha)}>
              <div className="commit-card-subject">{c.subject}</div>
              <div className="commit-card-meta">
                <span>
                  {c.author} committed {relativeTime(c.date)}
                </span>
                <code className="commit-sha">{c.shortSha}</code>
              </div>
            </div>
          ))}
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
