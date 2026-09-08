// Git plumbing for the Commits/Insights tabs -- shells out to `git` (array
// args via execFileSync, never a shell, so no injection risk regardless of
// ref content) against the server's fixed --root. `-c color.ui=false`
// guards against a global git config forcing ANSI codes into our parsed
// output.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BlameLine, CodeFrequencyList, CommitDetail, CommitList, CommitSummary, ContributorList } from '../shared/types';

const ZERO_SHA = '0000000000000000000000000000000000000000'; // git blame's "Not Committed Yet" marker

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

export function listContributors(root: string): ContributorList {
  let out: string;
  try {
    out = git(root, ['log', '--format=%an']);
  } catch {
    return { contributors: [] };
  }
  const counts = new Map<string, number>();
  for (const line of out.split('\n')) {
    if (!line) continue;
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  const contributors = [...counts.entries()]
    .map(([author, commits]) => ({ author, commits }))
    .sort((a, b) => b.commits - a.commits);
  return { contributors };
}

// Monday of the week containing YYYY-MM-DD, as YYYY-MM-DD. Pure calendar
// arithmetic via Date.UTC (never formatted through a local-timezone
// method), so it's safe regardless of the server's own timezone.
function weekStart(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - sinceMonday);
  return date.toISOString().slice(0, 10);
}

// Blames the file's *current* content (working tree, not just HEAD) --
// git blame does this by default, showing ZERO_SHA/"Not Committed Yet"
// for locally modified lines, matching this app's live-content philosophy.
export function blameFile(root: string, relPath: string): BlameLine[] | null {
  let out: string;
  try {
    out = git(root, ['blame', '--line-porcelain', '--', relPath]);
  } catch {
    return null;
  }

  const meta = new Map<string, { author: string; authorTime: number }>();
  const lines = out.split('\n');
  const result: BlameLine[] = [];
  let i = 0;

  while (i < lines.length) {
    const header = /^([0-9a-f]{40}) \d+ \d+/.exec(lines[i]);
    if (!header) {
      i++;
      continue;
    }
    const sha = header[1];
    i++;

    let entry = meta.get(sha);
    while (i < lines.length && !lines[i].startsWith('\t')) {
      const line = lines[i];
      if (line.startsWith('author ')) {
        entry = { author: line.slice(7), authorTime: entry?.authorTime ?? 0 };
      } else if (line.startsWith('author-time ')) {
        entry = { author: entry?.author ?? '', authorTime: Number(line.slice(12)) };
      }
      i++;
    }
    if (entry) meta.set(sha, entry);

    const content = i < lines.length ? lines[i].slice(1) : '';
    i++;

    const found = meta.get(sha);
    result.push({
      sha,
      shortSha: sha.slice(0, 7),
      author: found?.author ?? '',
      date: found?.authorTime ? new Date(found.authorTime * 1000).toISOString() : '',
      line: content,
      committed: sha !== ZERO_SHA,
    });
  }

  return result;
}

export function codeFrequency(root: string): CodeFrequencyList {
  let out: string;
  try {
    out = git(root, ['log', '--pretty=format:@@%aI', '--numstat']);
  } catch {
    return { weeks: [] };
  }
  const buckets = new Map<string, { additions: number; deletions: number }>();
  let week: string | null = null;
  for (const line of out.split('\n')) {
    if (line.startsWith('@@')) {
      week = weekStart(line.slice(2, 12));
      continue;
    }
    const m = /^(\d+|-)\t(\d+|-)\t/.exec(line);
    if (!m || !week) continue;
    const bucket = buckets.get(week) ?? { additions: 0, deletions: 0 };
    bucket.additions += m[1] === '-' ? 0 : Number(m[1]);
    bucket.deletions += m[2] === '-' ? 0 : Number(m[2]);
    buckets.set(week, bucket);
  }
  const weeks = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekOf, v]) => ({ week: weekOf, ...v }));
  return { weeks };
}
