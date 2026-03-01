/**
 * Consultations API Tests
 *
 * Covers:
 *  - POST /api/consultations/:patientId/complete      (#97 — records completed consultations)
 *  - GET  /api/consultations/:patientId/history       (#95 — patient-level history)
 *  - GET  /api/consultations/all                      (#97 — doctor-level history, sorted newest-first)
 *  - PUT  /api/consultations/:patientId/notes         (notes persistence)
 *  - PATCH /api/consultations/:patientId/report       (#99 — update report draft)
 *  - POST /api/consultations/:patientId/report/sign   (#99 — sign and finalize report)
 */

import request from 'supertest';
import express from 'express';
import consultationsRouter from '../routes/consultations';
import {
  consultationHistory,
  consultationNotes,
  patientProfiles,
} from '../storage';

// ──────────────────────────────────────────────────────────────────────────────
// Test App
// ──────────────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/consultations', consultationsRouter);

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Clear all in-memory consultation state between tests. */
function clearConsultationState() {
  for (const key of Object.keys(consultationHistory)) {
    delete consultationHistory[key];
  }
  for (const key of Object.keys(consultationNotes)) {
    delete consultationNotes[key];
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/consultations/:patientId/notes
// ──────────────────────────────────────────────────────────────────────────────
describe('PUT /api/consultations/:patientId/notes', () => {
  beforeEach(clearConsultationState);

  it('saves notes for a patient', async () => {
    const res = await request(app)
      .put('/api/consultations/p1/notes')
      .send({ notes: 'Patient reports headache', roomName: 'room-abc' })
      .expect(200);

    expect(res.body.data.notes).toBe('Patient reports headache');
    expect(res.body.data.patientId).toBe('p1');
    expect(res.body.data.roomName).toBe('room-abc');
  });

  it('returns 400 when notes field is missing', async () => {
    await request(app)
      .put('/api/consultations/p1/notes')
      .send({ roomName: 'room-abc' })
      .expect(400);
  });

  it('overwrites previously saved notes', async () => {
    await request(app)
      .put('/api/consultations/p1/notes')
      .send({ notes: 'First note' })
      .expect(200);

    const res = await request(app)
      .put('/api/consultations/p1/notes')
      .send({ notes: 'Updated note' })
      .expect(200);

    expect(res.body.data.notes).toBe('Updated note');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/consultations/:patientId/notes
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/consultations/:patientId/notes', () => {
  beforeEach(clearConsultationState);

  it('returns 404 when no notes exist for patient', async () => {
    await request(app).get('/api/consultations/nobody/notes').expect(404);
  });

  it('returns saved notes', async () => {
    await request(app)
      .put('/api/consultations/p2/notes')
      .send({ notes: 'Hypertension noted' });

    const res = await request(app)
      .get('/api/consultations/p2/notes')
      .expect(200);

    expect(res.body.notes).toBe('Hypertension noted');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/consultations/:patientId/complete  (#97)
// ──────────────────────────────────────────────────────────────────────────────
describe('POST /api/consultations/:patientId/complete', () => {
  beforeEach(clearConsultationState);

  it('records a consultation and returns it', async () => {
    const res = await request(app)
      .post('/api/consultations/patient-1/complete')
      .send({ roomName: 'room-xyz', doctorName: 'Dr. Smith' })
      .expect(200);

    const { data } = res.body;
    expect(data.patientId).toBe('patient-1');
    expect(data.doctorName).toBe('Dr. Smith');
    expect(data.roomName).toBe('room-xyz');
    expect(data.id).toMatch(/^consultation-/);
    expect(data.completedAt).toBeDefined();
    expect(new Date(data.completedAt).getTime()).toBeGreaterThan(0);
  });

  it('uses fallback doctorName "Doctor" when not provided', async () => {
    const res = await request(app)
      .post('/api/consultations/patient-2/complete')
      .send({ roomName: 'room-123' })
      .expect(200);

    expect(res.body.data.doctorName).toBe('Doctor');
  });

  it('stores consultation in history for subsequent GET', async () => {
    await request(app)
      .post('/api/consultations/patient-3/complete')
      .send({ roomName: 'room-1', doctorName: 'Dr. Jones' });

    await request(app)
      .post('/api/consultations/patient-3/complete')
      .send({ roomName: 'room-2', doctorName: 'Dr. Jones' });

    const histRes = await request(app)
      .get('/api/consultations/patient-3/history')
      .expect(200);

    expect(Array.isArray(histRes.body)).toBe(true);
    expect(histRes.body).toHaveLength(2);
  });

  it('attaches notes from the same room to the consultation', async () => {
    await request(app)
      .put('/api/consultations/patient-4/notes')
      .send({ notes: 'Fever for 3 days', roomName: 'room-match' });

    const res = await request(app)
      .post('/api/consultations/patient-4/complete')
      .send({ roomName: 'room-match', doctorName: 'Dr. Lee' })
      .expect(200);

    expect(res.body.data.notes).toBe('Fever for 3 days');
  });

  it('does NOT attach notes from a different room', async () => {
    await request(app)
      .put('/api/consultations/patient-5/notes')
      .send({ notes: 'Old notes', roomName: 'room-old' });

    const res = await request(app)
      .post('/api/consultations/patient-5/complete')
      .send({ roomName: 'room-new', doctorName: 'Dr. Kim' })
      .expect(200);

    expect(res.body.data.notes).toBe('');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/consultations/:patientId/history  (#95)
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/consultations/:patientId/history', () => {
  beforeEach(clearConsultationState);

  it('returns empty array when no history exists', async () => {
    const res = await request(app)
      .get('/api/consultations/unknown-patient/history')
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('returns all consultations for a patient in insertion order', async () => {
    await request(app)
      .post('/api/consultations/p10/complete')
      .send({ roomName: 'r1', doctorName: 'Dr. A' });

    await request(app)
      .post('/api/consultations/p10/complete')
      .send({ roomName: 'r2', doctorName: 'Dr. B' });

    const res = await request(app)
      .get('/api/consultations/p10/history')
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body[0].roomName).toBe('r1');
    expect(res.body[1].roomName).toBe('r2');
  });

  it('does not include consultations for other patients', async () => {
    await request(app)
      .post('/api/consultations/p11/complete')
      .send({ roomName: 'r11', doctorName: 'Dr. X' });

    await request(app)
      .post('/api/consultations/p12/complete')
      .send({ roomName: 'r12', doctorName: 'Dr. Y' });

    const res = await request(app)
      .get('/api/consultations/p11/history')
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].roomName).toBe('r11');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/consultations/all  (#97 — doctor-level history, sorted newest-first)
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/consultations/all', () => {
  beforeEach(clearConsultationState);

  it('returns empty array when no consultations exist', async () => {
    const res = await request(app)
      .get('/api/consultations/all')
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('returns consultations across all patients', async () => {
    await request(app)
      .post('/api/consultations/pa/complete')
      .send({ roomName: 'ra', doctorName: 'Dr. One' });

    await request(app)
      .post('/api/consultations/pb/complete')
      .send({ roomName: 'rb', doctorName: 'Dr. Two' });

    const res = await request(app).get('/api/consultations/all').expect(200);

    expect(res.body).toHaveLength(2);
    const rooms = res.body.map((c: any) => c.roomName);
    expect(rooms).toContain('ra');
    expect(rooms).toContain('rb');
  });

  it('returns results sorted newest-first (#97)', async () => {
    // Record multiple consultations with small delays so completedAt differs
    await request(app)
      .post('/api/consultations/pc/complete')
      .send({ roomName: 'first' });

    // Inject a second consultation with a later timestamp directly
    if (!consultationHistory['pc']) {
      (consultationHistory as any)['pc'] = [];
    }
    consultationHistory['pc'].push({
      id: 'consultation-later',
      patientId: 'pc',
      roomName: 'second',
      doctorName: 'Doctor',
      completedAt: new Date(Date.now() + 5000).toISOString(), // 5 s in the future
      notes: '',
    });

    const res = await request(app).get('/api/consultations/all').expect(200);

    const pcConsultations = res.body.filter((c: any) => c.patientId === 'pc');
    expect(pcConsultations.length).toBeGreaterThanOrEqual(2);
    // Newest first → 'second' should come before 'first'
    expect(pcConsultations[0].roomName).toBe('second');
    expect(pcConsultations[1].roomName).toBe('first');
  });

  it('enriches consultations with patientName from profile (#97)', async () => {
    // Seed a patient profile
    (patientProfiles as any)['profile-patient'] = {
      id: 'profile-patient',
      name: 'John Doe',
    };

    await request(app)
      .post('/api/consultations/profile-patient/complete')
      .send({ roomName: 'rp', doctorName: 'Dr. Z' });

    const res = await request(app).get('/api/consultations/all').expect(200);

    const entry = res.body.find((c: any) => c.patientId === 'profile-patient');
    expect(entry).toBeDefined();
    expect(entry.patientName).toBe('John Doe');

    // Cleanup profile
    delete patientProfiles['profile-patient'];
  });

  it('falls back to shortened patientId when no profile exists', async () => {
    await request(app)
      .post('/api/consultations/noprofile-abc123/complete')
      .send({ roomName: 'rnp' });

    const res = await request(app).get('/api/consultations/all').expect(200);

    const entry = res.body.find((c: any) => c.patientId === 'noprofile-abc123');
    expect(entry).toBeDefined();
    // Backend uses patientId.slice(0, 6) → 'noprof' from 'noprofile-abc123'
    expect(entry.patientName).toMatch(/^Patient noprof/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/consultations/:patientId/report  (#99 — update report draft)
// ──────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/consultations/:patientId/report', () => {
  beforeEach(clearConsultationState);

  it('returns 404 when no consultation exists for patient', async () => {
    await request(app)
      .patch('/api/consultations/nobody/report')
      .send({ report: 'Some report text' })
      .expect(404);
  });

  it('returns 400 when report field is missing', async () => {
    // First create a consultation
    await request(app)
      .post('/api/consultations/rep-patient/complete')
      .send({ roomName: 'room-rep' });

    await request(app)
      .patch('/api/consultations/rep-patient/report')
      .send({})
      .expect(400);
  });

  it('returns 400 when report is not a string', async () => {
    await request(app)
      .post('/api/consultations/rep2/complete')
      .send({ roomName: 'room-rep2' });

    await request(app)
      .patch('/api/consultations/rep2/report')
      .send({ report: 42 })
      .expect(400);
  });

  it('updates the report and marks status as draft_ready', async () => {
    await request(app)
      .post('/api/consultations/rep3/complete')
      .send({ roomName: 'room-rep3', doctorName: 'Dr. Adams' });

    const res = await request(app)
      .patch('/api/consultations/rep3/report')
      .send({ report: 'Patient presented with fever...' })
      .expect(200);

    expect(res.body.data.report).toBe('Patient presented with fever...');
    expect(res.body.data.reportStatus).toBe('draft_ready');
    expect(res.body.data.reportUpdatedAt).toBeDefined();
  });

  it('overwrites a previous report draft', async () => {
    await request(app)
      .post('/api/consultations/rep4/complete')
      .send({ roomName: 'room-rep4' });

    await request(app)
      .patch('/api/consultations/rep4/report')
      .send({ report: 'First draft' });

    const res = await request(app)
      .patch('/api/consultations/rep4/report')
      .send({ report: 'Revised draft' })
      .expect(200);

    expect(res.body.data.report).toBe('Revised draft');
  });

  it('returns 409 when trying to update a signed_final report', async () => {
    await request(app)
      .post('/api/consultations/rep5/complete')
      .send({ roomName: 'room-rep5' });

    // Sign it first
    await request(app)
      .post('/api/consultations/rep5/report/sign')
      .send({ signerName: 'Dr. Smith' });

    // Then try to update
    await request(app)
      .patch('/api/consultations/rep5/report')
      .send({ report: 'Attempting edit after signing' })
      .expect(409);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/consultations/:patientId/report/sign  (#99 — sign and finalize)
// ──────────────────────────────────────────────────────────────────────────────
describe('POST /api/consultations/:patientId/report/sign', () => {
  beforeEach(clearConsultationState);

  it('returns 404 when no consultation exists', async () => {
    await request(app)
      .post('/api/consultations/ghost/report/sign')
      .send({ signerName: 'Dr. Nobody' })
      .expect(404);
  });

  it('returns 400 when signerName is missing', async () => {
    await request(app)
      .post('/api/consultations/sign1/complete')
      .send({ roomName: 'rs1' });

    await request(app)
      .post('/api/consultations/sign1/report/sign')
      .send({ report: 'Some report' })
      .expect(400);
  });

  it('returns 400 when signerName is empty string', async () => {
    await request(app)
      .post('/api/consultations/sign2/complete')
      .send({ roomName: 'rs2' });

    await request(app)
      .post('/api/consultations/sign2/report/sign')
      .send({ signerName: '   ' })
      .expect(400);
  });

  it('signs the report and sets reportStatus to signed_final', async () => {
    await request(app)
      .post('/api/consultations/sign3/complete')
      .send({ roomName: 'rs3', doctorName: 'Dr. Carter' });

    const res = await request(app)
      .post('/api/consultations/sign3/report/sign')
      .send({ signerName: 'Dr. Carter', report: 'Final report text', signatureMethod: 'typed_name' })
      .expect(200);

    expect(res.body.data.reportStatus).toBe('signed_final');
    expect(res.body.data.signature.signerName).toBe('Dr. Carter');
    expect(res.body.data.signature.signatureMethod).toBe('typed_name');
    expect(res.body.data.signedAt).toBeDefined();
    expect(new Date(res.body.data.signedAt).getTime()).toBeGreaterThan(0);
  });

  it('stores the final report text when provided', async () => {
    await request(app)
      .post('/api/consultations/sign4/complete')
      .send({ roomName: 'rs4' });

    const res = await request(app)
      .post('/api/consultations/sign4/report/sign')
      .send({ signerName: 'Dr. Lee', report: 'Edited final report' })
      .expect(200);

    expect(res.body.data.report).toBe('Edited final report');
  });

  it('signs without report text (uses existing report)', async () => {
    await request(app)
      .post('/api/consultations/sign5/complete')
      .send({ roomName: 'rs5' });

    // First set a report draft
    await request(app)
      .patch('/api/consultations/sign5/report')
      .send({ report: 'Previously saved draft' });

    // Sign without providing report (should keep existing)
    const res = await request(app)
      .post('/api/consultations/sign5/report/sign')
      .send({ signerName: 'Dr. Park' })
      .expect(200);

    expect(res.body.data.report).toBe('Previously saved draft');
  });

  it('returns 409 when trying to sign an already-signed report', async () => {
    await request(app)
      .post('/api/consultations/sign6/complete')
      .send({ roomName: 'rs6' });

    await request(app)
      .post('/api/consultations/sign6/report/sign')
      .send({ signerName: 'Dr. Kim' });

    await request(app)
      .post('/api/consultations/sign6/report/sign')
      .send({ signerName: 'Dr. Kim Again' })
      .expect(409);
  });

  it('defaults signatureMethod to typed_name when not provided', async () => {
    await request(app)
      .post('/api/consultations/sign7/complete')
      .send({ roomName: 'rs7' });

    const res = await request(app)
      .post('/api/consultations/sign7/report/sign')
      .send({ signerName: 'Dr. Default' })
      .expect(200);

    expect(res.body.data.signature.signatureMethod).toBe('typed_name');
  });

  it('signed report is reflected in /history for the patient', async () => {
    await request(app)
      .post('/api/consultations/sign8/complete')
      .send({ roomName: 'rs8', doctorName: 'Dr. Hall' });

    await request(app)
      .post('/api/consultations/sign8/report/sign')
      .send({ signerName: 'Dr. Hall', report: 'Signed report text' });

    const histRes = await request(app)
      .get('/api/consultations/sign8/history')
      .expect(200);

    expect(histRes.body).toHaveLength(1);
    expect(histRes.body[0].reportStatus).toBe('signed_final');
    expect(histRes.body[0].signature.signerName).toBe('Dr. Hall');
  });
});
