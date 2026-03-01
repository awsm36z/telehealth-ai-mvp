/**
 * Consultations API Tests
 *
 * Covers:
 *  - POST /api/consultations/:patientId/complete  (#97 — records completed consultations)
 *  - GET  /api/consultations/:patientId/history   (#95 — patient-level history)
 *  - GET  /api/consultations/all                  (#97 — doctor-level history, sorted newest-first)
 *  - PUT  /api/consultations/:patientId/notes     (notes persistence)
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
