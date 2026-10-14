import type { Locale } from '@/i18n/routing';

const labels = {
  de: ['Widerruf', 'Empfangsbestätigung', 'Eingegangen am', 'Name', 'E-Mail', 'Vertrag ou Artikel', 'Erklärung', 'Hiermit widerrufe ich den oben genannten Vertrag oder den Kauf der oben genannten Artikel.', 'Kontakt', 'Bestätigung Ihres Widerrufs'],
};

export function withdrawalCopy(locale: Locale) {
  return labels.de;
}
