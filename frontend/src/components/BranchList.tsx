// T6.4: local + remote branches, current branch marked.

import { useEffect, useState } from 'react';
import type { Branch } from '../../../shared/types';
import { ApiError, fetchBranches } from '../lib/api';

function BranchRow({ branch }: { branch: Branch }) {
  return (
    <div className={`branch-row${branch.current ? ' current' : ''}`}>
      <span className="branch-name">
        {branch.current ? '★ ' : ''}
        {branch.name}
      </span>
      <span className="branch-meta">
        <code>{branch.sha.slice(0, 7)}</code> {branch.subject} · {new Date(branch.date).toLocaleDateString()}
      </span>
    </div>
  );
}

export function BranchList() {
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches()
      .then((r) => setBranches(r.branches))
      .catch((err) => setError(err instanceof ApiError ? err.message : String(err)));
  }, []);

  if (error) return <div className="content-pane error">{error === 'not a git repository' ? 'Not a git repository.' : error}</div>;
  if (!branches) return <div className="content-pane">Loading…</div>;

  const local = branches.filter((b) => !b.remote);
  const remote = branches.filter((b) => b.remote);

  return (
    <div className="branch-list">
      <h3>Local</h3>
      {local.map((b) => (
        <BranchRow key={b.name} branch={b} />
      ))}
      <h3>Remote</h3>
      {remote.map((b) => (
        <BranchRow key={b.name} branch={b} />
      ))}
    </div>
  );
}
