// T6.3: small GitHub-esque line icons for the top tabs. The file tree
// uses plain emoji instead (see FileTree.tsx) -- trivial to resize.

export function CodeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" className="tab-icon" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d="M5 4 1.5 8 5 12M11 4l3.5 4-3.5 4" />
    </svg>
  );
}

export function CommitIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" className="tab-icon" aria-hidden="true">
      <line x1="1" y1="8" x2="5" y2="8" stroke="currentColor" strokeWidth="1.4" />
      <line x1="11" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" className="tree-chevron-icon" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M5.5 3.5 10 8l-4.5 4.5" />
    </svg>
  );
}

export function PrintIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d="M4 6V1.5h8V6M4 12.5h8V15H4z" />
      <rect x="1.5" y="6" width="13" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.5" cy="8" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function InsightsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" className="tab-icon" aria-hidden="true">
      <rect x="1.5" y="9" width="3" height="5.5" fill="currentColor" />
      <rect x="6.5" y="5" width="3" height="9.5" fill="currentColor" />
      <rect x="11.5" y="1.5" width="3" height="13" fill="currentColor" />
    </svg>
  );
}
