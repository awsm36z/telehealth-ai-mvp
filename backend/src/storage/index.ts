import { Pool } from 'pg';

type BucketName =
  | 'patientBiometrics'
  | 'patientProfiles'
  | 'triageSessions'
  | 'patientInsights'
  | 'patientTriageData'
  | 'consultationNotes'
  | 'consultationHistory'
  | 'users'
  | 'activeCalls'
  | 'analyticsEvents'
  | 'analyticsMetrics';

const isPostgresMode = process.env.DATA_STORE_MODE === 'postgres' && !!process.env.DATABASE_URL;

let dbPool: Pool | null = null;
const persistTimers = new Map<BucketName, NodeJS.Timeout>();
const proxiedObjects = new WeakMap<object, any>();

function getDbPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when DATA_STORE_MODE=postgres');
  }

  if (!dbPool) {
    const shouldUseSsl =
      process.env.DATABASE_SSL === 'true' ||
      (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL !== 'false');

    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ...(shouldUseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });
  }

  return dbPool;
}

const targets: Record<BucketName, any> = {
  patientBiometrics: {},
  patientProfiles: {
    '1': {
      id: '1',
      name: 'Sarah Johnson',
      age: 32,
      email: 'l7aja@gmail.com',
    },
  },
  triageSessions: {},
  patientInsights: {},
  patientTriageData: {},
  consultationNotes: {},
  consultationHistory: {},
  users: [],
  activeCalls: {},
  analyticsEvents: [],
  analyticsMetrics: {
    triageStarted: 0,
    triageCompleted: 0,
    triageAbandoned: 0,
    emergencyDetected: 0,
    videoCallsStarted: 0,
    videoCallsCompleted: 0,
    avgTriageDurationMs: 0,
    totalTriageDurationMs: 0,
    aiAssistQueries: 0,
    registrations: 0,
  },
};

function applyLoadedState(target: any, loaded: any) {
  if (Array.isArray(target)) {
    target.splice(0, target.length, ...(Array.isArray(loaded) ? loaded : []));
    return;
  }

  Object.keys(target).forEach((key) => delete target[key]);
  if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
    Object.assign(target, loaded);
  }
}

async function persistBucket(bucket: BucketName) {
  if (!isPostgresMode) return;

  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO app_state (bucket, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (bucket)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [bucket, JSON.stringify(targets[bucket])]
  );
}

function schedulePersist(bucket: BucketName) {
  if (!isPostgresMode) return;

  const existing = persistTimers.get(bucket);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(async () => {
    persistTimers.delete(bucket);
    try {
      await persistBucket(bucket);
    } catch (error) {
      console.error(`Failed to persist bucket "${bucket}":`, error);
    }
  }, 150);

  persistTimers.set(bucket, timer);
}

function createTrackedProxy<T extends object>(bucket: BucketName, source: T): T {
  if (proxiedObjects.has(source)) {
    return proxiedObjects.get(source);
  }

  const proxy = new Proxy(source, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (value && typeof value === 'object') {
        return createTrackedProxy(bucket, value);
      }
      return value;
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      schedulePersist(bucket);
      return result;
    },
    deleteProperty(target, prop) {
      const result = Reflect.deleteProperty(target, prop);
      schedulePersist(bucket);
      return result;
    },
  });

  proxiedObjects.set(source, proxy);
  return proxy;
}

export const patientBiometrics: Record<string, any> = createTrackedProxy('patientBiometrics', targets.patientBiometrics);
export const patientProfiles: Record<string, any> = createTrackedProxy('patientProfiles', targets.patientProfiles);
export const triageSessions: Record<string, any> = createTrackedProxy('triageSessions', targets.triageSessions);
export const patientInsights: Record<string, any> = createTrackedProxy('patientInsights', targets.patientInsights);
export const patientTriageData: Record<string, any> = createTrackedProxy('patientTriageData', targets.patientTriageData);
export const consultationNotes: Record<string, any> = createTrackedProxy('consultationNotes', targets.consultationNotes);
export const consultationHistory: Record<string, any[]> = createTrackedProxy('consultationHistory', targets.consultationHistory);
export const users: any[] = createTrackedProxy('users', targets.users);
export const activeCalls: Record<string, any> = createTrackedProxy('activeCalls', targets.activeCalls);
export const analyticsEvents: any[] = createTrackedProxy('analyticsEvents', targets.analyticsEvents);
export const analyticsMetrics: Record<string, any> = createTrackedProxy('analyticsMetrics', targets.analyticsMetrics);

export async function initStorage(): Promise<void> {
  if (!isPostgresMode) {
    console.log('🧠 Storage mode: memory');
    return;
  }

  const pool = getDbPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      bucket TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const buckets: BucketName[] = [
    'patientBiometrics',
    'patientProfiles',
    'triageSessions',
    'patientInsights',
    'patientTriageData',
    'consultationNotes',
    'consultationHistory',
    'users',
    'activeCalls',
    'analyticsEvents',
    'analyticsMetrics',
  ];

  for (const bucket of buckets) {
    const { rows } = await pool.query('SELECT data FROM app_state WHERE bucket = $1', [bucket]);
    if (rows[0]?.data !== undefined) {
      applyLoadedState(targets[bucket], rows[0].data);
    }
  }

  console.log('🧠 Storage mode: postgres');
}

export async function flushStorage(): Promise<void> {
  if (!isPostgresMode) return;

  const buckets: BucketName[] = [
    'patientBiometrics',
    'patientProfiles',
    'triageSessions',
    'patientInsights',
    'patientTriageData',
    'consultationNotes',
    'consultationHistory',
    'users',
    'activeCalls',
    'analyticsEvents',
    'analyticsMetrics',
  ];

  await Promise.all(buckets.map((bucket) => persistBucket(bucket)));
}
