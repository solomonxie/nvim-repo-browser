// T2.2: list one directory's immediate children, filtered by every
// .gitignore from the repo root down to that directory (nested
// .gitignore rules included, not just the root's). Lazy -- called once
// per directory viewed, not recursively for the whole repo.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import ignore, { type Ignore } from 'ignore';
import type { DirListing } from '../shared/types';

// A .gitignore's own patterns are relative to the directory it lives in,
// but our single combined Ignore matcher tests paths relative to the repo
// root -- so each pattern needs rebasing onto relDir before being added.
// An unanchored bare name (no slash at all, e.g. "node_modules") matches
// at any depth under that .gitignore's directory per gitignore's own
// rules, hence the "**/" -- everything else is already anchored to that
// directory once relDir is prepended.
function rebasePattern(pattern: string, relDir: string): string {
  if (relDir === '') return pattern;
  let negate = '';
  let p = pattern;
  if (p.startsWith('!')) {
    negate = '!';
    p = p.slice(1);
  }
  const trailingSlash = p.endsWith('/') ? '/' : '';
  let body = trailingSlash ? p.slice(0, -1) : p;
  if (body.startsWith('/')) body = body.slice(1);
  else if (!body.includes('/')) body = `**/${body}`;
  return `${negate}${relDir}/${body}${trailingSlash}`;
}

function readGitignoreLines(root: string, dir: string): string[] {
  try {
    return readFileSync(join(root, dir, '.gitignore'), 'utf-8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '' && !l.startsWith('#'));
  } catch {
    return [];
  }
}

// Builds one Ignore matcher covering every .gitignore from the repo root
// down to (and including) relDir -- recomputed fresh each call rather
// than cached, so edits to any .gitignore take effect immediately, same
// as everything else this server serves.
function buildIgnoreChain(root: string, relDir: string): Ignore {
  const ig = ignore();
  ig.add('.git');

  const segments = relDir === '' ? [] : relDir.split('/');
  let acc = '';
  for (const dir of ['', ...segments]) {
    acc = dir === '' ? acc : acc ? `${acc}/${dir}` : dir;
    for (const line of readGitignoreLines(root, acc)) {
      ig.add(rebasePattern(line, acc));
    }
  }
  return ig;
}

// A directory whose own .gitignore ignores everything inside it (a bare
// "*", e.g. pytest/mypy/ruff's auto-generated cache dirs) is never itself
// named by any ancestor rule, yet `git status` shows it as if it were
// ignored -- because every file it could ever contain already is. Real
// git's status output is what "respect .gitignore" means to a user in
// practice, so match that: a subdirectory this shallow check finds fully
// self-ignored is filtered from its parent's listing too.
function isSelfIgnoring(root: string, dir: string): boolean {
  return readGitignoreLines(root, dir).some((l) => l === '*' || l === '/*');
}

export function listDir(root: string, relPath: string): DirListing {
  const ig = buildIgnoreChain(root, relPath);
  const absPath = join(root, relPath);

  const entries = readdirSync(absPath, { withFileTypes: true })
    .filter((e) => {
      const entryRel = relPath === '' ? e.name : `${relPath}/${e.name}`;
      // ignore's directory-only patterns (e.g. "node_modules/") only match
      // when the tested path itself carries a trailing slash.
      if (ig.ignores(e.isDirectory() ? `${entryRel}/` : entryRel)) return false;
      if (e.isDirectory() && isSelfIgnoring(root, entryRel)) return false;
      return true;
    })
    .map((e) => {
      const entryRel = relPath === '' ? e.name : `${relPath}/${e.name}`;
      if (e.isDirectory()) {
        return { name: e.name, path: entryRel, type: 'dir' as const, size: null, ext: null };
      }
      const size = statSync(join(absPath, e.name)).size;
      return { name: e.name, path: entryRel, type: 'file' as const, size, ext: extname(e.name).toLowerCase() };
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return { path: relPath, entries };
}

export function repoName(root: string): string {
  return basename(root);
}
