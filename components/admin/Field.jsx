'use client';

import { useState } from 'react';
import ImageField from './ImageField';

const slug = (path) => path.replace(/[.[\]]+/g, '-');

function makeItem(field) {
  const defaults = field.defaultItem || {};
  const item = {
    id: globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  for (const sub of field.fields) {
    if (Object.prototype.hasOwnProperty.call(defaults, sub.key)) {
      item[sub.key] = defaults[sub.key];
    } else if (sub.type === 'lines') {
      item[sub.key] = [];
    } else if (sub.type === 'bool') {
      item[sub.key] = false;
    } else if (sub.type === 'number') {
      item[sub.key] = sub.min ?? 0;
    } else {
      item[sub.key] = '';
    }
  }
  return item;
}

function Label({ field, id }) {
  return (
    <label htmlFor={id} className="label">
      {field.label}
      {field.required ? <span className="text-second"> *</span> : null}
    </label>
  );
}

function Hint({ field, error }) {
  if (error) return <p className="mt-1.5 text-xs text-red-300">{error}</p>;
  if (field.help) return <p className="mt-1.5 text-xs text-soft">{field.help}</p>;
  return null;
}

function ListField({ field, value, onChange, errors, path, errorPath }) {
  const items = Array.isArray(value) ? value : [];
  const [collapsed, setCollapsed] = useState(() => new Set());

  const toggle = (id) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index) => {
    onChange(items.filter((_, current) => current !== index));
  };

  const update = (index, key, nextValue) => {
    onChange(items.map((item, current) => (current === index ? { ...item, [key]: nextValue } : item)));
  };

  const add = () => {
    if (items.length >= (field.maxItems ?? 12)) return;
    onChange([...items, makeItem(field)]);
  };

  return (
    <div className="rounded-2xl border border-line bg-main/40 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-soft">
          {items.length} of {field.maxItems ?? 12}
        </p>
        <button
          type="button"
          className="btn btn-ghost !px-3 !py-1.5 text-xs"
          onClick={add}
          disabled={items.length >= (field.maxItems ?? 12)}
        >
          + {field.addLabel || 'Add item'}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-soft">
          Nothing here yet. Use “{field.addLabel || 'Add item'}” to create the first one.
        </p>
      ) : null}

      <div className="space-y-3">
        {items.map((item, index) => {
          const itemId = item.id || `${errorPath}-${index}`;
          const isCollapsed = collapsed.has(itemId);
          const title = field.itemLabel?.(item) || `${field.label} ${index + 1}`;

          return (
            <div key={itemId} className="rounded-xl border border-line bg-panel">
              <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggle(itemId)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-expanded={!isCollapsed}
                >
                  <span className="text-soft" aria-hidden="true">
                    {isCollapsed ? '▸' : '▾'}
                  </span>
                  <span className="truncate text-sm font-semibold">{title}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-md border border-line text-xs text-soft hover:border-second hover:text-second disabled:opacity-30"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${title} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-md border border-line text-xs text-soft hover:border-second hover:text-second disabled:opacity-30"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label={`Move ${title} down`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-md border border-line text-xs text-red-300 hover:border-red-400"
                    onClick={() => remove(index)}
                    aria-label={`Remove ${title}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {!isCollapsed ? (
                <div className="space-y-4 p-3 sm:p-4">
                  {field.fields.map((sub) => (
                    <Field
                      key={sub.key}
                      field={sub}
                      value={item[sub.key]}
                      onChange={(nextValue) => update(index, sub.key, nextValue)}
                      errors={errors}
                      path={[...path, index, sub.key]}
                      errorPath={`${errorPath}[${index}].${sub.key}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <Hint field={{}} error={null} />
    </div>
  );
}

export default function Field({ field, value, onChange, errors, path = [], errorPath = '' }) {
  const id = `field-${slug(errorPath)}`;
  const error = errors?.[errorPath];
  const invalidClass = error ? 'border-red-400' : '';

  let control = null;

  switch (field.type) {
    case 'textarea':
      control = (
        <textarea
          id={id}
          rows={field.rows || 3}
          className={`field ${invalidClass}`}
          value={value ?? ''}
          maxLength={field.max ? field.max + 20 : undefined}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        />
      );
      break;

    case 'lines':
      control = (
        <textarea
          id={id}
          rows={field.rows || 4}
          className={`field font-mono text-xs leading-6 ${invalidClass}`}
          value={Array.isArray(value) ? value.join('\n') : value || ''}
          onChange={(event) => onChange(event.target.value.split('\n'))}
          aria-invalid={Boolean(error)}
        />
      );
      break;

    case 'url':
      control = (
        <input
          id={id}
          type="text"
          className={`field ${invalidClass}`}
          value={value ?? ''}
          placeholder={field.placeholder || '#contact'}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        />
      );
      break;

    case 'email':
      control = (
        <input
          id={id}
          type="email"
          className={`field ${invalidClass}`}
          value={value ?? ''}
          placeholder="name@example.com"
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        />
      );
      break;

    case 'color':
      control = (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="color"
            className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-main p-1"
            value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#150f14'}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${field.label} colour picker`}
          />
          <input
            type="text"
            className={`field flex-1 font-mono uppercase ${invalidClass}`}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-labelledby={id}
          />
        </div>
      );
      break;

    case 'number':
      control = (
        <input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          className={`field w-28 ${invalidClass}`}
          value={Number.isFinite(Number(value)) ? Number(value) : field.min ?? 0}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-invalid={Boolean(error)}
        />
      );
      break;

    case 'bool':
      control = (
        <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
          <input
            id={id}
            type="checkbox"
            className="sr-only"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span
            className={`relative h-6 w-11 rounded-full border transition-colors ${
              value ? 'border-second bg-second/30' : 'border-line bg-main'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform ${
                value ? 'translate-x-5 bg-second' : 'bg-soft'
              }`}
            />
          </span>
          <span className="text-sm text-soft">{value ? 'Visible on the site' : 'Hidden from the site'}</span>
        </label>
      );
      break;

    case 'select':
      control = (
        <select
          id={id}
          className={`field ${invalidClass}`}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        >
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;

    case 'image':
      control = <ImageField id={id} value={value} onChange={onChange} />;
      break;

    case 'list':
      return (
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <p className="label !mb-0">{field.label}</p>
          </div>
          <ListField
            field={field}
            value={value}
            onChange={onChange}
            errors={errors}
            path={path}
            errorPath={errorPath}
          />
          <Hint field={field} error={error} />
        </div>
      );

    default:
      control = (
        <input
          id={id}
          type="text"
          className={`field ${invalidClass}`}
          value={value ?? ''}
          maxLength={field.max ? field.max + 20 : undefined}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        />
      );
  }

  return (
    <div>
      <Label field={field} id={id} />
      {control}
      <Hint field={field} error={error} />
      {field.max && (field.type === 'text' || field.type === 'textarea') ? (
        <p className="mt-1 text-right text-[11px] text-soft">
          {String(value ?? '').length}/{field.max}
        </p>
      ) : null}
    </div>
  );
}
