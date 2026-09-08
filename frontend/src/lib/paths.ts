// Resolves a link found inside a rendered file (currently: markdown) against
// the repo-relative path of the file it came from. Returns null for links
// that should keep their default browser behavior instead of being routed
// through the app -- external URLs, mailto/tel, and bare in-page anchors.

export function resolveRelativeLink(fromPath: string, href: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null; // http(s):, mailto:, tel:, etc.
  if (href.startsWith('#')) return null; // in-page anchor -- not a repo path

  const [pathPart] = href.split('#');
  if (pathPart === '') return null;

  const baseDir = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : '';
  const combined = pathPart.startsWith('/') ? pathPart.slice(1) : `${baseDir}/${pathPart}`;

  const out: string[] = [];
  for (const seg of combined.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return out.join('/');
}
