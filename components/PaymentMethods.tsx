const methods = [
  { name: 'Visa', className: 'font-black italic tracking-tight text-[#1a1f71]' },
  { name: 'mastercard', className: 'font-bold lowercase tracking-tight text-[#252525]' },
  { name: 'Apple Pay', className: 'font-semibold tracking-tight text-gray-900' },
  { name: 'Google Pay', className: 'font-semibold tracking-tight text-gray-700' },
  { name: 'PayPal', className: 'font-bold italic text-[#003087]' },
  { name: 'Virement', className: 'font-semibold text-gray-700' },
];

export default function PaymentMethods({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? '' : 'mt-5 border-t border-stone-200 pt-5'}>
      <p className="text-xs font-bold uppercase tracking-[.12em] text-gray-500">
        Moyens proposés par Mollie
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Moyens de paiement susceptibles d’être proposés">
        {methods.map((method) => (
          <li key={method.name} className={`rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs ${method.className}`}>
            {method.name}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-5 text-gray-500">
        Disponibilité selon l’appareil, le pays du client et les moyens activés sur le compte marchand. Le paiement s’effectue sur la page sécurisée de Mollie.
      </p>
    </div>
  );
}
