export type ContactLinkKind = 'linkedin' | 'twitter' | 'email' | 'web' | 'other';

export interface ContactLink {
  label: string;
  url: string;
  kind: ContactLinkKind;
}

function classifyUrl(url: string): ContactLinkKind {
  const u = url.toLowerCase();
  if (u.startsWith('mailto:')) return 'email';
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (/^https?:\/\//i.test(url)) return 'web';
  return 'other';
}

function kindLabel(kind: ContactLinkKind): string {
  switch (kind) {
    case 'linkedin':
      return 'LinkedIn';
    case 'twitter':
      return 'X / Twitter';
    case 'email':
      return 'Email';
    case 'web':
      return 'Web';
    default:
      return 'Link';
  }
}

const GENERIC_LINK_LABELS = new Set([
  'linkedin',
  'email',
  'e-mail',
  'web',
  'website',
  'twitter',
  'x',
  'x / twitter',
  'link',
  'profile',
  'personal website',
  'company website'
]);

function isGenericLinkLabel(label: string): boolean {
  return GENERIC_LINK_LABELS.has(label.trim().toLowerCase());
}

/** Name from a Key people bullet, e.g. "**Jane Doe** — CEO" or "- John Smith, CTO". */
function personNameFromBulletLine(line: string): string | null {
  const bold = line.match(/\*\*([^*]+)\*\*/);
  if (bold?.[1]?.trim()) return bold[1].trim();

  const trimmed = line.replace(/^[\s>*\-•]+/, '').trim();
  if (!trimmed) return null;

  const beforeSep = trimmed.split(/\s*[—–]\s*|\s*,\s*/)[0]?.trim();
  if (!beforeSep || /^https?:\/\//i.test(beforeSep)) return null;
  if (/^(linkedin|email|twitter|web|contact)/i.test(beforeSep)) return null;
  if (beforeSep.length > 60) return null;
  return beforeSep;
}

function contactLabel(linkLabel: string | undefined, personName: string | null, kind: ContactLinkKind): string {
  const trimmed = linkLabel?.trim();
  if (personName && (!trimmed || isGenericLinkLabel(trimmed))) return personName;
  if (trimmed) return trimmed;
  return kindLabel(kind);
}

function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^mailto:/i.test(t)) return t;
  if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(t)) return `mailto:${t}`;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  return null;
}

function addLink(
  map: Map<string, ContactLink>,
  url: string,
  label?: string,
  personName?: string | null
) {
  const normalized = normalizeUrl(url);
  if (!normalized) return;
  const key = normalized.toLowerCase();
  const kind = classifyUrl(normalized);
  const cleanLabel = contactLabel(label, personName ?? null, kind);
  const existing = map.get(key);
  if (existing) {
    if (personName && isGenericLinkLabel(existing.label)) {
      map.set(key, { ...existing, label: personName });
    }
    return;
  }
  map.set(key, { label: cleanLabel, url: normalized, kind });
}

function extractLinksFromText(
  text: string,
  map: Map<string, ContactLink>,
  personName?: string | null
) {
  const mdLink = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdLink.exec(text)) !== null) {
    addLink(map, m[2], m[1], personName);
  }

  const bareUrl = /https?:\/\/[^\s<>"')\]]+/gi;
  while ((m = bareUrl.exec(text)) !== null) {
    addLink(map, m[0], undefined, personName);
  }

  const email = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  while ((m = email.exec(text)) !== null) {
    addLink(map, m[0], m[0], personName);
  }
}

/** Pull people-related links from Grok / report markdown for the report page. */
export function extractContactLinks(...sources: (string | undefined)[]): ContactLink[] {
  const map = new Map<string, ContactLink>();

  for (const source of sources) {
    if (!source?.trim()) continue;
    extractLinksFromText(source, map);
  }

  const order: ContactLinkKind[] = ['linkedin', 'email', 'twitter', 'web', 'other'];
  return [...map.values()].sort(
    (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.label.localeCompare(b.label)
  );
}

function extractFromKeyPeopleSection(section: string): ContactLink[] {
  const map = new Map<string, ContactLink>();
  const lines = section.split('\n');

  for (const line of lines) {
    const personName = personNameFromBulletLine(line);
    if (personName || /\[([^\]]+)\]\(([^)]+)\)/.test(line) || /https?:\/\//i.test(line)) {
      extractLinksFromText(line, map, personName);
    }
  }

  const order: ContactLinkKind[] = ['linkedin', 'email', 'twitter', 'web', 'other'];
  return [...map.values()].sort(
    (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.label.localeCompare(b.label)
  );
}

/** Prefer links from the Key people section when present. */
export function extractKeyPeopleContacts(grokText?: string, reportText?: string): ContactLink[] {
  const sections: string[] = [];
  for (const text of [grokText, reportText]) {
    if (!text) continue;
    const match = text.match(/##\s*key people[^\n]*\n([\s\S]*?)(?=\n##\s|\n#\s|$)/i);
    if (match?.[1]) sections.push(match[1]);
  }
  if (sections.length > 0) {
    const fromSection = sections.flatMap((s) => extractFromKeyPeopleSection(s));
    if (fromSection.length > 0) {
      const deduped = new Map<string, ContactLink>();
      for (const link of fromSection) deduped.set(link.url.toLowerCase(), link);
      return [...deduped.values()].sort(
        (a, b) => a.label.localeCompare(b.label)
      );
    }
  }
  return extractContactLinks(grokText, reportText);
}
