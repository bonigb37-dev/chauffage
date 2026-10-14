import { cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import de from '@/translations/de.json';
import { localizedPath, type Locale } from './routing';

const dictionaries: Record<string, Record<string, string>> = { de };
const phrases = Object.fromEntries(Object.entries(dictionaries).map(([locale, dictionary]) => [locale, Object.entries(dictionary).filter(([source]) => source.length >= 12).sort((a, b) => b[0].length - a[0].length)]));
export function translate(text: string, locale: Locale): string {
  if (!text || typeof text !== 'string' || !text.trim()) return text ?? '';
  locale = 'de';
  const clean = text.replace(/\s+/g, ' ').trim();
  const translation = Object.hasOwn(dictionaries[locale], clean) ? dictionaries[locale][clean] : undefined;
  if (translation !== undefined) return (text.match(/^\s*/)?.[0] ?? '') + translation + (text.match(/\s*$/)?.[0] ?? '');
  // These templates contain product names or counts, rather than whole dictionary keys.
  const productLabels: [RegExp, (name: string) => string][] = [
    [/^Ajouter (.+) aux favoris$/, name => `${name} zu den Favoriten hinzufügen`],
    [/^Retirer (.+) des favoris$/, name => `${name} aus den Favoriten entfernen`],
    [/^Ajouter (.+) au panier$/, name => `${name} in den Warenkorb legen`],
    [/^Diminuer la quantité de (.+)$/, name => `Menge für ${name} verringern`],
    [/^Augmenter la quantité de (.+)$/, name => `Menge für ${name} erhöhen`],
  ];
  for (const [pattern, format] of productLabels) {
    const match = clean.match(pattern);
    if (match) return format(translate(match[1], 'de'));
  }
  const photo = clean.match(/^(.+) — photo (\d+)$/);
  if (photo) return `${translate(photo[1], 'de')} — Foto ${photo[2]}`;
  const cart = clean.match(/^Mon panier \((\d+)\)(.*)$/);
  if (cart) return `Mein Warenkorb (${cart[1]})${cart[2]}`;
  const stock = clean.match(/^En stock · (\d+) unité(?:s)? disponible(?:s)?$/);
  if (stock) return `Auf Lager · ${stock[1]} ${stock[1] === '1' ? 'Einheit verfügbar' : 'Einheiten verfügbar'}`;
  // Account identifiers are customer data and must be preserved verbatim.
  const account = text.match(/^(\s*)Compte client · ([\s\S]+)$/);
  if (account) return `${account[1]}Kundenkonto · ${account[2]}`;
  // Template strings combine fixed copy with quantities, references or names.
  // Replace reviewed phrases only; never infer translations for customer data.
  let composed = text;
  const list = phrases[locale] ?? phrases['de'] ?? [];
  for (const [source, target] of list) {
    if (source.length >= 12 && composed.includes(source)) composed = composed.replaceAll(source, target);
  }
  if (composed !== text) return composed;
  return text;
}

const copyProps = new Set(['title', 'description', 'label', 'placeholder', 'alt', 'aria-label']);
// Localize React output before rendering, on both the server and the client.
// Product IDs, form values, event handlers, prices and customer records stay intact.
export function localizeNode(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === 'string') return translate(node, locale);
  if (Array.isArray(node)) return node.map((child, i) => {
    const localized = localizeNode(child, locale);
    if (isValidElement(localized) && (child as ReactElement).key != null) {
      return cloneElement(localized as ReactElement<Record<string, unknown>>, { key: (child as ReactElement).key });
    }
    if (isValidElement(localized) && (localized as ReactElement).key == null) {
      return cloneElement(localized as ReactElement<Record<string, unknown>>, { key: i });
    }
    return localized;
  });
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props['data-original-content']) return node;
  const props: Record<string, unknown> = {};
  if (element.key != null) props.key = element.key;
  for (const [name, value] of Object.entries(element.props)) {
    if (copyProps.has(name) && typeof value === 'string') props[name] = translate(value, locale);
    if (name === 'href' && typeof value === 'string') props[name] = localizedPath(value, locale);
  }
  if ('children' in element.props) props.children = localizeNode(element.props.children as ReactNode, locale);
  return cloneElement(element, props);
}
