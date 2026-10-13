import { localizeMetadata } from '@/lib/seo';

import { localizeNode } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { publicMetadata } from '@/lib/seo';

export async function generateMetadata() { return localizeMetadata(await (publicMetadata("Livraison, paiement et stockage : vos questions | Bren-nholz", "Consultez les réponses sur le paiement par virement, la livraison en Allemagne, le déchargement des palettes et le stockage des combustibles bois.", "/faq"))); }

import Link from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import FaqSection from '@/components/FaqSection';
import { supportCopy } from '@/lib/support-copy';

export default function FaqPage() {
  const brenLocale = useLocale() as Locale;

  return localizeNode((
    <main className="bg-[#F4F0E5] min-h-screen text-[#1c1917]">
      {/* Header in Terracotta (#A54829) */}
      <section className="bg-[#A54829] py-16 text-white sm:py-20 shadow-md">
        <div className="container max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-[#F4F0E5]">Aide & informations</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-white sm:text-5xl">Questions fréquentes</h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[#F4F0E5]/90">Retrouvez les informations essentielles sur nos combustibles, les commandes et la livraison en Allemagne.</p>
          <Link href="/produits" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#123524] px-6 py-3.5 font-bold text-white transition hover:bg-[#1b4d35] shadow-md">Voir les produits <ArrowRight size={18}/></Link>
        </div>
      </section>
      <FaqSection />
      <section className="container py-16 text-center sm:py-20">
        <h2 className="font-serif text-3xl font-bold text-[#123524]">Vous ne trouvez pas votre réponse ?</h2>
        <p className="mx-auto mt-3 max-w-xl leading-relaxed text-[#57534e]">Décrivez votre besoin et indiquez votre code postal ; nous pourrons préciser les modalités de votre demande.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-[#123524] px-6 py-3.5 font-bold text-white transition hover:bg-[#1b4d35] shadow-md">
            <span>Contacter notre équipe</span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/aide" className="inline-flex items-center gap-2 rounded-full border border-[#E7E0D3] bg-white px-6 py-3.5 font-bold text-[#1c1917] hover:bg-[#F4F0E5] transition">
            {supportCopy[brenLocale].help}
          </Link>
        </div>
      </section>
    </main>
  ), brenLocale);
}
