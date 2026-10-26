'use client';

import { useRef, useState } from 'react';

/** Image URL field with an upload button that stores files in /public/uploads. */
export default function ImageField({ id, value, onChange, placeholder = '/uploads/…' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);

    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setError(data.error || 'Upload failed.');
        return;
      }
      onChange(data.url);
    } catch {
      setError('Upload failed. Check your connection.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          id={id}
          type="text"
          className="field flex-1"
          value={value || ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <label className="btn btn-ghost cursor-pointer">
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="sr-only"
            onChange={upload}
            disabled={uploading}
          />
        </label>
        {value ? (
          <button type="button" className="btn btn-ghost" onClick={() => onChange('')}>
            Clear
          </button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-main/60 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Selected" className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate text-xs text-soft">{value}</p>
            {!value.startsWith('https://') && !value.startsWith('/') ? (
              <p className="text-xs text-red-300">Use a relative (/uploads/…) or https:// URL.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
