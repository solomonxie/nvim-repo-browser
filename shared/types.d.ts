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
}
