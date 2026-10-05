import Link from 'next/link';

const commitments = [
  {
    number: '01',
    title: 'Une qualité suivie de près',
    description: 'Nous visitons régulièrement nos fabricants afin de contrôler la qualité de nos combustibles et d’identifier des alternatives fiables et accessibles.',
  },
  {
    number: '02',
    title: 'Un service attentif',
    description: 'De la découverte de nos produits jusqu’à leur livraison, nous veillons à vous accompagner avec sérieux et disponibilité.',
  },
  {
    number: '03',
    title: 'Votre satisfaction avant tout',
    description: 'Votre satisfaction est au cœur de nos engagements. Pour toute question ou réclamation, nous vous invitons à nous contacter directement.',
  },
];

export default function About() {
  return (
    <main>
      <section className="bg-gray-950 py-24 text-white">
        <div className="container max-w-4xl">
          <p className="font-bold uppercase tracking-[.2em] text-orange-400">À propos</p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">La qualité et le service, au cœur de nos engagements.</h1>
          <div className="mt-7 space-y-5 text-lg leading-8 text-gray-300">
            <p>Nous vous souhaitons la bienvenue et sommes heureux de votre visite sur notre site. La qualité de nos combustibles et l’attention portée à notre clientèle, de la découverte de nos produits jusqu’à leur livraison, sont au centre de nos priorités.</p>
            <p>Nous nous rendons régulièrement chez nos fabricants afin de contrôler personnellement la qualité de nos produits et de rechercher des alternatives performantes à des prix accessibles.</p>
            <p>La satisfaction de nos clients est essentielle et nous nous engageons à la préserver. Pour toute question ou réclamation, nous vous invitons à nous contacter directement. Nous vous souhaitons une agréable visite sur notre site.</p>
          </div>
          <Link href="/contact" className="mt-8 inline-flex rounded-full bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600">Nous contacter</Link>
        </div>
      </section>
      <section className="container grid gap-8 py-20 md:grid-cols-3">
        {commitments.map((item) => (
          <article key={item.number} className="rounded-3xl bg-gray-50 p-8">
            <b className="text-4xl text-orange-600">{item.number}</b>
            <h2 className="mt-6 text-xl font-black">{item.title}</h2>
            <p className="mt-3 leading-7 text-gray-600">{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
