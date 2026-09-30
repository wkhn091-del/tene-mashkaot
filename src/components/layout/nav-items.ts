export const NAV_ITEMS = [
  { key: 'home', href: '/' },
  { key: 'shop', href: '/shop' },
  { key: 'gifts', href: '/shop/gift-baskets' },
  { key: 'events', href: '/events' },
  { key: 'visit', href: '/visit' },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]['key'];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/shop') return pathname === '/shop' || (pathname.startsWith('/shop/') && !pathname.startsWith('/shop/gift-baskets')) || pathname.startsWith('/product/');
  return pathname === href || pathname.startsWith(`${href}/`);
}
