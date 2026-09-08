// T6.3: small GitHub-esque line icons. Deliberately minimal (sharp
// corners, few shapes) rather than a full icon library -- keeps the tree
// and top tabs recognizable without a new dependency.

export function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" className="tree-icon tree-icon-file" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" d="M4 1.5H9L13 6V14H4Z" />
      <path fill="none" stroke="currentColor" strokeWidth="1.3" d="M9 1.5V6H13" />
    </svg>
  );
}

export function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" className="tree-icon tree-icon-folder" aria-hidden="true">
      <path fill="currentColor" d="M1.5 3.5H6L7.5 5H14.5V12.5H1.5Z" />
    </svg>
  );
}

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

export function InsightsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" className="tab-icon" aria-hidden="true">
      <rect x="1.5" y="9" width="3" height="5.5" fill="currentColor" />
      <rect x="6.5" y="5" width="3" height="9.5" fill="currentColor" />
      <rect x="11.5" y="1.5" width="3" height="13" fill="currentColor" />
    </svg>
  );
}
