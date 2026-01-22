/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: [
        'controllers/**/*.ts',
        'routes/**/*.ts',
        'middleware/**/*.ts',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    testTimeout: 30000,
    verbose: true
};
