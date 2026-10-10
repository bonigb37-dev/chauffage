import type { Locale } from '@/i18n/routing';

const labels = {
  de: ['Widerruf', 'Empfangsbestätigung', 'Eingegangen am', 'Name', 'E-Mail', 'Vertrag oder Artikel', 'Erklärung', 'Hiermit widerrufe ich den oben genannten Vertrag oder den Kauf der oben genannten Artikel.', 'Kontakt', 'Bestätigung Ihres Widerrufs'],
  fr: ['Rétractation', 'Accusé de réception', 'Reçue le', 'Nom', 'E-mail', 'Contrat ou articles', 'Déclaration', 'Je me rétracte du contrat ou des articles identifiés ci-dessus.', 'Contact', 'Confirmation de votre rétractation'],
  en: ['Withdrawal', 'Acknowledgement of receipt', 'Received on', 'Name', 'Email', 'Contract or items', 'Declaration', 'I hereby withdraw from the contract or purchase of the items identified above.', 'Contact', 'Confirmation of your withdrawal'],
};
export function withdrawalCopy(locale: Locale) { return labels[locale]; }
