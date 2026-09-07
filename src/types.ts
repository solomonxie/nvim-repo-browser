// Shared shape between the indexer (producer) and the app (consumer).
// Never let these drift -- both sides import from here.

export type RepoNode =
  | { type: 'dir'; name: string; path: string; children: RepoNode[] }
  | {
      type: 'file';
      name: string;
      path: string;
      size: number;
      ext: string;
      content: string | null;
      binary: boolean;
      tooLarge: boolean;
      dataUri: string | null;
    };

export interface RepoData {
  meta: {
    repoName: string;
    generatedAt: string;
    rootPath: string;
  };
  tree: RepoNode;
}

declare global {
  interface Window {
    __REPO_DATA__: RepoData | null;
  }
}
