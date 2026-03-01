/**
 * Unit tests for mobile/src/utils/consultationUtils.ts
 *
 * Tests the pure data-normalization functions that fix:
 *  - #95: crash/error when visit cards are tapped (bad API shapes crash the renderer)
 *  - #96: wrong message posted after stopping transcription
 *  - #97: today-filter for "Completed Today" drill-down
 */

import {
  toStringArray,
  normalizeConsultation,
  isSameLocalDay,
  formatDate,
  accumulateTranscript,
  resolveStopTranscript,
} from '../utils/consultationUtils';

// ──────────────────────────────────────────────────────────────────────────────
// toStringArray (#95)
// ──────────────────────────────────────────────────────────────────────────────
describe('toStringArray', () => {
  it('returns empty array for null', () => {
    expect(toStringArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(toStringArray(undefined)).toEqual([]);
  });

  it('returns empty array for non-array primitives', () => {
    expect(toStringArray('string')).toEqual([]);
    expect(toStringArray(42)).toEqual([]);
    expect(toStringArray({})).toEqual([]);
  });

  it('returns the same string array when input is already strings', () => {
    expect(toStringArray(['fever', 'cough'])).toEqual(['fever', 'cough']);
  });

  it('extracts .name from objects — the exact shape the API returned that caused #95', () => {
    const input = [{ name: 'Hypertension', confidence: 0.9 }, { name: 'Diabetes' }];
    expect(toStringArray(input)).toEqual(['Hypertension', 'Diabetes']);
  });

  it('extracts .label from objects', () => {
    expect(toStringArray([{ label: 'Flu' }])).toEqual(['Flu']);
  });

  it('extracts .title from objects', () => {
    expect(toStringArray([{ title: 'Migraine' }])).toEqual(['Migraine']);
  });

  it('falls back to String() for objects with no name/label/title', () => {
    // Should not throw — just stringify and filter
    const result = toStringArray([{ foo: 'bar' }]);
    // [object Object] is non-empty so it won't be filtered
    expect(result).toHaveLength(1);
  });

  it('filters out empty strings', () => {
    expect(toStringArray(['', 'headache', ''])).toEqual(['headache']);
  });

  it('handles mixed string/object arrays', () => {
    const input = ['fever', { name: 'Hypertension' }, 'cough'];
    expect(toStringArray(input)).toEqual(['fever', 'Hypertension', 'cough']);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// normalizeConsultation (#95)
// ──────────────────────────────────────────────────────────────────────────────
describe('normalizeConsultation', () => {
  const completeRaw = {
    id: 'c-001',
    patientId: 'p-001',
    patientName: 'Alice Smith',
    patientAvatar: 'https://example.com/avatar.jpg',
    doctorName: 'Dr. Brown',
    roomName: 'room-1',
    completedAt: '2026-03-01T10:00:00.000Z',
    summary: 'General checkup',
    chiefComplaint: 'Headache',
    urgency: 'medium',
    notes: 'Take ibuprofen',
    possibleConditions: ['Tension headache'],
    nextSteps: ['Follow up in 2 weeks'],
    reportStatus: 'ready' as const,
    report: 'Full report text',
  };

  it('passes through complete data without modification', () => {
    const result = normalizeConsultation(completeRaw, 0);
    expect(result.id).toBe('c-001');
    expect(result.patientName).toBe('Alice Smith');
    expect(result.doctorName).toBe('Dr. Brown');
    expect(result.chiefComplaint).toBe('Headache');
    expect(result.urgency).toBe('medium');
    expect(result.possibleConditions).toEqual(['Tension headache']);
    expect(result.nextSteps).toEqual(['Follow up in 2 weeks']);
    expect(result.reportStatus).toBe('ready');
    expect(result.report).toBe('Full report text');
  });

  it('uses fallback id when id is missing — prevents "undefined" key errors (#95)', () => {
    const result = normalizeConsultation({}, 5);
    expect(result.id).toBe('consultation-5');
  });

  it('prefers _id when id is absent', () => {
    const result = normalizeConsultation({ _id: 'mongo-id' }, 0);
    expect(result.id).toBe('mongo-id');
  });

  it('sets patientName to "Unknown patient" when all name fields are absent', () => {
    const result = normalizeConsultation({ id: 'x' }, 0);
    expect(result.patientName).toBe('Unknown patient');
  });

  it('extracts patientName from nested patient.name', () => {
    const result = normalizeConsultation({ id: 'x', patient: { name: 'Bob' } }, 0);
    expect(result.patientName).toBe('Bob');
  });

  it('sets doctorName to "Doctor" when absent', () => {
    const result = normalizeConsultation({ id: 'x' }, 0);
    expect(result.doctorName).toBe('Doctor');
  });

  it('sets chiefComplaint to null when field is missing — avoids .toString() crash (#95)', () => {
    const result = normalizeConsultation({ id: 'x' }, 0);
    expect(result.chiefComplaint).toBeNull();
  });

  it('sets chiefComplaint to null when field is a non-string object', () => {
    const result = normalizeConsultation({ id: 'x', chiefComplaint: { text: 'pain' } }, 0);
    expect(result.chiefComplaint).toBeNull();
  });

  it('sets urgency to null when missing', () => {
    const result = normalizeConsultation({ id: 'x' }, 0);
    expect(result.urgency).toBeNull();
  });

  it('normalizes object-shaped possibleConditions to strings (#95)', () => {
    const raw = {
      id: 'x',
      possibleConditions: [
        { name: 'Hypertension', confidence: 0.9 },
        { name: 'Diabetes' },
      ],
    };
    const result = normalizeConsultation(raw, 0);
    expect(result.possibleConditions).toEqual(['Hypertension', 'Diabetes']);
  });

  it('handles null possibleConditions gracefully — the root cause of #95', () => {
    const result = normalizeConsultation({ id: 'x', possibleConditions: null }, 0);
    expect(result.possibleConditions).toEqual([]);
  });

  it('handles undefined nextSteps gracefully', () => {
    const result = normalizeConsultation({ id: 'x' }, 0);
    expect(result.nextSteps).toEqual([]);
  });

  it('uses completedAt fallback chain when completedAt is absent', () => {
    const endedAt = '2026-03-01T09:00:00.000Z';
    const result = normalizeConsultation({ id: 'x', endedAt }, 0);
    expect(result.completedAt).toBe(endedAt);
  });

  it('returns empty string for notes when absent', () => {
    const result = normalizeConsultation({ id: 'x' }, 0);
    expect(result.notes).toBe('');
  });

  it('returns empty string for report when field is not a string', () => {
    const result = normalizeConsultation({ id: 'x', report: { text: 'foo' } }, 0);
    expect(result.report).toBe('');
  });

  it('does not throw when raw is null', () => {
    expect(() => normalizeConsultation(null, 0)).not.toThrow();
  });

  it('does not throw when raw is undefined', () => {
    expect(() => normalizeConsultation(undefined, 0)).not.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// isSameLocalDay (#97 — Completed Today filter)
// ──────────────────────────────────────────────────────────────────────────────
describe('isSameLocalDay', () => {
  it('returns true for the current date at midnight', () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expect(isSameLocalDay(now.toISOString())).toBe(true);
  });

  it('returns true for the current date at end of day', () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    expect(isSameLocalDay(now.toISOString())).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isSameLocalDay(yesterday.toISOString())).toBe(false);
  });

  it('returns false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isSameLocalDay(tomorrow.toISOString())).toBe(false);
  });

  it('returns false for a date a year ago', () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 1);
    expect(isSameLocalDay(old.toISOString())).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// formatDate
// ──────────────────────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('returns a non-empty string for a valid ISO timestamp', () => {
    const result = formatDate('2026-03-01T10:30:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Contains the separator
    expect(result).toContain('·');
  });

  it('does not throw for an epoch timestamp', () => {
    expect(() => formatDate('1970-01-01T00:00:00.000Z')).not.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// accumulateTranscript (#96, #86 — continuous STT mode)
// ──────────────────────────────────────────────────────────────────────────────
describe('accumulateTranscript', () => {
  it('returns the new utterance when existing is empty', () => {
    expect(accumulateTranscript('', 'hello')).toBe('hello');
  });

  it('appends with a space when existing is non-empty', () => {
    expect(accumulateTranscript('hello', 'world')).toBe('hello world');
  });

  it('ignores whitespace-only new utterance', () => {
    expect(accumulateTranscript('existing', '   ')).toBe('existing');
  });

  it('returns existing unchanged when new utterance is empty', () => {
    expect(accumulateTranscript('existing', '')).toBe('existing');
  });

  it('handles multi-sentence accumulation', () => {
    let acc = '';
    acc = accumulateTranscript(acc, 'I have a headache.');
    acc = accumulateTranscript(acc, 'It started this morning.');
    acc = accumulateTranscript(acc, 'The pain is throbbing.');
    expect(acc).toBe('I have a headache. It started this morning. The pain is throbbing.');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// resolveStopTranscript (#96 — stop button uses wrong text)
// ──────────────────────────────────────────────────────────────────────────────
describe('resolveStopTranscript', () => {
  it('prefers accumulated ref over transient and state — the fix for #96', () => {
    // Before the fix: stop button used `transcript` (state), which lagged behind
    const accumulated = 'I have chest pain since yesterday';
    const transient = 'chest pain'; // partial interim result
    const stateValue = 'previous message'; // stale React state — what caused #96

    expect(resolveStopTranscript(accumulated, transient, stateValue))
      .toBe('I have chest pain since yesterday');
  });

  it('falls back to transient when accumulated is empty', () => {
    expect(resolveStopTranscript('', 'transient text', 'state value'))
      .toBe('transient text');
  });

  it('falls back to state value when both ref values are empty', () => {
    expect(resolveStopTranscript('', '', 'state value')).toBe('state value');
  });

  it('returns empty string when all sources are empty', () => {
    expect(resolveStopTranscript('', '', '')).toBe('');
  });

  it('does not return stale state when accumulated has content', () => {
    const result = resolveStopTranscript('correct text', '', 'stale old text');
    expect(result).toBe('correct text');
    expect(result).not.toBe('stale old text');
  });
});
