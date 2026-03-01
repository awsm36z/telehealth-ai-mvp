/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // ─── Backend API tests ──────────────────────────────────────────────────
    {
      displayName: 'backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
      transform: { '^.+\\.ts$': 'ts-jest' },
      moduleFileExtensions: ['ts', 'js', 'json'],
    },

    // ─── Mobile pure-logic tests (no React Native, uses ts-jest from backend) ─
    {
      displayName: 'mobile-utils',
      testEnvironment: 'node',
      roots: ['<rootDir>/../mobile/src/__tests__'],
      testMatch: ['**/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          // Inline tsconfig so we don't inherit backend rootDir restrictions
          tsconfig: {
            target: 'ES2020',
            module: 'commonjs',
            esModuleInterop: true,
            resolveJsonModule: true,
            strict: false,
            skipLibCheck: true,
          },
          diagnostics: false, // pure logic tests — skip type-checking overhead
        }],
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
  ],

  // Shared settings
  verbose: true,
  testTimeout: 10000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
