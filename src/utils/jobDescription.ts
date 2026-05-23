/** True when content is likely HTML from Indeed (or similar) rather than markdown/plain. */
export function looksLikeHtml(text: string): boolean {
  const t = text.trim();
  if (!t.startsWith('<')) return false;
  return /<\/?[a-z][\s\S]*>/i.test(t);
}
