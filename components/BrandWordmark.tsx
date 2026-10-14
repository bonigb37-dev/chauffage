import { storeConfig } from '@/lib/store-config';

export default function BrandWordmark({ hyphenClass = 'text-orange-500' }: { hyphenClass?: string }) {
  return <span data-original-content className="inline-flex flex-col items-start leading-tight">
    <span>Brennholz<span className={hyphenClass}>-</span>direk</span>
    <span className="mt-0.5 text-[11px] font-semibold tracking-[.08em] opacity-80">{storeConfig.brandSubtitle}</span>
  </span>;
}
