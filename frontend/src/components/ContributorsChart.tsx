// T6.5 (Insights): commits per author -- a ranked-magnitude comparison,
// so one sequential hue for every bar (length is the only signal; a
// different hue per bar would falsely imply a second dimension). Capped
// to the top 20 with a note, since a long-lived repo can have many
// one-off contributors.

import { useEffect, useState } from 'react';
import type { Contributor } from '../../../shared/types';
import { ApiError, fetchContributors } from '../lib/api';

const MAX_ROWS = 20;

export function ContributorsChart() {
  const [contributors, setContributors] = useState<Contributor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContributors()
      .then((r) => setContributors(r.contributors))
      .catch((err) => setError(err instanceof ApiError ? err.message : String(err)));
  }, []);

  if (error) return null; // not a git repo -- Insights page shows one shared message instead
  if (!contributors) return <div className="tree-loading">Loading…</div>;

  const shown = contributors.slice(0, MAX_ROWS);
  const max = Math.max(1, ...shown.map((c) => c.commits));

  return (
    <div className="chart-bars">
      {shown.map((c) => (
        <div key={c.author} className="chart-bar-row">
          <span className="chart-bar-label" title={c.author}>
            {c.author}
          </span>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{ width: `${(c.commits / max) * 100}%` }} />
          </div>
          <span className="chart-bar-value">{c.commits}</span>
        </div>
      ))}
      {contributors.length > MAX_ROWS && (
        <div className="chart-note">+{contributors.length - MAX_ROWS} more contributors not shown</div>
      )}
    </div>
  );
}
