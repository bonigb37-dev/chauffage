import { cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import de from '@/translations/de.json';
import en from '@/translations/en.json';
import { localizedPath, type Locale } from './routing';

const dictionaries: Record<string, Record<string, string>> = { de, en };
const phrases = Object.fromEntries(Object.entries(dictionaries).map(([locale, dictionary]) => [locale, Object.entries(dictionary).filter(([source]) => source.length >= 12).sort((a, b) => b[0].length - a[0].length)]));
export function translate(text: string, locale: Locale): string {
  if (locale === 'fr' || !text.trim()) return text;
  const clean = text.replace(/\s+/g, ' ').trim();
  const translation = Object.hasOwn(dictionaries[locale], clean) ? dictionaries[locale][clean] : undefined;
  if (translation !== undefined) return (text.match(/^\s*/)?.[0] ?? '') + translation + (text.match(/\s*$/)?.[0] ?? '');
  // Template strings combine fixed copy with quantities, references or names.
  // Replace reviewed phrases only; never infer translations for customer data.
  let composed = text;
  for (const [source, target] of phrases[locale]) {
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
  if (Array.isArray(node)) return node.map(child => localizeNode(child, locale));
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props['data-original-content']) return node;
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(element.props)) {
    if (copyProps.has(name) && typeof value === 'string') props[name] = translate(value, locale);
    if (name === 'href' && typeof value === 'string') props[name] = localizedPath(value, locale);
  }
  if ('children' in element.props) props.children = localizeNode(element.props.children as ReactNode, locale);
  return cloneElement(element, props);
}
