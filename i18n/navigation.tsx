'use client';
import NextLink from 'next/link';
import { usePathname as useNextPathname, useRouter as useNextRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMemo, type ComponentProps } from 'react';
import { localizedPath, stripLocale, type Locale } from './routing';

export default function Link(props: ComponentProps<typeof NextLink>) {
  const locale = useLocale() as Locale;
  const href = typeof props.href === 'string' ? localizedPath(props.href, locale) : {
    ...props.href, pathname: props.href.pathname ? localizedPath(props.href.pathname, locale) : props.href.pathname,
  };
  return <NextLink {...props} href={href} />;
}
export function usePathname() { return stripLocale(useNextPathname()); }
export function useRouter() {
  const router = useNextRouter();
  const locale = useLocale() as Locale;
  return useMemo(() => ({ ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(localizedPath(href, locale), options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(localizedPath(href, locale), options),
    prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) => router.prefetch(localizedPath(href, locale), options),
  }), [router, locale]);
}
