// T3.1: hash-based routing -- window.location.hash + hashchange. No
// react-router: pushState routing would need the server to resolve every
// path back to index.html, which is unnecessary complexity for this UI.

import { useCallback, useEffect, useState } from 'react';

function decodeHash(): string {
  return decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
}

function encodeHash(path: string): string {
  return '#/' + path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

export function useHashPath(): [string, (path: string) => void] {
  const [path, setPathState] = useState(decodeHash);

  useEffect(() => {
    const onHashChange = () => setPathState(decodeHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setPath = useCallback((next: string) => {
    window.location.hash = encodeHash(next);
  }, []);

  return [path, setPath];
}
