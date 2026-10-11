'use client';
import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { RefreshCw, Download, ArrowLeft, BarChart3 } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import { supabase } from '@/lib/supabase';
import { analyticsCopy, analyticsSectionLabel } from '@/lib/analytics-copy';

type Session = { session_id: string; started_at: string; last_at: string; user_id: string | null; customer_name: string | null; customer_email: string | null; entry: string; exit: string; device: 'mobile'|'tablet'|'desktop'; source: string; views: number; seconds: number };
type Report = {
  totals: { visits: number; views: number; customers: number; active: number; seconds: number; single_page: number };
  daily: { day: string; visits: number; views: number }[];
  pages: { path: string; visits: number; views: number }[];
  sections: { path: string; section: string; views: number; visits: number }[];
  actions: { kind: 'cart_add'|'contact_sent'|'quote_sent'|'order_sent'; total: number; visits: number }[];
  devices: { device: Session['device']; visits: number }[];
  sources: { source: string; visits: number }[];
  sessions: Session[];
  funnel: { products: number; cart: number; checkout: number; orders: number };
};
type Journey = { events: { id: string; kind: 'page_view'|'section_view'|'cart_add'|'contact_sent'|'quote_sent'|'order_sent'; path: string; section: string; locale: Locale; created_at: string }[]; truncated: boolean };
const card = 'min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6';
export default function AnalyticsDashboard() {
  const locale = useLocale() as Locale, copy = analyticsCopy[locale];
  const [days, setDays] = useState(30), [offset, setOffset] = useState(0);
  const [report, setReport] = useState<Report | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Session | null>(null), [journey, setJourney] = useState<Journey | null>(null), [journeyError, setJourneyError] = useState('');
  const [revision, setRevision] = useState(0);
  const call = useCallback(async (query: string, signal: AbortSignal) => {
    const session = await supabase?.auth.getSession();
    if (!session?.data.session) throw new Error('signin');
    const result = await fetch(`/api/analytics?${query}`, { headers: { Authorization: `Bearer ${session.data.session.access_token}` }, cache: 'no-store', signal });
    const data = await result.json(); if (!result.ok) throw new Error(data.error); return data;
  }, []);
  useEffect(() => {
    let active = true; const controller = new AbortController(); setLoading(true); setError(''); setReport(null); setSelected(null); setJourney(null);
    void call(`days=${days}&offset=${offset}`, controller.signal).then(data => { if (active) setReport(data); }).catch(error => { if (active) setError(error instanceof Error ? error.message : 'unavailable'); }).finally(()=> { if(active) setLoading(false); });
    return () => { active=false; controller.abort(); };
  }, [days, offset, revision, call]);
  useEffect(() => {
    if (!selected) return;
    let active = true; const controller = new AbortController(); setJourney(null); setJourneyError('');
    void call(`days=${days}&session=${selected.session_id}`, controller.signal).then(data=> { if(active) setJourney(data); }).catch(()=> { if(active) setJourneyError(copy.error); });
    return ()=> { active=false; controller.abort(); };
  }, [selected, days, call, copy.error]);
  const format = (date: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(date));
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  const duration = (seconds: number) => `${Math.floor(seconds/60)} min ${seconds%60} s`;
  function exportCsv() {
    if (!report) return;
    const cell = (value: unknown) => '"'+String(value).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
    const rows: unknown[][] = [['type','label','sessions','page_views']];
    report.daily.forEach(row=>rows.push(['day',row.day,row.visits,row.views]));
    report.pages.forEach(row=>rows.push(['page',row.path,row.visits,row.views]));
    report.sections.forEach(row=>rows.push(['section',`${row.path}#${row.section}`,row.visits,row.views]));
    const url = URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a'); link.href=url; link.download=`brennholz-statistics-${days}-days.csv`; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section id="site-statistics" data-original-content className="mt-6 scroll-mt-32 space-y-5">
    <div className={card}><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-2 text-xl font-black"><BarChart3 size={24} className="text-orange-600"/>{copy.title}</h2><div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="analytics-period">{copy.period}</label><select id="analytics-period" value={days} onChange={event=> { setDays(Number(event.target.value)); setOffset(0); }} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">{[7,30,90].map(value=><option key={value} value={value}>{value} {copy.days}</option>)}</select><button type="button" disabled={loading} onClick={()=>setRevision(value=>value+1)} className="flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-bold disabled:opacity-50"><RefreshCw size={16}/>{copy.refresh}</button><button type="button" disabled={!report} onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-bold disabled:opacity-50"><Download size={16}/>{copy.export}</button></div></div><p className="mt-3 text-sm leading-6 text-gray-500">{copy.note}</p></div>
    {loading && <p role="status" className={card}>{copy.loading}</p>}
    {error && <p role="alert" className={`${card} text-amber-800`}>{error === 'setup' ? copy.setup : copy.error}</p>}
    {report && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        [copy.visits,number(report.totals.visits)], [copy.views,number(report.totals.views)], [copy.customers,number(report.totals.customers)], [copy.active,number(report.totals.active)],
      ].map(([label,value])=><div key={label} className={card}><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-black text-gray-950">{value}</p></div>)}</div>
      <div className="flex flex-wrap gap-6 px-2 text-sm text-gray-600"><p>{copy.duration}: <b>{duration(report.totals.visits ? Math.round(report.totals.seconds/report.totals.visits) : 0)}</b></p><p>{copy.single}: <b>{report.totals.visits ? Math.round(report.totals.single_page*100/report.totals.visits) : 0}%</b></p></div>
      {!report.totals.visits && <p className={card}>{copy.empty}</p>}
      <div className={card}><h3 className="font-black">{copy.trend}</h3><div className="mt-5 flex h-40 items-end gap-1 overflow-hidden" role="img" aria-label={`${copy.trend}: ${report.totals.visits}`}>
        {report.daily.map(day=><div key={day.day} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${day.day}: ${day.visits} ${copy.visits}, ${day.views} ${copy.views}`}><div className="w-full rounded-t bg-orange-500 transition hover:bg-orange-700" style={{height:`${day.visits ? Math.max(3,day.visits/Math.max(1,...report.daily.map(row=>row.visits))*100) : 0}%`}}/></div>)}
      </div><div className="mt-2 flex justify-between text-xs text-gray-500"><span>{report.daily[0]?.day}</span><span>{report.daily.at(-1)?.day}</span></div><details className="mt-3 text-sm"><summary className="cursor-pointer text-gray-600">{copy.details}</summary><div className="max-h-60 overflow-auto"><table className="mt-2 w-full text-left text-sm"><thead><tr><th>{locale === 'de' ? 'Datum' : 'Date'}</th><th>{copy.visits}</th><th>{copy.views}</th></tr></thead><tbody>{report.daily.map(day=><tr key={day.day}><td>{day.day}</td><td>{day.visits}</td><td>{day.views}</td></tr>)}</tbody></table></div></details></div>
      <div className={card}><h3 className="font-black">{copy.funnel}</h3><div className="mt-4 grid gap-3 sm:grid-cols-4">{[[copy.product,report.funnel.products],[copy.cart,report.funnel.cart],[copy.checkout,report.funnel.checkout],[copy.order,report.funnel.orders]].map(([label,value])=><div key={String(label)} className="rounded-xl bg-stone-50 p-4"><p className="text-sm text-gray-600">{label}</p><b className="mt-2 block text-2xl">{number(Number(value))}</b></div>)}</div><p className="mt-3 text-xs text-gray-500">{copy.funnelNote}</p></div>
      <div className="grid gap-5 lg:grid-cols-2"><div className={card}><h3 className="font-black">{copy.pages}</h3><div className="mt-4 space-y-3">{report.pages.map(page=><div key={page.path} className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3 text-sm"><span className="min-w-0 break-words font-medium">{page.path}</span><span className="shrink-0 text-gray-500">{number(page.views)} · {number(page.visits)} {copy.visits}</span></div>)}</div></div><div className={card}><h3 className="font-black">{copy.sections}</h3><div className="mt-4 space-y-3">{report.sections.map(section=><div key={`${section.path}:${section.section}`} className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3 text-sm"><div className="min-w-0"><b className="break-words">{analyticsSectionLabel(section.section, locale)}</b><p className="break-words text-xs text-gray-500">{section.path}</p></div><span className="shrink-0 text-gray-500">{number(section.visits)} {copy.visits}</span></div>)}</div></div></div>
      <div className="grid gap-5 lg:grid-cols-3"><div className={card}><h3 className="font-black">{copy.actions}</h3>{report.actions.map(action=><p key={action.kind} className="mt-3 flex justify-between gap-3 text-sm"><span>{copy[action.kind]}</span><b>{number(action.total)}</b></p>)}</div><div className={card}><h3 className="font-black">{copy.devices}</h3>{report.devices.map(device=><p key={device.device} className="mt-3 flex justify-between gap-3 text-sm"><span>{copy[device.device]}</span><b>{number(device.visits)}</b></p>)}</div><div className={card}><h3 className="font-black">{copy.sources}</h3>{report.sources.map(source=><p key={source.source} className="mt-3 flex justify-between gap-3 text-sm"><span className="min-w-0 break-all">{source.source==='direct' ? copy.direct : source.source}</span><b>{number(source.visits)}</b></p>)}</div></div>
      <div className={card}><h3 className="font-black">{copy.journeys}</h3><div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">{report.sessions.map(session=><button key={session.session_id} type="button" onClick={()=>setSelected(session)} className={`block w-full rounded-xl border p-4 text-left transition hover:border-orange-400 ${selected?.session_id===session.session_id ? 'border-orange-400 bg-orange-50' : 'border-stone-200'}`}><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><b className="break-words">{session.user_id ? session.customer_name || session.customer_email || copy.account : `${copy.visitor} · ${session.session_id.slice(0,8)}`}</b>{session.user_id && session.customer_email && <p className="break-all text-xs text-gray-500">{session.customer_email}</p>}</div><span className="text-xs text-gray-500">{format(session.started_at)}</span></div><p className="mt-2 break-words text-sm text-gray-600">{copy.entry}: {session.entry} → {copy.exit}: {session.exit}</p><p className="mt-2 text-xs text-gray-500">{session.views} {copy.views} · {duration(session.seconds)} · {copy[session.device]} · {copy.details}</p></button>)}</div><div className="mt-4 flex items-center justify-between gap-3"><button type="button" disabled={!offset || loading} onClick={()=>setOffset(value=>Math.max(0,value-50))} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">{copy.previous}</button><span className="text-xs text-gray-500">{report.sessions.length ? offset+1 : 0}–{offset+report.sessions.length} / {number(report.totals.visits)}</span><button type="button" disabled={offset+50>=report.totals.visits || loading} onClick={()=>setOffset(value=>value+50)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">{copy.next}</button></div></div>
      {selected && <section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-black">{copy.journey} · {selected.customer_name || selected.session_id.slice(0,8)}</h3><button type="button" onClick={()=>setSelected(null)} className="flex items-center gap-2 text-sm font-bold text-orange-700"><ArrowLeft size={16}/>{copy.back}</button></div>{journeyError ? <p role="alert" className="mt-4 text-red-700">{journeyError}</p> : !journey ? <p className="mt-4">{copy.loading}</p> : <><ol className="mt-5 space-y-4 border-l-2 border-orange-100 pl-4">{journey.events.map(event=><li key={event.id}><time className="text-xs text-gray-500">{format(event.created_at)}</time><p className="mt-1 break-words text-sm"><b>{event.kind==='page_view' ? copy.page : event.kind==='section_view' ? copy.section : copy[event.kind]}</b> · {event.path}{event.section ? ` · ${analyticsSectionLabel(event.section, locale)}` : ''}</p></li>)}</ol>{journey.truncated && <p className="mt-4 text-xs text-gray-500">{copy.limited}</p>}</>}</section>}
      <p className="text-xs text-gray-500">{copy.recorded}</p>
    </>}
  </section>;
}
