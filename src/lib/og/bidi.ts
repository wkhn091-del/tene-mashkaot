/**
 * Minimal visual reordering for Hebrew text in generated images: the image renderer (Satori) lays
 * glyphs out left-to-right and has no bidi support. Hebrew has no contextual letter forms, so
 * reversing each Hebrew word and the order of the words gives the correct visual line, while
 * runs of Latin words and numbers ("Tura Merlot 2021") keep their own reading order.
 */

const HEBREW = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
const LTR_CHAR = /[A-Za-z0-9\u00C0-\u024F]/;
const MIRROR: Record<string, string> = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«' };

const reverseWord = (word: string) =>
  [...word]
    .reverse()
    .map((ch) => MIRROR[ch] ?? ch)
    .join('');

export function hasHebrew(text: string): boolean {
  return HEBREW.test(text);
}

/** Converts one logical line of right-to-left text into its visual (left-to-right) form. */
export function visualLine(line: string): string {
  if (!hasHebrew(line)) return line;
  const words = line.trim().split(/\s+/);
  const units: string[] = [];
  let ltrRun: string[] = [];
  const flush = () => {
    if (ltrRun.length) units.push(ltrRun.join(' '));
    ltrRun = [];
  };
  for (const word of words) {
    if (HEBREW.test(word)) {
      flush();
      units.push(reverseWord(word));
    } else if (LTR_CHAR.test(word)) {
      ltrRun.push(word);
    } else if (ltrRun.length) {
      // Neutral punctuation between left-to-right words stays with them ("Tura – 2021").
      ltrRun.push(word);
    } else {
      units.push(reverseWord(word));
    }
  }
  flush();
  return units.reverse().join(' ');
}

/** Greedy word wrap in logical order (before reordering), capped at `maxLines` with an ellipsis. */
export function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s,.–-]+$/, '')}…`;
    return kept;
  }
  return lines;
}
