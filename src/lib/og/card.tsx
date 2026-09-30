import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { hasHebrew, visualLine, wrapLines } from './bidi';

export const OG_SIZE = { width: 1200, height: 630 };

type FontSpec = { name: string; data: Buffer; weight: 400 | 700; style: 'normal' };
let fontsPromise: Promise<FontSpec[]> | null = null;

/**
 * WOFF (not WOFF2): the image renderer only reads TTF/OTF/WOFF. Each subset gets its own family name
 * and texts list both, because same-named fonts are de-duplicated and the Latin glyphs would be lost.
 */
function loadFonts(): Promise<FontSpec[]> {
  fontsPromise ??= Promise.all(
    (
      [
        ['SuezHe', 'suez-one-hebrew-400-normal.woff', 400],
        ['SuezLatin', 'suez-one-latin-400-normal.woff', 400],
        ['HeeboHe', 'heebo-hebrew-700-normal.woff', 700],
        ['HeeboLatin', 'heebo-latin-700-normal.woff', 700],
      ] as const
    ).map(async ([name, file, weight]) => ({
      name,
      data: await readFile(join(process.cwd(), 'assets/og', file)),
      weight,
      style: 'normal' as const,
    })),
  );
  return fontsPromise;
}

/** Downloads the photo up front (bounded), so a slow image host can never hang the preview. */
async function fetchPhoto(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/^image\/(jpeg|png)/.test(type)) return null;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path fill="#d4a94f" d="M32 8l5.6 13.2L52 22.4l-10.9 9.4 3.3 14.1L32 38.3 19.6 45.9l3.3-14.1L12 22.4l14.4-1.2z" />
    </svg>
  );
}

export interface OgCardInput {
  locale: string;
  brand: string;
  title: string;
  subtitle?: string;
  badge: string;
  photoUrl?: string | null;
}

/**
 * Branded 1200×630 share image, returned as JPEG: WhatsApp skips large previews, and a photo inside a
 * PNG easily passes 500KB, while this JPEG stays around 60–120KB. No prices – chats cache previews.
 */
export async function renderOgCard({ locale, brand, title, subtitle, badge, photoUrl }: OgCardInput): Promise<Response> {
  const rtl = locale !== 'en';
  const show = (text: string) => (rtl && hasHebrew(text) ? visualLine(text) : text);
  const titleSize = title.length <= 20 ? 66 : title.length <= 38 ? 56 : 48;
  const lines = wrapLines(title, Math.floor(560 / (titleSize * 0.52)), 3).map(show);
  const [fonts, photo] = await Promise.all([loadFonts(), fetchPhoto(photoUrl)]);

  const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: rtl ? 'row' : 'row-reverse',
          position: 'relative',
          backgroundImage: 'linear-gradient(135deg, #140508 0%, #2a0a10 55%, #3a0d15 100%)',
          fontFamily: 'HeeboHe, HeeboLatin',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            display: 'flex',
            border: '2px solid rgba(207,166,105,0.55)',
            borderRadius: 28,
          }}
        />
        <div style={{ width: 520, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 440,
              height: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 24,
              backgroundImage: 'radial-gradient(circle at 50% 42%, #fbf4e4 0%, #e7d4ad 72%, #c9ab73 100%)',
            }}
          >
            {photo ? <img src={photo} width={400} height={460} style={{ objectFit: 'contain' }} alt="" /> : <Star size={220} />}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: rtl ? 'flex-end' : 'flex-start',
            padding: rtl ? '60px 80px 60px 16px' : '60px 16px 60px 80px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#cfa669', fontSize: 30, fontFamily: 'SuezHe, SuezLatin' }}>
            {rtl ? (
              <>
                <span>{show(brand)}</span>
                <Star size={34} />
              </>
            ) : (
              <>
                <Star size={34} />
                <span>{brand}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: rtl ? 'flex-end' : 'flex-start', marginTop: 22 }}>
            {lines.map((line, index) => (
              <div key={index} style={{ display: 'flex', fontFamily: 'SuezHe, SuezLatin', fontSize: titleSize, lineHeight: 1.18, color: '#f7f1e6' }}>
                {line}
              </div>
            ))}
          </div>
          {subtitle ? <div style={{ display: 'flex', marginTop: 18, fontSize: 30, fontWeight: 700, color: 'rgba(247,241,230,0.72)' }}>{show(subtitle)}</div> : null}
          <div
            style={{
              display: 'flex',
              marginTop: 36,
              padding: '10px 26px',
              borderRadius: 999,
              backgroundColor: '#cfa669',
              color: '#140508',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {show(badge)}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );

  const jpeg = await sharp(Buffer.from(await image.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  });
}
