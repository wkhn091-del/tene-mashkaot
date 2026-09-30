import 'server-only';

/**
 * CSV for Google Sheets. Identifiers, phones and dates get a LEFT-TO-RIGHT MARK (U+200E) prefix so
 * Sheets keeps them as text (no lost leading zeros, no date/number reformatting, no RTL flipping).
 * Money stays numeric so SUM() works. Any text that could start a formula is neutralized the same way.
 */

export const LRM = '\u200E';
const FORMULA_START = /^[=+\-@\t\r]/;

export type CsvKind = 'text' | 'lrm' | 'number';

export interface CsvColumn<T> {
  header: string;
  kind: CsvKind;
  value: (row: T) => string | number | null | undefined;
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function cell(value: string | number | null | undefined, kind: CsvKind): string {
  if (value === null || value === undefined || value === '') return '';
  if (kind === 'number') {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? String(n) : '';
  }
  let text = String(value).replace(/\r\n?/g, '\n');
  if (kind === 'lrm' || FORMULA_START.test(text)) text = `${LRM}${text}`;
  return quote(text);
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => quote(column.header)).join(',');
  const body = rows.map((row) => columns.map((column) => cell(column.value(row), column.kind)).join(','));
  // BOM so Excel also opens Hebrew correctly; the Apps Script strips it.
  return `\uFEFF${[header, ...body].join('\r\n')}\r\n`;
}
