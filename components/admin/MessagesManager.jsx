'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const FILTERS = ['all', 'new', 'read', 'replied', 'archived'];

function dateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function statusClass(status) {
  if (status === 'new') return 'badge-accent';
  if (status === 'replied') return 'border-green-400/40 text-green-200';
  if (status === 'archived') return 'opacity-60';
  return '';
}

export default function MessagesManager({ initialMessages = [], initialCounts = {} }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(initialMessages[0]?.id || null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const counts = useMemo(() => {
    const next = { all: messages.length, new: 0, read: 0, replied: 0, archived: 0 };
    messages.forEach((item) => { if (next[item.status] !== undefined) next[item.status] += 1; });
    return { ...initialCounts, ...next };
  }, [initialCounts, messages]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return messages.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      return !needle || [item.name, item.email, item.company, item.message].some((value) =>
        String(value || '').toLowerCase().includes(needle),
      );
    });
  }, [messages, filter, query]);

  const selected = messages.find((item) => item.id === selectedId) || visible[0] || null;

  async function changeStatus(id, status) {
    setBusy(true); setNotice('');
    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not update the enquiry.');
      setMessages((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      router.refresh();
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true); setNotice('');
    try {
      const response = await fetch(`/api/admin/messages/${selected.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: reply }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not send the reply.');
      setMessages((items) => items.map((item) => item.id === selected.id ? data.message : item));
      setReply(''); setNotice(`Reply sent to ${selected.email}.`);
      router.refresh();
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap gap-2 p-3">
        {FILTERS.map((value) => (
          <button key={value} type="button" onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${filter === value ? 'bg-second text-main' : 'text-soft hover:text-ink'}`}>
            {value} <span className="ml-1 opacity-70">{counts[value] || 0}</span>
          </button>
        ))}
        <input className="field ml-auto min-w-[190px] !py-1.5" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search enquiries" aria-label="Search enquiries" />
      </div>

      {notice ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${notice.startsWith('Reply sent') ? 'border-second/40 bg-second/10 text-second' : 'border-red-400/50 bg-red-400/10 text-red-200'}`}>{notice}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
        <div className="card max-h-[680px] overflow-y-auto">
          {visible.length ? visible.map((item) => (
            <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setReply(''); }}
              className={`w-full border-b border-line p-4 text-left last:border-0 hover:bg-second/5 ${selected?.id === item.id ? 'bg-second/10' : ''}`}>
              <span className="flex items-center gap-2"><strong className="truncate">{item.name}</strong><span className={`badge ml-auto ${statusClass(item.status)}`}>{item.status}</span></span>
              <span className="mt-1 block truncate text-sm text-soft">{item.email}</span>
              <span className="mt-2 block line-clamp-2 text-sm">{item.message}</span>
              <span className="mt-2 block text-xs text-soft">{dateTime(item.createdAt)}</span>
            </button>
          )) : <p className="p-6 text-sm text-soft">No enquiries match this view.</p>}
        </div>

        <div className="card min-w-0 p-4 sm:p-6">
          {!selected ? <p className="text-sm text-soft">Choose an enquiry to read it.</p> : <>
            <div className="flex flex-wrap items-start gap-3 border-b border-line pb-4">
              <div><h2 className="font-display text-2xl font-bold">{selected.name}</h2><a className="text-sm text-second hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a>{selected.company ? <p className="mt-1 text-sm text-soft">{selected.company}</p> : null}</div>
              <span className={`badge ml-auto ${statusClass(selected.status)}`}>{selected.status}</span>
            </div>
            <p className="whitespace-pre-wrap py-5 text-sm leading-7">{selected.message}</p>
            <p className="text-xs text-soft">Received {dateTime(selected.createdAt)} · Email notification: {selected.emailStatus || 'not configured'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.status !== 'read' ? <button className="btn btn-ghost !px-3 !py-2" type="button" disabled={busy} onClick={() => changeStatus(selected.id, 'read')}>Mark read</button> : null}
              {selected.status !== 'archived' ? <button className="btn btn-ghost !px-3 !py-2" type="button" disabled={busy} onClick={() => changeStatus(selected.id, 'archived')}>Archive</button> : null}
            </div>
            {selected.replies?.length ? <div className="mt-6 border-t border-line pt-4"><p className="label">Sent replies</p>{selected.replies.map((item, index) => <div className="mb-3 rounded-xl border border-line p-3 text-sm" key={`${item.sentAt}-${index}`}><p className="whitespace-pre-wrap">{item.body}</p><p className="mt-2 text-xs text-soft">{item.sentBy} · {dateTime(item.sentAt)}</p></div>)}</div> : null}
            <form className="mt-6 border-t border-line pt-5" onSubmit={sendReply}>
              <label className="label" htmlFor="reply">Reply by email</label>
              <textarea id="reply" className="field min-h-32 resize-y" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} placeholder={`Write to ${selected.name}…`} />
              <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-soft">Sent from your configured SMTP address.</span><button className="btn btn-primary" disabled={busy || reply.trim().length < 2}>{busy ? 'Sending…' : 'Send reply'}</button></div>
            </form>
          </>}
        </div>
      </div>
    </div>
  );
}
