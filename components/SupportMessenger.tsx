'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocale } from 'next-intl';
import Link from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { supabase } from '@/lib/supabase';
import { supportCopy } from '@/lib/support-copy';
import { useVerifiedAccess } from './AccessContext';

type Message = { id: string; user_id: string; body: string; locale: Locale; sender_kind: 'customer' | 'admin'; created_at: string };
type Thread = Omit<Message, 'id'>;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [target, setTarget] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const generation = useRef({ value: 0 });
  const live = useRef(true);
  useEffect(() => { const counter = generation.current; live.current = true; return () => { live.current = false; counter.value++; }; }, []);
  const call = useCallback(async (query = '', payload?: object) => {
    if (!supabase) throw new Error('unavailable');
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('signin');
    const response = await fetch(`/api/support${query}`, { method: payload ? 'POST' : 'GET', headers: { Authorization: `Bearer ${data.session.access_token}`, ...(payload ? { 'Content-Type': 'application/json' } : {}) }, ...(payload ? { body: JSON.stringify(payload) } : {}), cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error); return result;
  }, []);
  const load = useCallback(async () => {
    const current = ++generation.current.value;
    try {
      const inbox = admin ? await call('?inbox=1') : null;
      const conversation = !admin || target ? await call(target ? `?user_id=${encodeURIComponent(target)}` : '') : { messages: [] };
      if (!live.current || current !== generation.current.value) return;
      if (inbox) setThreads(inbox.threads);
      setMessages(conversation.messages); setError(false);
    } catch { if (live.current && current === generation.current.value) setError(true); }
    finally { if (live.current && current === generation.current.value) setLoading(false); }
  }, [admin, target, call]);
  useEffect(() => { const counter = generation.current; setMessages([]); setBody(''); setNotice(''); setLoading(true); void load(); const timer = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 30000); return () => { clearInterval(timer); counter.value++; }; }, [load]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (sending || !body.trim()) return;
    setSending(true); setError(false); setNotice('');
    try {
      await call('', { body, locale: admin ? threads.find(thread => thread.user_id === target)?.locale ?? locale : locale, ...(admin ? { user_id: target } : {}) });
      if (!live.current) return;
      setBody(''); setNotice(copy.sent); await load();
    } catch { if (live.current) setError(true); }
    finally { if (live.current) setSending(false); }
  }
  return <section data-original-content className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">{admin ? copy.inbox : copy.title}</h2><button type="button" onClick={() => void load()} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold">{copy.refresh}</button></div>
    {!admin && <p className="mt-3 text-sm leading-6 text-gray-600">{copy.note}</p>}
    {admin && <><label className="mt-5 block text-sm font-bold">{copy.select}<select value={target} disabled={sending} onChange={event => setTarget(event.target.value)} className="mt-2 block w-full rounded-lg border border-stone-300 bg-white p-3"><option value="">{copy.select}</option>{threads.map(thread => <option key={thread.user_id} value={thread.user_id}>{thread.locale.toUpperCase()} · {thread.user_id.slice(0,8)} · {thread.body.slice(0,60)}</option>)}</select></label><p className="mt-2 text-xs text-gray-500">{copy.recent}</p>{!loading && !threads.length && <p className="mt-3">{copy.noThreads}</p>}</>}
    {loading ? <p className="py-8">{copy.loading}</p> : (!admin || target) && <><div className="my-5 max-h-96 space-y-4 overflow-y-auto" aria-label={copy.title}>{!messages.length && <p className="text-gray-500">{copy.empty}</p>}{messages.map(message => <article key={message.id} className={`rounded-xl p-4 ${message.sender_kind === 'admin' ? 'bg-orange-50' : 'bg-stone-50'}`}><div className="mb-2 flex flex-wrap justify-between gap-2 text-xs text-gray-600"><strong>{message.sender_kind === 'admin' ? copy.team : copy.you}</strong><time dateTime={message.created_at}>{new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(message.created_at))}</time></div><p className="whitespace-pre-wrap break-words">{message.body}</p></article>)}</div><p className="mb-4 text-xs text-gray-500">{copy.latest}</p><form onSubmit={submit}><label className="block text-sm font-bold">{copy.message}<textarea required minLength={1} maxLength={3000} value={body} disabled={sending} onChange={event => setBody(event.target.value)} rows={4} className="mt-2 block w-full rounded-xl border border-stone-300 p-3 font-normal" /></label><button disabled={sending || !body.trim()} className="mt-3 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white disabled:opacity-50">{sending ? copy.sending : copy.send}</button></form></>}
    {error && <p role="alert" className="mt-4 text-red-700">{copy.error}</p>}{notice && <p role="status" className="mt-4 text-green-700">{notice}</p>}
    {!admin && <Link href="/contact" className="mt-4 inline-block text-sm text-orange-700 underline">{copy.contact}</Link>}
  </section>;
}
