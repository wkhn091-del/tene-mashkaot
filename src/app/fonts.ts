import localFont from 'next/font/local';

/*
 * Self-hosted Heebo (text) and Suez One (display), split into Hebrew and Latin subsets with
 * unicode-range, so builds never depend on reaching Google Fonts and pages fetch only what they use.
 * Sources: @fontsource-variable/heebo and @fontsource/suez-one (SIL Open Font License).
 */
export const heeboHebrew = localFont({
  src: './fonts/heebo-hebrew-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-heebo-he',
  display: 'swap',
  declarations: [{ prop: 'unicode-range', value: 'U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F' }],
});

export const heeboLatin = localFont({
  src: './fonts/heebo-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-heebo-latin',
  display: 'swap',
  declarations: [
    { prop: 'unicode-range', value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  ],
});

export const suezHebrew = localFont({
  src: './fonts/suez-one-hebrew-400-normal.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-suez-he',
  display: 'swap',
  declarations: [{ prop: 'unicode-range', value: 'U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F' }],
});

export const suezLatin = localFont({
  src: './fonts/suez-one-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-suez-latin',
  display: 'swap',
  preload: false,
  declarations: [
    { prop: 'unicode-range', value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  ],
});

export const fontVariables = [heeboHebrew.variable, heeboLatin.variable, suezHebrew.variable, suezLatin.variable].join(' ');
