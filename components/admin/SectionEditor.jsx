'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import Field from './Field';

function setAtPath(root, path, next) {
  const clone = structuredClone(root);
  let cursor = clone;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    if (cursor[key] === null || typeof cursor[key] !== 'object') {
      cursor[key] = typeof path[index + 1] === 'number' ? [] : {};
    }
    cursor = cursor[key];
  }
  cursor[path[path.length - 1]] = next;
  return clone;
}

export default function SectionEditor({ section, initialValue }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const baseline = useRef(JSON.stringify(initialValue));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(JSON.stringify(value) !== baseline.current);
  }, [value]);

  useEffect(() => {
    const handler = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const save = useCallback(async () => {
    if (status === 'saving') return;
    setStatus('saving');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/content/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        baseline.current = JSON.stringify(data.value);
        setValue(data.value);
        setErrors({});
        setStatus('saved');
        setMessage('Saved. The public site now shows these changes.');
        router.refresh();
        window.setTimeout(() => setStatus((current) => (current === 'saved' ? 'idle' : current)), 4000);
        return;
      }

      setErrors(data.errors || {});
      setStatus('error');
      setMessage(
        data.error ||
          (Object.keys(data.errors || {}).length
            ? 'Some fields need attention before this can be saved.'
            : 'Could not save. Please try again.'),
      );
    } catch {
      setStatus('error');
      setMessage('Network error. Your changes are still here — try saving again.');
    }
  }, [router, section.id, status, value]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [save]);

  const reset = () => {
    setValue(initialValue);
    setErrors({});
    setStatus('idle');
    setMessage('');
    baseline.current = JSON.stringify(initialValue);
  };

  const errorCount = Object.keys(errors).filter((key) => errors[key]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-soft">
            <Link href="/admin/content" className="hover:text-second">
              Content
            </Link>
            <span aria-hidden="true">/</span>
            <span>{section.label}</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{section.label}</h1>
          <p className="mt-2 max-w-2xl text-sm text-soft">{section.summary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" target="_blank" className="btn btn-ghost">
            View page ↗
          </Link>
          <button type="button" className="btn btn-ghost" onClick={reset} disabled={!dirty}>
            Reset
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {dirty && status !== 'saving' ? <span className="badge">Unsaved changes</span> : null}
        {status === 'saved' ? <span className="badge badge-accent">Saved</span> : null}
        {errorCount ? (
          <span className="badge border-red-400/40 text-red-200">
            {errorCount} field{errorCount === 1 ? '' : 's'} need attention
          </span>
        ) : null}
        <span className="text-xs text-soft">
          Shortcut: <kbd className="rounded border border-line px-1.5 py-0.5 text-[11px]">Ctrl</kbd> +{' '}
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[11px]">S</kbd>
        </span>
      </div>

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm ${
            status === 'error'
              ? 'border-red-400/50 bg-red-400/10 text-red-200'
              : 'border-second/40 bg-second/10 text-second'
          }`}
        >
          {message}
        </p>
      ) : null}

      <form
        className="card space-y-6 p-4 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {section.fields.map((field) => (
          <Field
            key={field.key}
            field={field}
            value={value?.[field.key]}
            errors={errors}
            path={[field.key]}
            errorPath={field.key}
            onChange={(next) => setValue((current) => setAtPath(current, [field.key], next))}
          />
        ))}

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <button type="button" className="btn btn-ghost" onClick={reset} disabled={!dirty}>
            Reset
          </button>
          <button type="submit" className="btn btn-primary" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
