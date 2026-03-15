module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@cheggie/shared$': '<rootDir>/../../packages/shared/src',
    '^@cheggie/agents$': '<rootDir>/../../packages/agents/src',
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
};
