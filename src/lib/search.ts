const NIQQUD = /[\u0591-\u05C7]/g;
const FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
const HEBREW_PREFIXES = /^[הובלמשכ]/;

/** Lower-case, niqqud-free, final-letter-free text so "יין", "היַּיִן" and "Wine" compare cleanly. */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(NIQQUD, '')
    .replace(/[ךםןףץ]/g, (c) => FINALS[c] ?? c)
    .replace(/["'`׳״]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function tokenMatches(token: string, words: string[], haystack: string): boolean {
  if (haystack.includes(token)) return true;
  if (token.length < 4) return false;
  return words.some((word) => withinOneEdit(token, word) || withinOneEdit(token, word.slice(0, token.length)));
}

/** Every query word must appear in the text, allowing one typo per word and a leading Hebrew prefix letter. */
export function matchesSearch(normalizedText: string, query: string): boolean {
  const tokens = normalizeSearch(query).split(' ').filter(Boolean);
  if (!tokens.length) return true;
  const words = normalizedText.split(' ');
  return tokens.every((token) => {
    if (tokenMatches(token, words, normalizedText)) return true;
    const stripped = token.length > 3 ? token.replace(HEBREW_PREFIXES, '') : token;
    return stripped !== token && tokenMatches(stripped, words, normalizedText);
  });
}
