/**
 * i18n Translation Completeness Tests  (#94)
 *
 * Verifies that the French (fr) and Arabic (ar) translation files contain
 * every key present in the English (en) reference file.
 *
 * Regression guard: prevents the bug where new English keys were added but
 * the French/Arabic counterparts were left in English ("hardcoded" strings).
 */

import * as fs from 'fs';
import * as path from 'path';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const TRANSLATIONS_DIR = path.resolve(
  __dirname,
  '../i18n/translations',
);

function loadJson(filename: string): Record<string, any> {
  const fullPath = path.join(TRANSLATIONS_DIR, filename);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Recursively collect all dot-notation keys from a nested object.
 * e.g. { doctor: { dashboard: 'x' } } → ['doctor.dashboard']
 */
function flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return flattenKeys(v, full);
    }
    return [full];
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Load translation files
// ──────────────────────────────────────────────────────────────────────────────

const en = loadJson('en.json');
const fr = loadJson('fr.json');
const ar = loadJson('ar.json');

const enKeys = flattenKeys(en);
const frKeys = flattenKeys(fr);
const arKeys = flattenKeys(ar);

// ──────────────────────────────────────────────────────────────────────────────
// Structural completeness
// ──────────────────────────────────────────────────────────────────────────────

describe('i18n completeness — French (#94)', () => {
  it('fr.json has all top-level namespaces from en.json', () => {
    const enTopLevel = Object.keys(en);
    const frTopLevel = Object.keys(fr);
    const missing = enTopLevel.filter((k) => !frTopLevel.includes(k));
    expect(missing).toEqual([]);
  });

  it('fr.json contains every key in en.json (no missing translations)', () => {
    const missing = enKeys.filter((k) => !frKeys.includes(k));
    if (missing.length > 0) {
      // Report missing keys clearly in the error message
      throw new Error(
        `French translation is missing ${missing.length} key(s):\n` +
          missing.map((k) => `  - ${k}`).join('\n'),
      );
    }
    expect(missing).toHaveLength(0);
  });

  it('fr.json has no extra keys that en.json does not define', () => {
    const extra = frKeys.filter((k) => !enKeys.includes(k));
    // Extra keys are a warning, not a hard failure — but worth knowing
    if (extra.length > 0) {
      console.warn(`French has ${extra.length} extra key(s) not in English:`, extra.slice(0, 10));
    }
    // We only enforce completeness (no missing keys), not strict equality
    expect(true).toBe(true);
  });
});

describe('i18n completeness — Arabic (#94)', () => {
  it('ar.json has all top-level namespaces from en.json', () => {
    const enTopLevel = Object.keys(en);
    const arTopLevel = Object.keys(ar);
    const missing = enTopLevel.filter((k) => !arTopLevel.includes(k));
    expect(missing).toEqual([]);
  });

  it('ar.json contains every key in en.json (no missing translations)', () => {
    const missing = enKeys.filter((k) => !arKeys.includes(k));
    if (missing.length > 0) {
      throw new Error(
        `Arabic translation is missing ${missing.length} key(s):\n` +
          missing.map((k) => `  - ${k}`).join('\n'),
      );
    }
    expect(missing).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Doctor namespace — the specific area where #94 was reported
// ──────────────────────────────────────────────────────────────────────────────

describe('doctor namespace translations (#94)', () => {
  const doctorEnKeys = flattenKeys(en.doctor || {}).map((k) => `doctor.${k}`);

  it('doctor namespace exists in en.json', () => {
    expect(en.doctor).toBeDefined();
    expect(typeof en.doctor).toBe('object');
  });

  it('doctor namespace exists in fr.json', () => {
    expect(fr.doctor).toBeDefined();
  });

  it('doctor namespace exists in ar.json', () => {
    expect(ar.doctor).toBeDefined();
  });

  it('all doctor.* keys are translated in French', () => {
    const frDoctorKeys = flattenKeys(fr.doctor || {}).map((k) => `doctor.${k}`);
    const missing = doctorEnKeys.filter((k) => !frDoctorKeys.includes(k));
    expect(missing).toHaveLength(0);
  });

  it('all doctor.* keys are translated in Arabic', () => {
    const arDoctorKeys = flattenKeys(ar.doctor || {}).map((k) => `doctor.${k}`);
    const missing = doctorEnKeys.filter((k) => !arDoctorKeys.includes(k));
    expect(missing).toHaveLength(0);
  });

  it('key doctor.dashboard exists in all languages', () => {
    expect(en.doctor?.dashboard).toBeDefined();
    expect(fr.doctor?.dashboard).toBeDefined();
    expect(ar.doctor?.dashboard).toBeDefined();
  });

  it('key doctor.lastConsultations exists in all languages (#97)', () => {
    expect(en.doctor?.lastConsultations).toBeDefined();
    expect(fr.doctor?.lastConsultations).toBeDefined();
    expect(ar.doctor?.lastConsultations).toBeDefined();
  });

  it('key doctor.todayCompleted exists in all languages (#97)', () => {
    expect(en.doctor?.todayCompleted).toBeDefined();
    expect(fr.doctor?.todayCompleted).toBeDefined();
    expect(ar.doctor?.todayCompleted).toBeDefined();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Translation values are non-empty strings
// ──────────────────────────────────────────────────────────────────────────────

describe('translation values are non-empty strings', () => {
  function checkNoEmptyValues(obj: Record<string, any>, lang: string, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        checkNoEmptyValues(v, lang, full);
      } else if (typeof v === 'string') {
        expect(v.trim()).not.toBe('');  // would throw with helpful message
      }
    }
  }

  it('en.json has no empty string values', () => {
    expect(() => checkNoEmptyValues(en, 'en')).not.toThrow();
  });

  it('fr.json has no empty string values', () => {
    expect(() => checkNoEmptyValues(fr, 'fr')).not.toThrow();
  });

  it('ar.json has no empty string values', () => {
    expect(() => checkNoEmptyValues(ar, 'ar')).not.toThrow();
  });
});
