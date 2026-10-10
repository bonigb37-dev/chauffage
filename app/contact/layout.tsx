import { localizeMetadata } from '@/lib/seo';
import { publicMetadata } from '@/lib/seo';
export async function generateMetadata() { return localizeMetadata(await (publicMetadata('Contact et informations sur vos commandes | Bren-nholz', 'Contactez Bren-nholz pour une question sur les combustibles bois, une commande ou les conditions de livraison en Allemagne.', '/contact'))); }
export default function ContactLayout({ children }: { children: React.ReactNode }) { return children; }
