import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RichText } from '@/components/ui/RichText';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Link } from '@/i18n/navigation';
import type { PortableTextBlock } from '@portabletext/react';
import { fillTokens, LEGAL_CONTENT, LEGAL_SLUG_LIST, type LegalSlug, type LegalTokens } from '@/content/legal';
import { getLegalPage, getSiteSettings } from '@/lib/data';
import { CC_BY_4_URL, MODEL_SOURCES } from '@/lib/defaults';
import { localize, localizeBlock } from '@/lib/i18n-utils';
import { legalTokens } from '@/lib/legal-tokens';
import { alternatesFor } from '@/lib/seo';
import { formatDate } from '@/lib/time-format';

type Params = Promise<{ locale: string; slug: string }>;

/** Replaces {tokens} inside Portable Text spans so CMS texts stay in sync with Site Settings. */
function fillBlockTokens(blocks: PortableTextBlock[], tokens: LegalTokens): PortableTextBlock[] {
  return blocks.map((block) =>
    Array.isArray(block.children)
      ? {
          ...block,
          children: block.children.map((child) =>
            typeof (child as { text?: unknown }).text === 'string'
              ? { ...child, text: fillTokens((child as { text: string }).text, tokens) }
              : child,
          ),
        }
      : block,
  );
}

function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUG_LIST as readonly string[]).includes(slug);
}

export function generateStaticParams() {
  return LEGAL_SLUG_LIST.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLegalSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t(slug), alternates: alternatesFor(locale, `/legal/${slug}`) };
}

export default async function LegalPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!isLegalSlug(slug)) notFound();

  const [t, tFooter, cms, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'legal' }),
    getTranslations({ locale, namespace: 'footer' }),
    getLegalPage(slug),
    getSiteSettings(),
  ]);
  const lang = locale === 'en' ? 'en' : 'he';
  const fallback = LEGAL_CONTENT[lang][slug];
  const tokens = legalTokens(settings, locale);
  const cmsBody = fillBlockTokens(localizeBlock(cms?.body, locale), tokens);
  const title = localize(cms?.title, locale) || fallback.title;
  const updatedAt = cms?.updatedAt || fallback.updatedAt;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <SectionHeading as="h1" title={title} subtitle={t('updated', { date: formatDate(updatedAt, locale) })} />

      {cmsBody.length > 0 ? (
        <RichText value={cmsBody} />
      ) : (
        <div className="prose-tene">
          {fallback.sections.map((section, index) => (
            <section key={index}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.paragraphs?.map((p, i) => <p key={i}>{fillTokens(p, tokens)}</p>)}
              {section.list && (
                <ul>
                  {section.list.map((item, i) => (
                    <li key={i}>{fillTokens(item, tokens)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {slug === 'terms' && (
        <div className="mt-10 space-y-1 text-xs text-cream/55">
          <p>
            {tFooter('modelCreditIntro')}{' '}
            <a href={CC_BY_4_URL} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-2 hover:text-gold-200">
              CC BY 4.0
            </a>
            :
          </p>
          <ul className="list-inside list-disc">
            {MODEL_SOURCES.map((model) => (
              <li key={model.url} dir="ltr" className="text-start">
                <a href={model.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gold-200">
                  &ldquo;{model.title}&rdquo;
                </a>{' '}
                by{' '}
                <a href={model.authorUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gold-200">
                  {model.author}
                </a>
              </li>
            ))}
          </ul>
          {settings.modelCredit && <p>{settings.modelCredit}</p>}
        </div>
      )}

      <nav aria-label={t('more')} className="mt-14 border-t border-gold-400/15 pt-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LEGAL_SLUG_LIST.filter((s) => s !== slug).map((s) => (
            <li key={s}>
              <Link href={`/legal/${s}`} className="text-gold-300 underline-offset-4 hover:underline">
                {t(s)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
