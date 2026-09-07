// T2.2: list one directory's immediate children, filtered by the target
// repo's root .gitignore. Lazy -- called once per directory viewed, not
// recursively for the whole repo.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import ignore, { type Ignore } from 'ignore';
import type { DirListing } from '../shared/types';

let cachedIgnore: { root: string; ig: Ignore } | null = null;

function loadGitignore(root: string): Ignore {
  if (cachedIgnore && cachedIgnore.root === root) return cachedIgnore.ig;
  const ig = ignore();
  ig.add('.git');
  try {
    ig.add(readFileSync(join(root, '.gitignore'), 'utf-8'));
  } catch {
    // no root .gitignore -- fine, only .git is filtered
  }
  cachedIgnore = { root, ig };
  return ig;
}

export function listDir(root: string, relPath: string): DirListing {
  const ig = loadGitignore(root);
  const absPath = join(root, relPath);

  const entries = readdirSync(absPath, { withFileTypes: true })
    .filter((e) => {
      const entryRel = relPath === '' ? e.name : `${relPath}/${e.name}`;
      // ignore's directory-only patterns (e.g. "node_modules/") only match
      // when the tested path itself carries a trailing slash.
      return !ig.ignores(e.isDirectory() ? `${entryRel}/` : entryRel);
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
