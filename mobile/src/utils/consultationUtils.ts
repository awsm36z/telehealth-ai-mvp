/**
 * Pure utility functions for consultation data normalization and display.
 * No React / React Native dependencies — safe to import in Node test environments.
 */

export type Consultation = {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar: string | null;
  doctorName: string;
  roomName: string;
  completedAt: string;
  summary: string;
  chiefComplaint: string | null;
  urgency: string | null;
  notes: string;
  possibleConditions: string[];
  nextSteps: string[];
  reportStatus?: 'draft_generating' | 'draft_ready' | 'signed_final' | 'generating' | 'ready' | 'failed';
  report?: string;
  signedAt?: string;
  signature?: {
    signerName: string;
    signedAt: string;
    signatureMethod: string;
  };
};

export type SignatureMetadata = {
  signerName: string;
  signedAt: string;
  signatureMethod: string;
};

/**
 * Safely convert an unknown value to a string array.
 * Handles: string[], object[] (extracts .name/.label/.title), mixed arrays.
 * Fixes #95 — API can return possibleConditions as objects, not plain strings.
 */
export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') {
        const name = (entry as any).name || (entry as any).label || (entry as any).title;
        if (typeof name === 'string') return name;
      }
      return String(entry ?? '').trim();
    })
    .filter(Boolean);
}

/**
 * Normalize a raw consultation object from the API into a typed Consultation.
 * Handles multiple field-name conventions and missing/null fields gracefully.
 * Fixes #95 — raw API responses caused render errors when fields were missing.
 */
export function normalizeConsultation(raw: any, index: number): Consultation {
  const id = String(raw?.id || raw?._id || raw?.consultationId || `consultation-${index}`);
  const completedAt =
    raw?.completedAt || raw?.endedAt || raw?.updatedAt || new Date().toISOString();
  const patientName =
    raw?.patientName || raw?.patient?.name || raw?.name || 'Unknown patient';
  return {
    id,
    patientId: String(raw?.patientId || raw?.patient?._id || raw?.patient?.id || ''),
    patientName,
    patientAvatar: raw?.patientAvatar || null,
    doctorName: raw?.doctorName || raw?.doctor?.name || 'Doctor',
    roomName: raw?.roomName || '',
    completedAt,
    summary: typeof raw?.summary === 'string' ? raw.summary : '',
    chiefComplaint: typeof raw?.chiefComplaint === 'string' ? raw.chiefComplaint : null,
    urgency: typeof raw?.urgency === 'string' ? raw.urgency : null,
    notes: typeof raw?.notes === 'string' ? raw.notes : '',
    possibleConditions: toStringArray(raw?.possibleConditions),
    nextSteps: toStringArray(raw?.nextSteps),
    reportStatus: raw?.reportStatus,
    report: typeof raw?.report === 'string' ? raw.report : '',
    signedAt: typeof raw?.signedAt === 'string' ? raw.signedAt : undefined,
    signature: raw?.signature && typeof raw.signature === 'object' ? raw.signature : undefined,
  };
}

/**
 * Returns true when the ISO timestamp falls on the same local calendar day as now.
 * Used to filter "Completed Today" consultations (#97).
 */
export function isSameLocalDay(iso: string): boolean {
  const day = new Date(iso);
  const now = new Date();
  return (
    day.getFullYear() === now.getFullYear() &&
    day.getMonth() === now.getMonth() &&
    day.getDate() === now.getDate()
  );
}

/**
 * Format an ISO timestamp as a human-readable date + time string.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

/**
 * Accumulate a speech recognition final utterance into the running transcript.
 * Implements the continuous-mode logic that fixes #96 and #86.
 *
 * @param existing   The accumulated transcript so far (may be empty).
 * @param newUtterance  The latest isFinal utterance from the STT engine.
 * @returns The new accumulated string.
 */
export function accumulateTranscript(existing: string, newUtterance: string): string {
  if (!newUtterance.trim()) return existing;
  return existing ? `${existing} ${newUtterance}` : newUtterance;
}

/**
 * Resolve which transcript to use when the user manually presses Stop.
 * Prefer the accumulated ref over the transient state value — fixes #96.
 *
 * @param accumulated  `accumulatedTranscriptRef.current`
 * @param transient    `transcriptRef.current` (last interim result)
 * @param stateValue   `transcript` React state (may lag a render behind)
 */
export function resolveStopTranscript(
  accumulated: string,
  transient: string,
  stateValue: string,
): string {
  return accumulated || transient || stateValue;
}

/**
 * Build signature metadata for a signed consultation report (#99).
 * The signerName is the doctor's full name as typed.
 */
export function buildSignatureMetadata(
  signerName: string,
  signatureMethod: 'typed_name' = 'typed_name',
): SignatureMetadata {
  return {
    signerName: signerName.trim(),
    signedAt: new Date().toISOString(),
    signatureMethod,
  };
}

/**
 * Returns true when a signed report cannot be edited directly.
 */
export function isReportImmutable(
  reportStatus?: string,
): boolean {
  return reportStatus === 'signed_final';
}
