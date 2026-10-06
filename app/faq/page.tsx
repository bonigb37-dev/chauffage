import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import FaqSection from '@/components/FaqSection';

export default function FaqPage() {
  return (
    <main>
      <section className="bg-gray-950 py-20 text-white sm:py-24">
        <div className="container max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-orange-400">Aide & informations</p>
          <h1 className="mt-4 font-serif text-4xl font-bold sm:text-6xl">Questions fréquentes</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">Retrouvez les informations essentielles sur nos combustibles, les commandes et la livraison en Allemagne.</p>
          <Link href="/produits" className="mt-7 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600">Voir les produits <ArrowRight size={18}/></Link>
        </div>
      </section>
      <FaqSection />
      <section className="container py-16 text-center sm:py-20">
        <h2 className="font-serif text-3xl font-bold">Vous ne trouvez pas votre réponse ?</h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">Décrivez votre besoin et indiquez votre code postal ; nous pourrons préciser les modalités de votre demande.</p>
        <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-950 px-6 py-3 font-bold text-white transition hover:bg-orange-600" style={{ color: '#ffffff' }}>
          <span style={{ color: '#ffffff' }}>Contacter notre équipe</span>
          <ArrowRight size={18} style={{ color: '#ffffff' }} />
        </Link>
      </section>
    </main>
  );
}
