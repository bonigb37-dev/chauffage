export default function AccountLoading() {
  return <main aria-busy="true" className="grid min-h-[70vh] place-items-center bg-[#FDFBF7] px-4">
    <div role="status" className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-6 py-5 text-sm font-semibold text-stone-700 shadow-sm">
      <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-[#A33D1E] motion-reduce:animate-none" />
      Ihr Kundenbereich wird geladen …
    </div>
  </main>;
}
