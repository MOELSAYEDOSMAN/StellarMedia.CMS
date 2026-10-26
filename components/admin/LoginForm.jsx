'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm({ next = '/admin' }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setStatus('sending');
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        router.replace(next);
        router.refresh();
        return;
      }

      setError(data.error || 'Sign in failed.');
      setStatus('idle');
    } catch {
      setError('Network error. Check your connection and try again.');
      setStatus('idle');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="identifier" className="label">
          Email or username
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="field"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            className="field pr-16"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            className="absolute inset-y-0 right-2 my-auto h-7 rounded-md px-2 text-xs text-soft hover:text-second"
            aria-pressed={show}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-400/50 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
