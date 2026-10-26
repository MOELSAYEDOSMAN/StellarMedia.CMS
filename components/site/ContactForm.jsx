'use client';

import { useState } from 'react';
import Magnetic from './Magnetic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELDS = [
  { key: 'name', label: 'Your name', type: 'text', autoComplete: 'name', required: true },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
  { key: 'company', label: 'Company or entity', type: 'text', autoComplete: 'organization', required: false },
];

export default function ContactForm({ contact }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const rules = {
    name: (value) => (String(value).trim().length < 2 ? 'Enter your name.' : ''),
    email: (value) => (EMAIL_RE.test(String(value).trim()) ? '' : 'Enter a valid email address.'),
    message: (value) => (String(value).trim().length < 10 ? 'Write at least 10 characters.' : ''),
  };

  const validateField = (key) => {
    if (!rules[key]) return true;
    const message = rules[key](form[key]);
    setErrors((current) => ({ ...current, [key]: message }));
    return !message;
  };

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const valid = Object.keys(rules)
      .map((key) => validateField(key))
      .every(Boolean);

    if (!valid) {
      const first = document.querySelector('[aria-invalid="true"]');
      first?.focus();
      return;
    }

    setStatus('sending');
    setServerError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        setSentTo(form.email);
        setStatus('success');
        setForm({ name: '', email: '', company: '', message: '', website: '' });
        setErrors({});
        return;
      }

      if (data.errors && typeof data.errors === 'object') {
        setErrors(data.errors);
        setStatus('idle');
        return;
      }

      if (response.status === 429) {
        setServerError(
          `Too many messages from this connection. Try again in ${data.retryAfter || 10} minutes.`,
        );
        setStatus('error');
        return;
      }

      setServerError(data.error || 'Something went wrong. Please try again.');
      setStatus('error');
    } catch {
      setServerError('Network error. Check your connection and try again.');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5" aria-describedby="form-status">
      <div className="hidden" aria-hidden="true">
        <label htmlFor="f-website">Website</label>
        <input
          id="f-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={update('website')}
        />
      </div>

      {FIELDS.map((field) => (
        <div key={field.key}>
          <label htmlFor={`f-${field.key}`} className="mb-2 block text-sm text-soft">
            {field.label}
            {field.required ? <span className="text-second"> *</span> : null}
          </label>
          <input
            id={`f-${field.key}`}
            type={field.type}
            autoComplete={field.autoComplete}
            value={form[field.key]}
            onChange={update(field.key)}
            onBlur={() => validateField(field.key)}
            aria-invalid={Boolean(errors[field.key])}
            aria-describedby={errors[field.key] ? `e-${field.key}` : undefined}
            className={`w-full rounded-2xl border bg-main px-4 py-3 outline-none transition-colors focus:border-second ${
              errors[field.key] ? 'border-red-400' : 'border-line'
            }`}
          />
          {errors[field.key] ? (
            <p id={`e-${field.key}`} className="mt-1.5 text-sm text-red-300">
              {errors[field.key]}
            </p>
          ) : null}
        </div>
      ))}

      <div>
        <label htmlFor="f-message" className="mb-2 block text-sm text-soft">
          Project details<span className="text-second"> *</span>
        </label>
        <textarea
          id="f-message"
          rows={5}
          value={form.message}
          onChange={update('message')}
          onBlur={() => validateField('message')}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'e-message' : undefined}
          className={`w-full rounded-2xl border bg-main px-4 py-3 outline-none transition-colors focus:border-second ${
            errors.message ? 'border-red-400' : 'border-line'
          }`}
        />
        {errors.message ? (
          <p id="e-message" className="mt-1.5 text-sm text-red-300">
            {errors.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Magnetic
          as="button"
          type="submit"
          disabled={status === 'sending'}
          className="rounded-full bg-second px-8 py-3.5 font-semibold text-main hover:bg-ink disabled:cursor-wait disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </Magnetic>
        {contact.formNote ? <p className="text-sm text-soft">{contact.formNote}</p> : null}
      </div>

      <div id="form-status" role="status" aria-live="polite">
        {status === 'success' ? (
          <p className="animate-fadeUp rounded-2xl border border-second/50 bg-second/10 px-4 py-3 text-second">
            Message sent. We will reply to {sentTo} soon.
          </p>
        ) : null}
        {status === 'error' ? (
          <p className="animate-fadeUp rounded-2xl border border-red-400/60 bg-red-400/10 px-4 py-3 text-red-200">
            {serverError}
          </p>
        ) : null}
      </div>
    </form>
  );
}
