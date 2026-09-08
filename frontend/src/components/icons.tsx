// T6.3: small GitHub-esque line icons for the file tree. Deliberately
// minimal (sharp corners, two shapes) rather than a full icon library --
// keeps the tree UI recognizable without a new dependency.

export function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" className="tree-icon tree-icon-file" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" d="M4 1.5H9L13 6V14H4Z" />
      <path fill="none" stroke="currentColor" strokeWidth="1.3" d="M9 1.5V6H13" />
    </svg>
  );
}

export function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" className="tree-icon tree-icon-folder" aria-hidden="true">
      <path fill="currentColor" d="M1.5 3.5H6L7.5 5H14.5V12.5H1.5Z" />
    </svg>
  );
}
