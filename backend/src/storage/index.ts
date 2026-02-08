/**
 * Shared in-memory storage for the application
 * TODO: Replace with database (PostgreSQL, MongoDB, etc.)
 */

export const patientBiometrics: Record<string, any> = {};
export const patientProfiles: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    age: 32,
    email: 'l7aja@gmail.com',
  },
};
export const triageSessions: Record<string, any> = {};
