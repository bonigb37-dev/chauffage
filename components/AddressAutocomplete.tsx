'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Suggestion = { label: string; street: string; postalCode: string; city: string; hasHouseNumber: boolean };

export default function AddressAutocomplete({ name, postalCodeName, cityName, inputClass }: {
  name: string; postalCodeName: string; cityName: string; inputClass: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedStreet, setSelectedStreet] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (query.trim().length < 4 || query === selectedStreet || !open) { setLoading(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/address-suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) return;
        setSuggestions(data.suggestions ?? []);
        setActiveIndex(-1);
        setStatus(data.unavailable || !response.ok ? 'Suggestions indisponibles. Saisissez votre adresse manuellement.' : data.suggestions?.length ? '' : 'Aucune adresse trouvée. Ajoutez la ville ou saisissez votre adresse manuellement.');
      } catch {
        if (!controller.signal.aborted) { setSuggestions([]); setStatus('Suggestions indisponibles. Saisissez votre adresse manuellement.'); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, selectedStreet, open]);

  function select(suggestion: Suggestion) {
    const form = input.current?.form;
    for (const [fieldName, value] of [[postalCodeName, suggestion.postalCode], [cityName, suggestion.city]]) {
      const field = form?.elements.namedItem(fieldName);
      if (field instanceof HTMLInputElement) {
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    setQuery(suggestion.street);
    setSelectedStreet(suggestion.street);
    setSuggestions([]);
    setOpen(false);
    setStatus(suggestion.hasHouseNumber ? 'Adresse sélectionnée. Vérifiez la ville et le code postal.' : 'Ajoutez votre numéro de maison et vérifiez la ville et le code postal.');
    input.current?.focus();
  }

  return <div className="relative sm:col-span-2">
    <label htmlFor={id} className="text-sm font-semibold text-gray-700">Rue et numéro *</label>
    <input ref={input} id={id} name={name} required maxLength={180} autoComplete="off" value={query} placeholder="Commencez à saisir la rue et la ville" className={inputClass} role="combobox" aria-autocomplete="list" aria-expanded={open && suggestions.length > 0} aria-controls={`${id}-suggestions`} aria-describedby={`${id}-status`} aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
      onChange={(event) => { setQuery(event.target.value); setSuggestions([]); setActiveIndex(-1); setOpen(true); setStatus(''); }}
      onFocus={() => { if (query !== selectedStreet) setOpen(true); }}
      onBlur={(event) => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { setOpen(false); return; }
        if (!open || !suggestions.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((current) => event.key === 'ArrowDown' ? (current + 1) % suggestions.length : (current <= 0 ? suggestions.length - 1 : current - 1)); }
        if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); select(suggestions[activeIndex]); }
      }} />
    {open && suggestions.length > 0 && <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
      <ul id={`${id}-suggestions`} role="listbox" aria-label="Adresses en Allemagne" className="max-h-64 overflow-y-auto">
        {suggestions.map((suggestion, index) => <li key={`${suggestion.label}-${index}`} id={`${id}-option-${index}`} role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onClick={() => select(suggestion)} className={`cursor-pointer px-4 py-3 text-sm text-gray-800 hover:bg-orange-50 ${index === activeIndex ? 'bg-orange-50' : ''}`}>{suggestion.label}</li>)}
      </ul>
      <p className="border-t px-4 py-2 text-xs text-gray-500"><a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a></p>
    </div>}
    <p id={`${id}-status`} role="status" className="mt-1 text-xs text-gray-500">{loading ? 'Recherche d’adresses…' : status || 'Choisissez une suggestion pour remplir la ville et le code postal.'}</p>
  </div>;
}
