import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import de from '@/translations/de.json';
import { localizedPath, type Locale } from './routing';

const dictionary: Record<string, string> = de;
const phrases = Object.entries(dictionary)
  .filter(([source]) => source.length >= 12)
  .sort((a, b) => b[0].length - a[0].length);

export function translate(text: string, _locale: Locale): string {
  if (!text.trim()) return text;
  const clean = text.replace(/\s+/g, ' ').trim();
  const translation = Object.hasOwn(dictionary, clean) ? dictionary[clean] : undefined;
  if (translation !== undefined) return (text.match(/^\s*/)?.[0] ?? '') + translation + (text.match(/\s*$/)?.[0] ?? '');
  // Template strings: replace reviewed phrases only, never customer data.
  let composed = text;
  for (const [source, target] of phrases) {
    if (composed.includes(source)) composed = composed.replaceAll(source, target);
  }
  if (composed !== text) return composed;
  return text;
}

const copyProps = new Set(['title', 'description', 'label', 'placeholder', 'alt', 'aria-label']);

// Localize React output before rendering, on both the server and the client.
// Product IDs, form values, event handlers, prices and customer records stay intact.
export function localizeNode(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === 'string') return translate(node, locale);
  if (Array.isArray(node)) {
    return Children.map(node, (child) => localizeNode(child, locale));
  }
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props['data-original-content']) return node;
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(element.props)) {
    if (copyProps.has(name) && typeof value === 'string') props[name] = translate(value, locale);
    if (name === 'href' && typeof value === 'string') props[name] = localizedPath(value, locale);
  }
  if ('children' in element.props) {
    const raw = element.props.children;
    if (typeof raw === 'string') {
      props.children = translate(raw, locale);
    } else if (Array.isArray(raw)) {
      props.children = Children.map(raw, (child) => localizeNode(child, locale));
    } else {
      props.children = localizeNode(raw as ReactNode, locale);
    }
  }
  return cloneElement(element, props);
}
