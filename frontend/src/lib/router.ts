// T3.1 (extended for T6.4/T6.5): hash-based routing -- window.location.hash
// + hashchange. No react-router: pushState routing would need the server
// to resolve every path back to index.html, which is unnecessary
// complexity for this UI. Three top-level pages (Code/Commits/Insights,
// GitHub's Code/Issues/PRs tabs made local): #/code/<path>,
// #/commits[/<sha>], #/insights. An unrecognized/empty hash defaults to
// Code, keeping old bare-path links (#/README.md, from before this route
// scheme existed) working as a Code path instead of a dead link.

import { useCallback, useEffect, useState } from 'react';

export type Route = { page: 'code'; path: string } | { page: 'commits'; sha: string | null } | { page: 'insights' };

function decode(): Route {
  const raw = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  const slash = raw.indexOf('/');
  const first = slash === -1 ? raw : raw.slice(0, slash);
  const rest = slash === -1 ? '' : raw.slice(slash + 1);

  if (first === 'commits') return { page: 'commits', sha: rest || null };
  if (first === 'insights') return { page: 'insights' };
  if (first === 'code') return { page: 'code', path: rest };
  return { page: 'code', path: raw };
}

function encode(route: Route): string {
  if (route.page === 'commits') return '#/commits' + (route.sha ? `/${encodeURIComponent(route.sha)}` : '');
  if (route.page === 'insights') return '#/insights';
  return '#/code/' + route.path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRouteState] = useState<Route>(decode);

  useEffect(() => {
    const onHashChange = () => setRouteState(decode());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = encode(next);
  }, []);

  return [route, navigate];
}
