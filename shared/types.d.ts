// Shared shape between the server (producer) and the app (consumer) for the
// live HTTP API -- GET /api/tree and GET /api/file. Never let these drift.

export interface RepoMeta {
  name: string; // basename of the browsed repo's root -- used as the page title
}

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

export interface Contributor {
  author: string;
  commits: number;
}

export interface ContributorList {
  contributors: Contributor[];
}

export interface CodeFrequencyWeek {
  week: string; // Monday of the week, YYYY-MM-DD
  additions: number;
  deletions: number;
}

export interface CodeFrequencyList {
  weeks: CodeFrequencyWeek[];
}
