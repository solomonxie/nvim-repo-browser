// T6.4: one commit's metadata + full diff, reusing CodeView's highlight.js
// 'diff' language for the patch body.

import { useEffect, useState } from 'react';
import type { CommitDetail as CommitDetailData } from '../../../shared/types';
import { ApiError, fetchCommit } from '../lib/api';
import { CodeView } from './CodeView';

interface CommitDetailProps {
  sha: string;
  onBack: () => void;
}

export function CommitDetail({ sha, onBack }: CommitDetailProps) {
  const [commit, setCommit] = useState<CommitDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCommit(null);
    setError(null);
    fetchCommit(sha)
      .then(setCommit)
      .catch((err) => setError(err instanceof ApiError ? err.message : String(err)));
  }, [sha]);

  if (error) return <div className="content-pane error">{error}</div>;
  if (!commit) return <div className="content-pane">Loading…</div>;

  return (
    <div className="commit-detail">
      <a className="commit-back" onClick={onBack}>
        ← All commits
      </a>
      <h2>{commit.subject}</h2>
      {commit.body && <pre className="commit-body">{commit.body}</pre>}
      <div className="commit-meta">
        <code>{commit.shortSha}</code> {commit.author} · {new Date(commit.date).toLocaleString()}
      </div>
      <CodeView path={`${commit.shortSha}.diff`} ext=".diff" content={commit.diff} />
    </div>
  );
}
