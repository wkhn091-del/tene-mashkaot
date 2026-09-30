import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EventForm } from '@/components/events/EventForm';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { alternatesFor } from '@/lib/seo';
import { STORE_PHOTOS } from '@/lib/store-photos';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'events' });
  return { title: t('title'), description: t('subtitle'), alternates: alternatesFor(locale, '/events') };
}

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'events' });
  const lang = locale === 'en' ? 'en' : 'he';

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
        <EventForm />
        <Reveal className="hidden lg:block">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-card)] border border-gold-400/20">
            <Image src={STORE_PHOTOS.wineryFair.src} alt={STORE_PHOTOS.wineryFair.alt[lang]} fill sizes="20rem" className="object-cover" />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
