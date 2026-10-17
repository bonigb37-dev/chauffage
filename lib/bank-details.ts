export type BankDetails = { recipient: string; iban: string; bic: string; bank: string };

const labels: Record<string, keyof BankDetails> = {
  beneficiary: 'recipient', beneficiaire: 'recipient', begunstigte: 'recipient', begunstigter: 'recipient',
  empfanger: 'recipient', kontoinhaber: 'recipient', titulaire: 'recipient', recipient: 'recipient', name: 'recipient',
  iban: 'iban', bic: 'bic', swift: 'bic', bank: 'bank', banque: 'bank', bankname: 'bank',
};

// The administration stores a labelled multiline text, including older French labels.
export function parseBankDetails(raw: string): BankDetails | null {
  const result: BankDetails = { recipient: '', iban: '', bic: '', bank: '' };
  const text = raw.replace(/\\n/g, '\n');
  const pattern = /(?:^|\n|\s)(Bénéficiaire|Beneficiaire|Begünstigte[r]?|Empfänger|Kontoinhaber|Titulaire|Beneficiary|Recipient|Name|IBAN|BIC(?:\s*\/\s*SWIFT)?|SWIFT|Bankname|Bank|Banque)\s*[:：]\s*/gi;
  const matches = [...text.matchAll(pattern)];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const label = match[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s*\/\s*swift$/, '');
    const field = labels[label];
    if (field) result[field] = text.slice(match.index! + match[0].length, matches[i + 1]?.index ?? text.length).split(/\r?\n/)[0].trim();
  }
  result.iban = result.iban.replace(/\s/g, '').toUpperCase();
  result.bic = result.bic.replace(/\s/g, '').toUpperCase();
  if (!result.recipient || !/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(result.iban)) return null;
  return result;
}
