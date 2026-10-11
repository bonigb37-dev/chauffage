'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { supabase } from '@/lib/supabase';
import { supportCopy, supportStatusCopy, supportContactCopy } from '@/lib/support-copy';
import { RefreshCw, LoaderCircle } from 'lucide-react';
import { useVerifiedAccess } from './AccessContext';

type Message = { id: string; user_id: string; body: string; locale: Locale; sender_kind: 'customer' | 'admin'; created_at: string; customer_name?: string | null; attachment_name?: string | null; attachment_size?: number | null };
type Thread = Omit<Message, 'id'> & { unread?: number };
export default function SupportMessenger({ admin = false }: { admin?: boolean }) {
  const access = useVerifiedAccess();
  const locale = useLocale() as Locale;
  const copy = supportCopy[locale];
  const allowed = access.verified && !!access.user && (!admin || !!access.role);
  // Remount on account changes so messages cannot linger after logout/switch.
  if (!access.verified) return <p className="py-8 text-gray-600">{copy.loading}</p>;
  if (!allowed) return <section className="rounded-2xl border border-stone-200 bg-white p-6"><p>{copy.signin}</p><div className="mt-4 flex flex-wrap gap-4"><Link href="/compte" className="font-bold text-orange-700 underline">{copy.login}</Link><Link href="/contact" className="text-orange-700 underline">{copy.contact}</Link></div></section>;
  return <Messages key={`${access.user!.id}:${admin}`} admin={admin} locale={locale} />;
}
function Messages({ admin, locale }: { admin: boolean; locale: Locale }) {
  const copy = supportCopy[locale];
  const { user } = useVerifiedAccess();
  const metadata = user?.user_metadata;
  const ownName = (typeof metadata?.full_name === 'string' ? metadata.full_name : [metadata?.first_name, metadata?.last_name].filter(value => typeof value === 'string').join(' ')).trim().slice(0,160);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [target, setTarget] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const fileCopy = { de: ['Datei hinzufügen (PDF, JPG, PNG, WebP · max. 3 MB)', 'Datei entfernen', 'Herunterladen', 'Bitte wählen Sie eine PDF-, JPG-, PNG- oder WebP-Datei mit höchstens 3 MB.'], fr: ['Joindre un fichier (PDF, JPG, PNG, WebP · 3 Mo max.)', 'Retirer le fichier', 'Télécharger', 'Choisissez un fichier PDF, JPG, PNG ou WebP de 3 Mo maximum.'], en: ['Attach a file (PDF, JPG, PNG, WebP · max. 3 MB)', 'Remove file', 'Download', 'Choose a PDF, JPG, PNG or WebP file of up to 3 MB.'] }[locale];
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const previousLast = useRef('');
  const busy = useRef(false);
  const liveCopy = { de: ['Live-Verbindung aktiv', 'Automatische Aktualisierung aktiv'], fr: ['Connexion en direct active', 'Actualisation automatique active'], en: ['Live connection active', 'Automatic refresh active'] }[locale];
  const statusCopy = supportStatusCopy[locale];
  const errorText = (cause: unknown) => {
    const code = cause instanceof Error ? cause.message : 'unavailable';
    return code === 'attachment' ? fileCopy[3] : statusCopy[code as keyof typeof statusCopy] ?? statusCopy.unavailable;
  };
  const generation = useRef({ value: 0 });
  const live = useRef(true);
  const marked = useRef('');
  useEffect(() => { const counter = generation.current; live.current = true; return () => { live.current = false; counter.value++; }; }, []);
  const call = useCallback(async (query = '', payload?: object) => {
    if (!supabase) throw new Error('unavailable');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) throw new Error('signin');
    const multipart = payload instanceof FormData;
    const response = await fetch(`/api/support${query}`, { method: (payload as { action?: string })?.action === 'read' ? 'PATCH' : payload ? 'POST' : 'GET', headers: { Authorization: `Bearer ${data.session.access_token}`, ...(payload && !multipart ? { 'Content-Type': 'application/json' } : {}) }, ...(payload ? { body: multipart ? payload : JSON.stringify(payload) } : {}), cache: 'no-store', signal: AbortSignal.timeout(30000) });
    const result = await response.json(); if (!response.ok) throw new Error(response.status === 429 ? 'limit' : result.error); return result;
  }, []);
  useEffect(() => {
    const last = messages.at(-1);
    if (!last || loading || document.visibilityState !== 'visible' || marked.current === last.id) return;
    let active = true;
    void call('', { action: 'read', message_id: last.id, user_id: last.user_id }).then(() => {
      if (!active) return; marked.current = last.id;
      setThreads(rows => rows.map(row => row.user_id === last.user_id ? { ...row, unread: 0 } : row));
      window.dispatchEvent(new Event('bren-support-updated'));
    }).catch(() => { /* Message remains unread if acknowledgement fails. */ });
    return () => { active = false; };
  }, [messages, loading, call]);
  const load = useCallback(async (quiet = false) => {
    if (quiet && busy.current) return;
    const current = ++generation.current.value;
    busy.current = true;
    if (!quiet) setRefreshing(true);
    try {
      const inbox = admin ? await call('?inbox=1') : null;
      const conversation = !admin || target ? await call(target ? `?user_id=${encodeURIComponent(target)}` : '') : { messages: [] };
      if (!live.current || current !== generation.current.value) return;
      if (inbox) setThreads(inbox.threads);
      setMessages(rows => JSON.stringify(rows) === JSON.stringify(conversation.messages) ? rows : conversation.messages); setError('');
      return true;
    } catch (cause) { if (live.current && current === generation.current.value) setError(cause instanceof Error ? cause.message : 'unavailable'); return false; }
    finally { if (live.current && current === generation.current.value) { busy.current = false; setLoading(false); setRefreshing(false); } }
  }, [admin, target, call]);
  useEffect(() => { const counter = generation.current; setMessages([]); setBody(''); setFile(null); if (fileInput.current) fileInput.current.value = ''; setNotice(''); setLoading(true); follow.current = true; previousLast.current = ''; void load(); const refresh = () => { if (document.visibilityState === 'visible') void load(true); }; const timer = setInterval(refresh, 10000); document.addEventListener('visibilitychange', refresh); window.addEventListener('online', refresh); return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('online', refresh); counter.value++; }; }, [load]);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setConnected(false);
    const channel = supabase.channel(`support-chat-${crypto.randomUUID()}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, () => {
      // Refetch through the authorized server; never render websocket payloads.
      if (!active || document.visibilityState !== 'visible' || timer) return;
      timer = setTimeout(() => { timer = undefined; if (active) { void load(true); window.dispatchEvent(new Event('bren-support-updated')); } }, 500);
    }).subscribe(status => {
      if (!active) return;
      setConnected(status === 'SUBSCRIBED');
      if (status === 'SUBSCRIBED') void load(true);
    });
    return () => { active = false; clearTimeout(timer); void supabase!.removeChannel(channel); };
  }, [load]);
  useEffect(() => {
    const last = messages.at(-1)?.id;
    if (!last || last === previousLast.current) return;
    previousLast.current = last;
    if (follow.current && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [messages]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (sending || !body.trim()) return;
    setSending(true); setError(''); setNotice('');
    try {
      const language = admin ? threads.find(thread => thread.user_id === target)?.locale ?? locale : locale;
      if (file) {
        const form = new FormData(); form.set('body', body); form.set('locale', language); form.set('file', file); if (admin) form.set('user_id', target);
        await call('', form);
      } else await call('', { body, locale: language, ...(admin ? { user_id: target } : {}) });
      if (!live.current) return;
      follow.current = true; setBody(''); setFile(null); if (fileInput.current) fileInput.current.value = ''; setNotice(copy.sent); await load();
    } catch (cause) { if (live.current) setError(cause instanceof Error ? cause.message : 'unavailable'); }
    finally { if (live.current) setSending(false); }
  }
  async function download(message: Message) {
    if (downloading || !supabase) return;
    setDownloading(message.id); setError('');
    try {
      const { data } = await supabase.auth.getSession(); if (!data.session) throw new Error('signin');
      const response = await fetch(`/api/support?attachment=${encodeURIComponent(message.id)}`, { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store', signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(response.status === 403 ? 'forbidden' : 'unavailable');
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = message.attachment_name || 'attachment'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (cause) { if (live.current) setError(cause instanceof Error ? cause.message : 'unavailable'); }
    finally { if (live.current) setDownloading(''); }
  }
  return <section id={admin ? 'support-messages' : undefined} data-original-content className="mt-8 scroll-mt-32 rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">{admin ? copy.inbox : copy.title}</h2><button type="button" disabled={refreshing || sending} aria-busy={refreshing} onClick={async () => { setNotice(''); if (await load()) setNotice(statusCopy.refreshed); }} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold transition hover:border-orange-500 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60">{refreshing ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={18} aria-hidden="true" />}{refreshing ? copy.loading : copy.refresh}</button></div>
    {!admin && <p className="mt-3 text-sm leading-6 text-gray-600">{copy.note}</p>}
    <p role="status" className="mt-3 flex items-center gap-2 text-xs text-gray-600"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${connected ? 'bg-green-600' : 'bg-amber-500'}`} />{liveCopy[connected ? 0 : 1]}</p>
    {admin && <div className="mt-3 rounded-lg bg-orange-50 p-4 text-sm leading-6 text-gray-700"><p>{supportContactCopy[locale].note}</p><Link href="/admin#contact-requests" className="mt-2 inline-block font-bold text-orange-700 underline">{supportContactCopy[locale].link}</Link></div>}
    {admin && <><label className="mt-5 block text-sm font-bold">{copy.select}<select value={target} disabled={sending} onChange={event => setTarget(event.target.value)} className="mt-2 block w-full rounded-lg border border-stone-300 bg-white p-3"><option value="">{copy.select}</option>{threads.map(thread => <option key={thread.user_id} value={thread.user_id}>{thread.locale.toUpperCase()} · {thread.user_id.slice(0,8)} · {thread.body.slice(0,60)}</option>)}</select></label><p className="mt-2 text-xs text-gray-500">{copy.recent}</p>{!loading && !threads.length && <p className="mt-3">{copy.noThreads}</p>}</>}
    {loading ? <p className="py-8">{copy.loading}</p> : (!admin || target) && <><div ref={viewport} onScroll={event => { const el = event.currentTarget; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }} className={admin ? 'my-3 space-y-2 text-sm' : 'my-5 max-h-96 space-y-4 overflow-y-auto'} role="log" aria-live="polite" aria-relevant="additions" aria-label={copy.title}>{!messages.length && <p className="text-gray-500">{copy.empty}</p>}{messages.map(message => <article key={message.id} className={`rounded-xl ${admin ? 'p-3' : 'p-4'} ${message.sender_kind === 'admin' ? 'bg-orange-50' : 'bg-stone-50'}`}><div className="mb-2 flex flex-wrap justify-between gap-2 text-xs text-gray-600"><strong>{message.sender_kind === 'admin' ? copy.team : (admin ? message.customer_name || threads.find(thread => thread.user_id === message.user_id)?.customer_name || copy.you : ownName || copy.you)}</strong><time dateTime={message.created_at}>{new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(message.created_at))}</time></div><p className="whitespace-pre-wrap break-words">{message.body}</p>{message.attachment_name && <button type="button" disabled={!!downloading} onClick={() => void download(message)} className="mt-3 break-all text-sm font-bold text-orange-700 underline disabled:opacity-50">{fileCopy[2]} ? {message.attachment_name} ({Math.ceil((message.attachment_size || 0)/1024)} KB)</button>}</article>)}</div><p className="mb-4 text-xs text-gray-500">{copy.latest}</p><form onSubmit={submit}><label className="block text-sm font-bold">{copy.message}<textarea required minLength={1} maxLength={3000} value={body} disabled={sending} onChange={event => setBody(event.target.value)} rows={4} className="mt-2 block w-full rounded-xl border border-stone-300 p-3 font-normal" /></label><label className="mt-3 block text-sm font-bold">{fileCopy[0]}<input ref={fileInput} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={sending} onChange={event => { const next = event.target.files?.[0] ?? null; if (next && (next.size > 3 * 1024 * 1024 || !['application/pdf','image/jpeg','image/png','image/webp'].includes(next.type))) { setError('attachment'); event.target.value = ''; setFile(null); } else { setFile(next); setError(''); } }} className="mt-2 block w-full text-sm font-normal" /></label>{file && <button type="button" disabled={sending} onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }} className="mt-2 text-sm text-orange-700 underline">{fileCopy[1]}</button>}<button disabled={sending || !body.trim()} className="mt-3 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white disabled:opacity-50">{sending ? copy.sending : copy.send}</button></form></>}
    {error && <p role="alert" className="mt-4 text-red-700">{errorText(new Error(error))}</p>}{notice && <p role="status" className="mt-4 text-green-700">{notice}</p>}
    {!admin && <Link href="/contact" className="mt-4 inline-block text-sm text-orange-700 underline">{copy.contact}</Link>}
  </section>;
}
