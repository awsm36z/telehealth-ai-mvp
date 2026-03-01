/**
 * Translation key completeness tests (#105 and prior i18n work).
 *
 * Ensures that fr.json and ar.json have the same top-level and second-level
 * keys as en.json. Missing keys cause runtime fallback to the key name, which
 * surfaces as broken UI strings in French/Arabic flows.
 */

import en from '../i18n/translations/en.json';
import fr from '../i18n/translations/fr.json';
import ar from '../i18n/translations/ar.json';

type NestedRecord = Record<string, string | Record<string, string>>;

/** Collect all dot-notation keys (depth ≤ 2) from a translation object. */
function collectKeys(obj: NestedRecord, prefix = ''): string[] {
  const keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    keys.push(full);
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      for (const sub of Object.keys(obj[k] as Record<string, string>)) {
        keys.push(`${full}.${sub}`);
      }
    }
  }
  return keys;
}

const enKeys = collectKeys(en as NestedRecord);
const frKeys = new Set(collectKeys(fr as NestedRecord));
const arKeys = new Set(collectKeys(ar as NestedRecord));

describe('Translation completeness — French (fr.json)', () => {
  it('has all top-level namespace keys from en.json', () => {
    const topLevel = [...new Set(enKeys.map((k) => k.split('.')[0]))];
    for (const ns of topLevel) {
      expect(frKeys.has(ns)).toBe(true);
    }
  });

  it('has all biometrics.* keys added for #105', () => {
    const biometricKeys = enKeys.filter((k) => k.startsWith('biometrics.'));
    for (const key of biometricKeys) {
      expect(frKeys.has(key)).toBe(true);
    }
  });

  it('has all doctor.* keys added for #100–#102', () => {
    const newDoctorKeys = [
      'doctor.recommendedMeds',
      'doctor.prescribedSection',
      'doctor.noPrescribedMeds',
      'doctor.possibleMedsFromDx',
      'doctor.medRationale',
      'doctor.clinicalCaution',
      'doctor.clinicalVerificationRequired',
      'doctor.moroccoDbSection',
      'doctor.moroccoDbPlaceholder',
      'doctor.moroccoDbSearch',
      'doctor.noMoroccoResults',
      'doctor.addToPrescription',
    ];
    for (const key of newDoctorKeys) {
      expect(frKeys.has(key)).toBe(true);
    }
  });
});

describe('Translation completeness — Arabic (ar.json)', () => {
  it('has all top-level namespace keys from en.json', () => {
    const topLevel = [...new Set(enKeys.map((k) => k.split('.')[0]))];
    for (const ns of topLevel) {
      expect(arKeys.has(ns)).toBe(true);
    }
  });

  it('has all biometrics.* keys added for #105', () => {
    const biometricKeys = enKeys.filter((k) => k.startsWith('biometrics.'));
    for (const key of biometricKeys) {
      expect(arKeys.has(key)).toBe(true);
    }
  });

  it('has all doctor.* keys added for #100–#102', () => {
    const newDoctorKeys = [
      'doctor.recommendedMeds',
      'doctor.prescribedSection',
      'doctor.noPrescribedMeds',
      'doctor.possibleMedsFromDx',
      'doctor.medRationale',
      'doctor.clinicalCaution',
      'doctor.clinicalVerificationRequired',
      'doctor.moroccoDbSection',
      'doctor.moroccoDbPlaceholder',
      'doctor.moroccoDbSearch',
      'doctor.noMoroccoResults',
      'doctor.addToPrescription',
    ];
    for (const key of newDoctorKeys) {
      expect(arKeys.has(key)).toBe(true);
    }
  });
});

describe('Translation values — sanity checks', () => {
  it('doctor.recommendedMeds is "Possible Medications" in EN (renamed from Recommended, #100)', () => {
    expect((en as any).doctor.recommendedMeds).toBe('Possible Medications');
  });

  it('doctor.clinicalVerificationRequired exists and is non-empty in all locales (#101)', () => {
    expect((en as any).doctor.clinicalVerificationRequired.length).toBeGreaterThan(10);
    expect((fr as any).doctor.clinicalVerificationRequired.length).toBeGreaterThan(10);
    expect((ar as any).doctor.clinicalVerificationRequired.length).toBeGreaterThan(10);
  });

  it('biometrics.logBiometrics is present in all locales (#105)', () => {
    expect((en as any).biometrics.logBiometrics).toBe('Log Biometrics');
    expect((fr as any).biometrics.logBiometrics).toBeTruthy();
    expect((ar as any).biometrics.logBiometrics).toBeTruthy();
  });

  it('biometrics.continueToTriage is present in all locales (#105)', () => {
    expect((en as any).biometrics.continueToTriage).toBe('Continue to Triage');
    expect((fr as any).biometrics.continueToTriage).toBeTruthy();
    expect((ar as any).biometrics.continueToTriage).toBeTruthy();
  });

  it('biometrics.saving is present in all locales (#105)', () => {
    expect((en as any).biometrics.saving).toBe('Saving...');
    expect((fr as any).biometrics.saving).toBeTruthy();
    expect((ar as any).biometrics.saving).toBeTruthy();
  });
});
