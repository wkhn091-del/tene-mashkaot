import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/react';

function safeHref(href: unknown): string | null {
  if (typeof href !== 'string') return null;
  const value = href.trim();
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return /^(https?:|mailto:|tel:)/i.test(value) ? value : null;
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    normal: ({ children }) => <p>{children}</p>,
    blockquote: ({ children }) => <blockquote className="border-s-2 border-gold-400/60 ps-4 text-cream/80">{children}</blockquote>,
  },
  marks: {
    link: ({ value, children }) => {
      const href = safeHref((value as { href?: unknown } | undefined)?.href);
      if (!href) return <>{children}</>;
      const external = /^https?:/i.test(href);
      return (
        <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {children}
        </a>
      );
    },
  },
};

export function RichText({ value, className }: { value: PortableTextBlock[]; className?: string }) {
  if (!value?.length) return null;
  return (
    <div className={className ?? 'prose-tene'}>
      <PortableText value={value} components={components} />
    </div>
  );
}
