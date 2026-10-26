import { getDb } from './store.js';
import { SECTIONS } from './sections.js';

export function getContent() {
  return structuredClone(getDb().content);
}

/** Content minus fields marked `internal` in the schema (never sent to the browser). */
export function getPublicContent() {
  const content = getContent();
  for (const section of SECTIONS) {
    for (const field of section.fields) {
      if (field.internal) delete content[section.id][field.key];
    }
  }
  return content;
}

export function getSectionContent(sectionId) {
  return getContent()[sectionId] ?? null;
}

/** Sections that have visibility/order controls, sorted for the public page. */
export function orderedSections(content) {
  return ['about', 'services', 'work', 'contact']
    .map((sectionId) => {
      const section = content[sectionId] || {};
      return {
        id: sectionId,
        visible: section.visible !== false,
        order: Number.isFinite(Number(section.order)) ? Number(section.order) : 99,
      };
    })
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order)
    .map((section) => section.id);
}
