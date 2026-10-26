/**
 * Single source of truth for the editable content model.
 *
 * The same schema drives:
 *  - the defaults that seed a fresh database,
 *  - server-side validation of every CMS save,
 *  - the forms in the admin UI (components/admin/Field.jsx).
 *
 * It deliberately has no Node-only imports so the admin UI can import it too.
 */

const HEX = /^#[0-9a-f]{6}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_SHAPE =
  /^(#[\w-]+|\/[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+0-9()\s-]{5,})$/i;
const IMAGE_SHAPE = /^(\/[^\s]+|https?:\/\/[^\s]+)$/i;

const FALLBACK_ID = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2, 10)}`;

const asString = (value) =>
  typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);

function cleanInline(value) {
  return asString(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanMultiline(value) {
  return asString(value)
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanLines(value, maxLines, maxLength) {
  const raw = Array.isArray(value) ? value : asString(value).split('\n');
  return raw
    .map(cleanInline)
    .filter(Boolean)
    .slice(0, maxLines)
    .map((line) => line.slice(0, maxLength));
}

/** ---------------------------------------------------------------- sections */

export const SECTIONS = [
  {
    id: 'brand',
    label: 'Brand & SEO',
    group: 'Site',
    summary: 'Name, tagline, browser metadata and the two brand colours.',
    fields: [
      { key: 'name', label: 'Brand name', type: 'text', required: true, max: 40, default: 'Stellar Media' },
      {
        key: 'tagline',
        label: 'Tagline',
        type: 'text',
        max: 120,
        default: 'Marketing & creative agency, Abu Dhabi',
      },
      {
        key: 'metaTitle',
        label: 'Browser tab / search title',
        type: 'text',
        max: 70,
        default: 'Stellar Media | Marketing & creative agency, Abu Dhabi',
      },
      {
        key: 'metaDescription',
        label: 'Meta description',
        type: 'textarea',
        max: 200,
        rows: 3,
        default:
          'Stellar Media is an Abu Dhabi marketing and creative agency working with government entities and major brands.',
      },
      {
        key: 'mainColor',
        label: 'Main colour',
        type: 'color',
        default: '#150f14',
        help: 'Background for the website and this CMS.',
      },
      {
        key: 'secondColor',
        label: 'Secondary colour',
        type: 'color',
        default: '#75fff9',
        help: 'Buttons, links and highlights.',
      },
      {
        key: 'logoImage',
        label: 'Logo image',
        type: 'image',
        default: '',
        help: 'Optional. Leave empty to use the built-in star mark.',
      },
    ],
  },
  {
    id: 'nav',
    label: 'Navigation',
    group: 'Site',
    summary: 'Header links, mobile menu and the main call to action.',
    fields: [
      {
        key: 'links',
        label: 'Menu links',
        type: 'list',
        maxItems: 6,
        addLabel: 'Add link',
        defaultItem: { label: 'New link', target: '#about' },
        itemLabel: (item) => item.label || 'Link',
        fields: [
          { key: 'label', label: 'Label', type: 'text', required: true, max: 24 },
          { key: 'target', label: 'Link', type: 'url', required: true, max: 200, placeholder: '#about' },
        ],
        default: [
          { label: 'About', target: '#about' },
          { label: 'Services', target: '#services' },
          { label: 'Work', target: '#work' },
          { label: 'Contact', target: '#contact' },
        ],
      },
      { key: 'ctaLabel', label: 'Header button label', type: 'text', max: 30, default: 'Start a project' },
      { key: 'ctaTarget', label: 'Header button link', type: 'url', max: 200, default: '#contact' },
    ],
  },
  {
    id: 'hero',
    label: 'Hero',
    group: 'Content',
    summary: 'The first screen: headline, positioning line and calls to action.',
    fields: [
      {
        key: 'eyebrow',
        label: 'Eyebrow',
        type: 'text',
        max: 90,
        default: 'Marketing and creative agency, Abu Dhabi',
      },
      {
        key: 'headline',
        label: 'Headline',
        type: 'lines',
        maxLines: 4,
        max: 32,
        rows: 4,
        help: 'One line per row. Keep it short — this is the largest type on the page.',
        default: ['Brands that', 'command', 'attention.'],
      },
      {
        key: 'sub',
        label: 'Supporting paragraph',
        type: 'textarea',
        max: 300,
        rows: 3,
        default:
          'We help government entities and major brands turn strategy into campaigns, identities and content people remember.',
      },
      { key: 'primaryLabel', label: 'Primary button label', type: 'text', max: 30, default: 'Start a project' },
      { key: 'primaryTarget', label: 'Primary button link', type: 'url', max: 200, default: '#contact' },
      {
        key: 'secondaryLabel',
        label: 'Secondary button label',
        type: 'text',
        max: 30,
        default: 'See concept work',
      },
      { key: 'secondaryTarget', label: 'Secondary button link', type: 'url', max: 200, default: '#work' },
      {
        key: 'marquee',
        label: 'Scrolling strip',
        type: 'lines',
        maxLines: 8,
        max: 32,
        rows: 5,
        help: 'Services shown in the marquee under the headline.',
        default: ['Strategy', 'Branding', 'Content', 'Digital marketing', 'Creative production'],
      },
    ],
  },
  {
    id: 'about',
    label: 'About',
    group: 'Content',
    summary: 'Positioning statement and the principles behind the work.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text', max: 30, default: 'About' },
      {
        key: 'heading',
        label: 'Heading',
        type: 'textarea',
        max: 160,
        rows: 3,
        default: 'Creative work that holds up in a boardroom and on a billboard.',
      },
      {
        key: 'body',
        label: 'Paragraph',
        type: 'textarea',
        max: 700,
        rows: 4,
        default:
          'Stellar Media is a marketing and creative agency based in Abu Dhabi. We work with government entities and major brands that need communication to be clear, consistent and well made.',
      },
      {
        key: 'principles',
        label: 'Principles',
        type: 'list',
        maxItems: 6,
        addLabel: 'Add principle',
        defaultItem: { title: 'New principle', text: '' },
        itemLabel: (item) => item.title || 'Principle',
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true, max: 60 },
          { key: 'text', label: 'Description', type: 'textarea', max: 220, rows: 2 },
        ],
        default: [
          {
            title: 'Clear before clever',
            text: 'Every campaign starts with one idea that your audience can repeat back.',
          },
          {
            title: 'Built for scale',
            text: 'Identities and content systems that stay consistent across channels and teams.',
          },
          { title: 'Made with care', text: 'Craft in the details, from copy to colour to the final export.' },
        ],
      },
      {
        key: 'visible',
        label: 'Show this section',
        type: 'bool',
        default: true,
        help: 'Unchecked sections are hidden from the public page.',
      },
      { key: 'order', label: 'Position', type: 'number', min: 1, max: 9, default: 1 },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    group: 'Content',
    summary: 'The accordion of services and what each one includes.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text', max: 30, default: 'Services' },
      {
        key: 'heading',
        label: 'Heading',
        type: 'text',
        max: 120,
        default: 'Everything a campaign needs, under one roof.',
      },
      {
        key: 'items',
        label: 'Services',
        type: 'list',
        maxItems: 10,
        addLabel: 'Add service',
        defaultItem: { name: 'New service', summary: '', points: [] },
        itemLabel: (item) => item.name || 'Service',
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true, max: 50 },
          { key: 'summary', label: 'Description', type: 'textarea', max: 260, rows: 2 },
          {
            key: 'points',
            label: 'Includes',
            type: 'lines',
            maxLines: 6,
            max: 40,
            rows: 3,
            help: 'One item per row.',
          },
        ],
        default: [
          {
            name: 'Strategy',
            summary: 'We define the audience, the message and the channels before any design starts.',
            points: ['Brand positioning', 'Audience research', 'Campaign planning'],
          },
          {
            name: 'Branding',
            summary: 'Visual and verbal identities built to work in print, digital and physical spaces.',
            points: ['Identity design', 'Guidelines', 'Naming and tone of voice'],
          },
          {
            name: 'Content',
            summary: 'Copy, photography and video that explain your story in plain, memorable language.',
            points: ['Copywriting', 'Social content', 'Editorial'],
          },
          {
            name: 'Digital marketing',
            summary:
              'Campaigns planned, launched and measured across the channels that matter to your audience.',
            points: ['Social media', 'Paid media', 'Web and landing pages'],
          },
          {
            name: 'Creative production',
            summary: 'From storyboard to final delivery, we produce the assets your campaign needs.',
            points: ['Video', 'Motion graphics', 'Print and events'],
          },
        ],
      },
      { key: 'visible', label: 'Show this section', type: 'bool', default: true },
      { key: 'order', label: 'Position', type: 'number', min: 1, max: 9, default: 2 },
    ],
  },
  {
    id: 'work',
    label: 'Selected work',
    group: 'Content',
    summary: 'Portfolio cards. Concept projects must stay clearly labelled.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text', max: 30, default: 'Selected work' },
      { key: 'heading', label: 'Heading', type: 'text', max: 80, default: 'Selected work' },
      {
        key: 'note',
        label: 'Disclaimer',
        type: 'textarea',
        max: 220,
        rows: 2,
        default:
          'These are concept projects created to show our approach. They are not work for real clients.',
      },
      {
        key: 'items',
        label: 'Projects',
        type: 'list',
        maxItems: 9,
        addLabel: 'Add project',
        defaultItem: { title: 'New project', blurb: '', art: 'orbit', image: '', tags: [], link: '' },
        itemLabel: (item) => item.title || 'Project',
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true, max: 40 },
          { key: 'blurb', label: 'Description', type: 'textarea', max: 200, rows: 2 },
          {
            key: 'tags',
            label: 'Tags',
            type: 'lines',
            maxLines: 4,
            max: 24,
            rows: 2,
            help: 'One tag per row.',
          },
          {
            key: 'art',
            label: 'Cover',
            type: 'select',
            default: 'orbit',
            options: [
              { value: 'orbit', label: 'Orbit artwork' },
              { value: 'bars', label: 'Data bars artwork' },
              { value: 'blob', label: 'Shape artwork' },
              { value: 'image', label: 'Uploaded image' },
            ],
            help: 'Generated artwork keeps concept projects honest — no stock photos needed.',
          },
          { key: 'image', label: 'Image', type: 'image', default: '', help: 'Used when the cover is set to “Uploaded image”.' },
          { key: 'link', label: 'External link (optional)', type: 'url', max: 300, default: '' },
        ],
        default: [
          { title: 'Orbit', blurb: 'A concept identity for a national innovation week.', art: 'orbit', tags: ['Identity', 'Concept'] },
          {
            title: 'Signal',
            blurb: 'A concept public-awareness campaign built around simple data visuals.',
            art: 'bars',
            tags: ['Campaign', 'Concept'],
          },
          {
            title: 'Aura',
            blurb: 'A concept launch for a lifestyle brand with a bold, playful look.',
            art: 'blob',
            tags: ['Launch', 'Concept'],
          },
        ],
      },
      { key: 'visible', label: 'Show this section', type: 'bool', default: true },
      { key: 'order', label: 'Position', type: 'number', min: 1, max: 9, default: 3 },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    group: 'Content',
    summary: 'Contact copy, studio details and where enquiries are emailed.',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text', max: 30, default: 'Contact' },
      {
        key: 'heading',
        label: 'Heading',
        type: 'textarea',
        max: 160,
        rows: 3,
        default: 'Tell us what you are building.',
      },
      {
        key: 'body',
        label: 'Paragraph',
        type: 'textarea',
        max: 400,
        rows: 3,
        default: 'Share a few details about your project and we will reply by email.',
      },
      {
        key: 'studio',
        label: 'Studio / address',
        type: 'text',
        max: 120,
        default: 'Abu Dhabi, United Arab Emirates',
      },
      { key: 'email', label: 'Public email', type: 'email', max: 120, default: '' },
      { key: 'phone', label: 'Phone', type: 'text', max: 40, default: '' },
      {
        key: 'hours',
        label: 'Working hours',
        type: 'text',
        max: 120,
        default: '',
        help: 'Optional. Hidden on the site when empty.',
      },
      {
        key: 'formNote',
        label: 'Form note',
        type: 'text',
        max: 160,
        default: '',
        help: 'Optional line under the submit button.',
      },
      {
        key: 'notifyEmail',
        label: 'Notification email (private)',
        type: 'email',
        max: 160,
        default: '',
        help: 'Where new enquiries are emailed. Never shown on the website. Falls back to MAIL_TO.',
        internal: true,
      },
      { key: 'visible', label: 'Show this section', type: 'bool', default: true },
      { key: 'order', label: 'Position', type: 'number', min: 1, max: 9, default: 4 },
    ],
  },
  {
    id: 'footer',
    label: 'Footer',
    group: 'Site',
    summary: 'Footer blurb, social links and the copyright line.',
    fields: [
      {
        key: 'blurb',
        label: 'Blurb',
        type: 'text',
        max: 160,
        default: 'Marketing and creative agency in Abu Dhabi.',
      },
      {
        key: 'socials',
        label: 'Social links',
        type: 'list',
        maxItems: 5,
        addLabel: 'Add social link',
        defaultItem: { label: 'LinkedIn', url: '' },
        itemLabel: (item) => item.label || 'Social link',
        fields: [
          { key: 'label', label: 'Label', type: 'text', required: true, max: 20 },
          { key: 'url', label: 'URL', type: 'url', required: true, max: 300 },
        ],
        default: [],
        help: 'Only add links that really exist.',
      },
      {
        key: 'copyright',
        label: 'Copyright text',
        type: 'text',
        max: 120,
        default: 'Stellar Media. All rights reserved.',
      },
    ],
  },
];

export const SECTION_IDS = SECTIONS.map((section) => section.id);

export function getSection(sectionId) {
  return SECTIONS.find((section) => section.id === sectionId) || null;
}

export function getSectionValue(content, sectionId) {
  return content && typeof content === 'object' ? content[sectionId] ?? null : null;
}

/* ------------------------------------------------------------------ defaults */

function defaultForField(field) {
  if (field.type === 'list') {
    const seed = Array.isArray(field.default) ? field.default : [];
    return seed.map((item) => buildObject(field.fields, item));
  }
  if (field.default !== undefined) return field.default;
  switch (field.type) {
    case 'bool':
      return false;
    case 'number':
      return field.min ?? 0;
    case 'color':
      return '#150f14';
    case 'lines':
      return [];
    case 'list':
      return [];
    default:
      return '';
  }
}

function buildObject(fields, source = {}) {
  const record = { id: source.id || FALLBACK_ID() };
  for (const field of fields) {
    const hasKey = Object.prototype.hasOwnProperty.call(source, field.key);
    record[field.key] = hasKey ? source[field.key] : defaultForField(field);
  }
  return record;
}

export function buildDefaultContent() {
  const content = {};
  for (const section of SECTIONS) {
    content[section.id] = buildObject(section.fields);
  }
  return content;
}

/* ---------------------------------------------------------------- validation */

function fail(errors, path, message) {
  errors[path] = message;
}

function validateField(field, raw, path, errors) {
  const label = field.label || field.key;

  switch (field.type) {
    case 'text': {
      const value = cleanInline(raw);
      if (field.required && !value) fail(errors, path, `${label} is required.`);
      if (field.max && value.length > field.max) {
        fail(errors, path, `${label} must be ${field.max} characters or fewer.`);
      }
      return value.slice(0, field.max || 500);
    }
    case 'textarea': {
      const value = cleanMultiline(raw);
      if (field.required && !value) fail(errors, path, `${label} is required.`);
      if (field.max && value.length > field.max) {
        fail(errors, path, `${label} must be ${field.max} characters or fewer.`);
      }
      return value.slice(0, field.max || 2000);
    }
    case 'lines': {
      const lines = cleanLines(raw, field.maxLines ?? 12, field.max ?? 80);
      if (field.required && !lines.length) fail(errors, path, `${label} needs at least one line.`);
      if (Array.isArray(raw) && raw.filter((line) => cleanInline(line)).length > (field.maxLines ?? 12)) {
        fail(errors, path, `${label} allows up to ${field.maxLines} lines.`);
      }
      return lines;
    }
    case 'url': {
      const value = cleanInline(raw);
      if (!value) {
        if (field.required) fail(errors, path, `${label} is required.`);
        return '';
      }
      if (!URL_SHAPE.test(value)) {
        fail(errors, path, `${label} must be a link such as #contact, /work, https://…, mailto:… or tel:….`);
        return '';
      }
      return value.slice(0, field.max || 300);
    }
    case 'image': {
      const value = cleanInline(raw);
      if (!value) {
        if (field.required) fail(errors, path, `${label} is required.`);
        return '';
      }
      if (!IMAGE_SHAPE.test(value)) {
        fail(errors, path, `${label} must be an uploaded file or an https:// URL.`);
        return '';
      }
      return value.slice(0, 400);
    }
    case 'email': {
      const value = cleanInline(raw).toLowerCase();
      if (!value) {
        if (field.required) fail(errors, path, `${label} is required.`);
        return '';
      }
      if (!EMAIL.test(value)) {
        fail(errors, path, `${label} must be a valid email address.`);
        return '';
      }
      return value.slice(0, field.max || 160);
    }
    case 'color': {
      const value = cleanInline(raw);
      if (!HEX.test(value)) {
        fail(errors, path, `${label} must be a hex colour like #150f14.`);
        return field.default || '#150f14';
      }
      return value.toLowerCase();
    }
    case 'number': {
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        fail(errors, path, `${label} must be a number.`);
        return field.min ?? 0;
      }
      const min = field.min ?? 0;
      const max = field.max ?? 999;
      if (value < min || value > max) {
        fail(errors, path, `${label} must be between ${min} and ${max}.`);
      }
      return Math.round(Math.min(max, Math.max(min, value)));
    }
    case 'bool':
      return raw === true || raw === 'true' || raw === 1 || raw === 'on';
    case 'select': {
      const value = cleanInline(raw);
      const allowed = (field.options || []).map((option) => option.value);
      if (!allowed.includes(value)) {
        fail(errors, path, `${label} has an unsupported value.`);
        return field.default || allowed[0] || '';
      }
      return value;
    }
    case 'list': {
      if (!Array.isArray(raw)) return [];
      if (raw.length > (field.maxItems ?? 12)) {
        fail(errors, path, `${label} allows up to ${field.maxItems} items.`);
      }
      return raw.slice(0, field.maxItems ?? 12).map((item, index) => {
        const source = item && typeof item === 'object' ? item : {};
        const record = validateFields(field.fields, source, `${path}[${index}]`, errors);
        record.id =
          typeof source.id === 'string' && source.id.length <= 64 ? source.id : FALLBACK_ID();
        return record;
      });
    }
    default:
      return raw;
  }
}

function validateFields(fields, source, path, errors) {
  const record = {};
  for (const field of fields) {
    const fieldPath = path ? `${path}.${field.key}` : field.key;
    const sourceHasKey = source && Object.prototype.hasOwnProperty.call(source, field.key);
    const raw = sourceHasKey ? source[field.key] : undefined;
    record[field.key] = validateField(field, raw, fieldPath, errors);
  }
  return record;
}

/**
 * Validates and normalises one section of content.
 * @returns {{ ok: true, value: object } | { ok: false, errors: Record<string,string> }}
 */
export function validateSection(sectionId, input) {
  const section = getSection(sectionId);
  if (!section) return { ok: false, errors: { _: 'Unknown section.' } };

  const errors = {};
  const value = validateFields(section.fields, input && typeof input === 'object' ? input : {}, '', errors);

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value };
}

/** Human-friendly errors for a generic banner. */
export function firstError(errors) {
  const key = Object.keys(errors || {})[0];
  return key ? errors[key] : 'Please check the highlighted fields.';
}
