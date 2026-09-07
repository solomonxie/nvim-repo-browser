// T3.2: typed fetch() wrappers for the live server's JSON API, replacing
// the old window.__REPO_DATA__ accessor from the pre-pivot design.

import type { DirListing, FileContent } from '../../../shared/types';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico']);

export function isImageExt(ext: string): boolean {
  return IMAGE_EXTS.has(ext);
}

export async function fetchTree(path: string): Promise<DirListing> {
  const res = await fetch(`/api/tree?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`tree fetch failed (${res.status}): ${path}`);
  return res.json();
}

export async function fetchFile(path: string): Promise<FileContent> {
  const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`file fetch failed (${res.status}): ${path}`);
  return res.json();
}

export function rawUrl(path: string): string {
  return `/raw/${path.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`;
}
