'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container min-h-[60vh] py-20 text-center">
      <p className="font-bold text-orange-700">Ein Fehler ist aufgetreten</p>
      <h1 className="mt-3 text-3xl font-black">Diese Seite konnte nicht geladen werden.</h1>
      <p className="mt-4 text-gray-600">Bitte versuchen Sie es erneut oder kehren Sie zur Startseite zurück.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button type="button" onClick={reset} className="rounded-full bg-orange-700 px-6 py-3 font-bold text-white">Erneut versuchen</button>
        <a href="/de" className="rounded-full border border-stone-300 px-6 py-3 font-bold">Zur Startseite</a>
        <a href="/de/contact" className="rounded-full border border-stone-300 px-6 py-3 font-bold">Kontakt aufnehmen</a>
      </div>
    </main>
  );
}
