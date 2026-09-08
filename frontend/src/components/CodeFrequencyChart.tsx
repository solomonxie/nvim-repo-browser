// T6.5 (Insights): additions/deletions per week -- a genuine diverging
// measure (net change direction), so two hues + a neutral zero baseline,
// not a status-color misuse: position (above/below the line) carries the
// polarity primarily, color reinforces it, matching the +/- convention
// already used for diffs elsewhere in this app.

import { useEffect, useState } from 'react';
import type { CodeFrequencyWeek } from '../../../shared/types';
import { ApiError, fetchCodeFrequency } from '../lib/api';

const MAX_WEEKS = 52;

export function CodeFrequencyChart() {
  const [weeks, setWeeks] = useState<CodeFrequencyWeek[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCodeFrequency()
      .then((r) => setWeeks(r.weeks))
      .catch((err) => setError(err instanceof ApiError ? err.message : String(err)));
  }, []);

  if (error) return null; // not a git repo -- Insights page shows one shared message instead
  if (!weeks) return <div className="tree-loading">Loading…</div>;

  const shown = weeks.slice(-MAX_WEEKS);
  const max = Math.max(1, ...shown.map((w) => w.additions), ...shown.map((w) => w.deletions));

  return (
    <div>
      <div className="chart-legend">
        <span>
          <i className="chart-swatch chart-swatch-add" /> Additions
        </span>
        <span>
          <i className="chart-swatch chart-swatch-del" /> Deletions
        </span>
      </div>
      <div className="frequency-chart">
        {shown.map((w) => (
          <div key={w.week} className="freq-col" title={`Week of ${w.week}: +${w.additions} / -${w.deletions}`}>
            <div className="freq-half freq-top">
              <div className="freq-fill freq-add" style={{ height: `${(w.additions / max) * 100}%` }} />
            </div>
            <div className="freq-half freq-bottom">
              <div className="freq-fill freq-del" style={{ height: `${(w.deletions / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
