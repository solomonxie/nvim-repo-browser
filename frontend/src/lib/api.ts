// T3.2: typed fetch() wrappers for the live server's JSON API, replacing
// the old window.__REPO_DATA__ accessor from the pre-pivot design.

import type { CodeFrequencyList, CommitDetail, CommitList, ContributorList, DirListing, FileContent, RepoMeta } from '../../../shared/types';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico']);

export function isImageExt(ext: string): boolean {
  return IMAGE_EXTS.has(ext);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body: { error?: string } | null = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error ?? `request failed (${res.status})`);
  }
  return res.json();
}

export function fetchTree(path: string): Promise<DirListing> {
  return getJson(`/api/tree?path=${encodeURIComponent(path)}`);
}

export function fetchFile(path: string): Promise<FileContent> {
  return getJson(`/api/file?path=${encodeURIComponent(path)}`);
}

export function rawUrl(path: string): string {
  return `/raw/${path.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`;
}

export function fetchCommits(limit = 30, before: string | null = null): Promise<CommitList> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set('before', before);
  return getJson(`/api/commits?${params}`);
}

export function fetchCommit(sha: string): Promise<CommitDetail> {
  return getJson(`/api/commit?sha=${encodeURIComponent(sha)}`);
}

export function fetchContributors(): Promise<ContributorList> {
  return getJson('/api/insights/contributors');
}

export function fetchCodeFrequency(): Promise<CodeFrequencyList> {
  return getJson('/api/insights/code-frequency');
}

export function fetchMeta(): Promise<RepoMeta> {
  return getJson('/api/meta');
}
