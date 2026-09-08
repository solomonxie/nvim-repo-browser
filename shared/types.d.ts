// Shared shape between the server (producer) and the app (consumer) for the
// live HTTP API -- GET /api/tree and GET /api/file. Never let these drift.

export interface DirEntry {
  name: string;
  path: string;
  type: 'dir' | 'file';
  size: number | null;
  ext: string | null;
}

export interface DirListing {
  path: string;
  entries: DirEntry[];
}

export interface FileContent {
  path: string;
  ext: string;
  size: number;
  binary: boolean;
  tooLarge: boolean;
  content: string | null; // null for binary/image/too-large -- fetch raw bytes from /raw/<path> instead
  renderedHtml: string | null; // pandoc-rendered HTML fragment, .md files only (null if pandoc unavailable/failed)
}

export interface CommitSummary {
  sha: string;
  shortSha: string;
  author: string;
  date: string; // ISO 8601
  subject: string;
}

export interface CommitList {
  commits: CommitSummary[];
  nextCursor: string | null; // pass back as ?before= to page further
}

export interface CommitDetail extends CommitSummary {
  body: string;
  diff: string; // unified diff, unparsed -- rendered as a diff-highlighted code block
}

export interface Branch {
  name: string;
  remote: boolean;
  current: boolean;
  sha: string;
  subject: string;
  date: string; // ISO 8601
}

export interface BranchList {
  branches: Branch[];
}
