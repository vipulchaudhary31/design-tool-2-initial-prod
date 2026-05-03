/** Human-readable title from uploaded file name (extension stripped). */
export function defaultPostNameFromImageFilename(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, '').trim();
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const cleaned = stem.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : 'Untitled post';
}
