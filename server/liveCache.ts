// T2.3: in-memory, per-process cache keyed by relPath. Always compare a
// fresh stat first -- only re-run `loader` when mtime+size differ from
// what's cached. Never persisted to disk; lives only for the server
// process's lifetime (one per nvim session).

interface Entry<T> {
  mtimeMs: number;
  size: number;
  payload: T;
}

export class LiveCache<T> {
  private entries = new Map<string, Entry<T>>();

  getOrLoad(relPath: string, mtimeMs: number, size: number, loader: () => T): T {
    const cached = this.entries.get(relPath);
    if (cached && cached.mtimeMs === mtimeMs && cached.size === size) {
      return cached.payload;
    }
    const payload = loader();
    this.entries.set(relPath, { mtimeMs, size, payload });
    return payload;
  }
}
