/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/?(*.)+(test).ts', '<rootDir>/tests/**/*.steps.ts'],
  // Coverage is measured against the code you write in the playbook module — the
  // acceptance step definitions are excluded. `npm run test:coverage` must report 100%.
  collectCoverageFrom: ['src/components/playbook/**/*.ts'],
  coverageThreshold: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
};
