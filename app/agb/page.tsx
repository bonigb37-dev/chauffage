import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions de vente — Bren-nholz',
};

const articles = [
  { title: 'Champ d’application et modification des conditions générales de vente', paragraphs: [
    'Les présentes conditions générales de vente s’appliquent à toutes les commandes passées sur le Site.',
    'La Société se réserve la possibilité d’adapter ou de modifier à tout moment les présentes conditions. En cas de modification, les conditions générales de vente en vigueur au jour de la commande seront appliquées à celle-ci et jointes au format PDF à la confirmation de commande du Client.',
  ] },
  { title: 'Disponibilité des produits', paragraphs: [
    'Nos offres sont valables tant qu’elles sont visibles sur le Site durant toute l’année en cours, dans la limite des stocks disponibles.',
    'Dans l’hypothèse où, postérieurement à votre commande, un produit ou une prestation deviendrait totalement ou partiellement indisponible, la Société vous informera par e-mail et/ou téléphone et vous donnera la possibilité d’obtenir un produit similaire à un prix similaire ou de bénéficier d’un remboursement.',
    'Il vous est possible de commander un article qui n’est plus en stock, les délais de réapprovisionnement étant indiqués sur la fiche du produit. Dans le cas où le réapprovisionnement dépasserait 29 jours à compter de la validation de la commande, nous nous engageons à vous proposer un produit similaire à un prix similaire ou à vous rembourser.',
    'Si vous avez choisi d’être remboursé, le remboursement s’effectuera via le mode de paiement sélectionné à la commande, dans un délai maximal de 14 jours à compter de la demande.',
  ] },
  { title: 'Validation des commandes', paragraphs: [
    'Pour passer commande, le Client suit les différentes étapes proposées sur le Site :',
    '1. Sélectionner le ou les articles choisis en cliquant sur « Ajouter au panier ».\n2. S’identifier dans la rubrique « Coordonnées » et, pour la première fois, créer un compte.\n3. Choisir les modalités et conditions de Click and Collect ou de livraison.\n4. Confirmer avoir pris connaissance des délais de livraison en cochant la case correspondante pour passer à l’étape suivante.',
    'Le récapitulatif de votre commande apparaît à l’écran. Avant de valider votre commande, vous devez vérifier ses éléments, y compris son prix total, et, le cas échéant, identifier et corriger les erreurs. Vous devez ensuite confirmer avoir lu les conditions générales de vente et les accepter sans réserve en cochant la case correspondante.',
    'Vous êtes informé de votre droit de rétractation, puis vous devez valider votre commande en cliquant sur « Je confirme ma commande et reconnais que cette dernière nécessite une obligation de paiement ». Cette confirmation de commande vous engage et constitue une acceptation irrévocable et sans réserve de votre commande avec obligation de paiement.',
    'Le règlement de votre commande s’effectue par virement bancaire, selon les modalités communiquées par la Société.',
    'Nous vous adressons un e-mail de confirmation de réception de votre commande dans les plus brefs délais.',
  ] },
  { title: 'Prix', paragraphs: [
    'Les prix s’entendent en euros, toutes taxes comprises et éco-participation comprise si applicable. Le montant de l’éco-participation figure dans la description du produit.',
    'À chaque commande viennent s’ajouter les frais de port définis à l’article 6. Un simulateur de frais de port vous est proposé dans le panier avant inscription sur le Site.',
    'Les soldes : certains produits peuvent être en solde durant les périodes légales. Le tarif soldé apparaît dans la fiche produit en dessous du prix d’origine barré.',
    'Les promotions : certains produits peuvent être en promotion sur une période donnée. Le tarif promotionnel est indiqué dans la fiche produit en dessous de l’ancien prix barré. La période de promotion est indiquée en dessous du prix.',
  ] },
  { title: 'Modalités de paiement et sécurisation', paragraphs: [
    'Le paiement des commandes s’effectue exclusivement par virement bancaire. Les coordonnées bancaires et le montant définitif, frais de livraison compris, vous sont communiqués par la Société après vérification de votre demande de commande.',
    '5.1 — Paiement par virement bancaire',
    'Le Client effectue le virement depuis sa banque vers le compte indiqué par la Société, en précisant la référence de commande. Aucun paiement n’est prélevé directement sur le Site. Le Client doit attendre la confirmation du montant définitif et des coordonnées bancaires avant d’effectuer le virement. Le paiement est confirmé après vérification de la réception des fonds par la Société.',
    'Clause de réserve de propriété : les produits demeurent la propriété de la Société jusqu’à encaissement complet du montant de la commande.',
  ] },
  { title: 'Click and Collect et livraison', paragraphs: [
    '6.1 — La livraison',
    'La Société livre ses produits dans tous les pays listés sur le Site. La livraison se fait à l’adresse spécifiée par le Client lors du passage de sa commande.',
    'Dans le cas où l’adresse de livraison indiquée serait incorrecte ou incomplète, la Société sera en droit de réclamer le paiement de nouveaux frais de livraison.',
    '6.2 — Le suivi de commande',
    'Vous recevrez un e-mail vous indiquant le départ de votre colis depuis notre Site. Certains transporteurs peuvent également vous envoyer un e-mail indiquant le numéro de suivi de livraison et, éventuellement, une date prévisionnelle de livraison.',
    'Attention : en raison de la politique anti-spam de certains fournisseurs d’accès à Internet, ces e-mails peuvent arriver dans vos courriers indésirables.',
    'Vous pouvez à tout moment consulter l’avancement de la livraison depuis votre espace client.',
    '6.3 — Les frais de port',
    'La Société se réserve le droit de modifier les frais de port à tout moment en fonction des modifications tarifaires de ses transporteurs, mais s’engage à appliquer les tarifs en vigueur qui vous auront été indiqués au moment de votre commande.',
    'Les frais de port du produit consulté sont disponibles dans sa fiche et présentés par transporteur. Un estimatif global des frais de port en cas d’achat de plusieurs produits est disponible dans le panier, avant inscription sur le Site.',
    'Les frais de port peuvent être estimés avant toute création de compte client en ajoutant les produits au panier.',
    'Le Client peut alors refuser le colis contre remise d’un « relevé d’anomalie ou de spoliation » par le transporteur. Il informe la Société de tout incident (réserves, refus de colis) par téléphone ou par écrit dans les meilleurs délais.',
    'Cette procédure est indépendante de celle relative à la garantie légale de conformité mentionnée aux articles L217-3 à L217-14 du Code de la consommation et de celle relative aux défauts de la chose vendue dans les conditions prévues aux articles 1641 à 1648 et 2232 du Code civil.',
  ] },
];

export default function SalesTermsPage() {
  return <main className="min-h-[60vh] bg-stone-50 py-12 sm:py-16">
    <section className="container max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 sm:p-10">
      <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Bren-nholz</p>
      <h1 className="mt-3 text-3xl font-black leading-tight text-gray-950 sm:text-4xl">Conditions générales de vente</h1>
      <p className="mt-4 text-sm text-gray-500">Date de dernière modification : <time dateTime="2022-06-22">22 juin 2022</time></p>
      <nav aria-label="Sommaire des conditions de vente" className="mt-8 rounded-xl bg-stone-50 p-5"><h2 className="font-bold text-gray-950">Sommaire</h2><ol className="mt-3 space-y-2">{articles.map((article, index) => <li key={article.title}><a href={`#article-${index + 1}`} className="text-sm text-orange-700 underline-offset-4 hover:underline">Article {index + 1} — {article.title}</a></li>)}</ol></nav>
      <div className="mt-10 space-y-10">{articles.map((article, index) => <section id={`article-${index + 1}`} key={article.title} className="scroll-mt-40 border-t border-stone-200 pt-8"><h2 className="text-xl font-bold leading-snug text-gray-950 sm:text-2xl">Article {index + 1} — {article.title}</h2><div className="mt-5 space-y-4 leading-7 text-gray-700">{article.paragraphs.map((paragraph) => /^\d\.\d —/.test(paragraph) ? <h3 key={paragraph} className="pt-3 text-lg font-bold text-gray-950">{paragraph}</h3> : paragraph.startsWith('1. ') ? <ol key={paragraph} className="list-decimal space-y-2 pl-6">{paragraph.split('\n').map((step) => <li key={step}>{step.replace(/^\d\. /, '')}</li>)}</ol> : <p key={paragraph}>{paragraph}</p>)}</div></section>)}</div>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/contact" className="rounded-full bg-orange-600 px-6 py-3 font-bold text-white">Nous contacter</Link>
        <Link href="/commande" className="rounded-full border border-stone-300 px-6 py-3 font-bold text-gray-800">Retour au formulaire de commande</Link>
      </div>
    </section>
  </main>;
}
