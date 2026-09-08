// GitHub's Blame tab -- `git blame` on the file's live working-tree
// content (see server/git.ts's blameFile), so uncommitted local edits
// show as "Not committed yet" rather than blaming the wrong line to an
// old commit. Consecutive lines from the same commit only show the
// author/date once, matching GitHub's own grouped blame gutter.

import { useEffect, useState } from 'react';
import type { BlameLine } from '../../../shared/types';
import { ApiError, fetchBlame } from '../lib/api';
import { relativeTime } from '../lib/format';

interface BlameViewProps {
  path: string;
}

export function BlameView({ path }: BlameViewProps) {
  const [lines, setLines] = useState<BlameLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLines(null);
    setError(null);
    fetchBlame(path)
      .then((r) => setLines(r.lines))
      .catch((err) => setError(err instanceof ApiError ? err.message : String(err)));
  }, [path]);

  if (error) return <div className="placeholder">{error}</div>;
  if (!lines) return <div className="tree-loading">Loading…</div>;

  return (
    <div className="blame-view">
      {lines.map((l, i) => {
        const grouped = i > 0 && lines[i - 1].sha === l.sha;
        return (
          <div key={i} className={`blame-row${grouped ? ' grouped' : ''}`}>
            <div className="blame-gutter">
              {!grouped && (
                <>
                  <span className="blame-author">{l.committed ? l.author : 'Not committed yet'}</span>
                  {l.committed && <span className="blame-time">{relativeTime(l.date)}</span>}
                </>
              )}
            </div>
            <pre className="blame-line">{l.line}</pre>
          </div>
        );
      })}
    </div>
  );
}
