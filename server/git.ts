// Git plumbing for the Commits/Branches tabs -- shells out to `git` (array
// args via execFileSync, never a shell, so no injection risk regardless of
// ref content) against the server's fixed --root. `-c color.ui=false`
// guards against a global git config forcing ANSI codes into our parsed
// output.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Branch, BranchList, CommitDetail, CommitList, CommitSummary } from '../shared/types';

const US = '\x1f'; // unit separator -- between fields
const RS = '\x1e'; // record separator -- between commits
const COMMIT_FORMAT = `%H${US}%h${US}%an${US}%aI${US}%s`;

let repoCheck: { root: string; isRepo: boolean } | null = null;

export function isGitRepo(root: string): boolean {
  if (repoCheck && repoCheck.root === root) return repoCheck.isRepo;
  const isRepo = existsSync(join(root, '.git'));
  repoCheck = { root, isRepo };
  return isRepo;
}

function git(root: string, args: string[]): string {
  return execFileSync('git', ['-C', root, '-c', 'color.ui=false', ...args], {
    encoding: 'utf-8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function parseCommitLine(line: string): CommitSummary {
  const [sha, shortSha, author, date, subject] = line.split(US);
  return { sha, shortSha, author, date, subject };
}

export function listCommits(root: string, limit: number, before: string | null): CommitList {
  const args = ['log', `--format=${COMMIT_FORMAT}${RS}`, `-n`, String(limit)];
  args.push(before ? `${before}~1` : 'HEAD');
  let out: string;
  try {
    out = git(root, args);
  } catch {
    return { commits: [], nextCursor: null };
  }
  const lines = out.split(RS).map((l) => l.trim()).filter(Boolean);
  const commits = lines.map(parseCommitLine);
  const nextCursor = commits.length === limit ? commits[commits.length - 1].sha : null;
  return { commits, nextCursor };
}

export function getCommit(root: string, sha: string): CommitDetail | null {
  let out: string;
  try {
    out = git(root, ['show', `--format=${COMMIT_FORMAT}${US}%b${RS}`, '--patch', sha]);
  } catch {
    return null;
  }
  const sep = out.indexOf(RS);
  if (sep === -1) return null;
  const header = out.slice(0, sep);
  const diff = out.slice(sep + 1).replace(/^\n/, '');
  const [gitSha, shortSha, author, date, subject, body] = header.split(US);
  return { sha: gitSha, shortSha, author, date, subject, body: body ?? '', diff };
}

export function listBranches(root: string): BranchList {
  const format = `%(refname:short)${US}%(objectname)${US}%(contents:subject)${US}%(committerdate:iso-strict)${US}%(HEAD)`;
  const branches: Branch[] = [];

  for (const [ref, remote] of [
    ['refs/heads', false],
    ['refs/remotes', true],
  ] as const) {
    let out: string;
    try {
      out = git(root, ['for-each-ref', `--format=${format}`, ref]);
    } catch {
      continue;
    }
    for (const line of out.split('\n')) {
      if (!line.trim()) continue;
      const [name, sha, subject, date, head] = line.split(US);
      if (remote && name.endsWith('/HEAD')) continue; // symbolic pointer, not a real branch
      branches.push({ name, remote, current: head === '*', sha, subject, date });
    }
  }
  return { branches };
}
