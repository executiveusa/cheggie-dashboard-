module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@cheggie/shared$': '<rootDir>/../../packages/shared/src',
  },
};
