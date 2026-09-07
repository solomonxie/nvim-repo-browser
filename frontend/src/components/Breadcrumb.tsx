// T3.3: path breadcrumb -- root + one clickable crumb per path segment.

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const segments = path.split('/').filter(Boolean);
  const crumbs: { name: string; path: string }[] = [{ name: 'root', path: '' }];
  let acc = '';
  for (const seg of segments) {
    acc = acc ? `${acc}/${seg}` : seg;
    crumbs.push({ name: seg, path: acc });
  }

  return (
    <nav className="breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path}>
          {i > 0 && <span className="breadcrumb-sep"> / </span>}
          <a onClick={() => onNavigate(crumb.path)}>{crumb.name}</a>
        </span>
      ))}
    </nav>
  );
}
