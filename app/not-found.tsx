
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container min-h-[60vh] py-20 text-center">
      <p className="font-bold text-amber-700">404</p>
      <h1 className="mt-3 text-3xl font-black">Seite nicht gefunden</h1>
      <p className="mt-4 text-gray-600">Die angeforderte Seite existiert leider nicht.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className="rounded-full bg-amber-700 px-6 py-3 font-bold text-white hover:bg-amber-800 transition">
          Zur Startseite
        </Link>
        <Link href="/produits" className="rounded-full border border-stone-300 px-6 py-3 font-bold hover:bg-stone-50 transition">
          Unsere Produkte
        </Link>
      </div>
    </main>
  );
}

