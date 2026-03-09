// backend/jest.config.js
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'domain/**/*.js',
        'application/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    setupFilesAfterEnv: ['./tests/helpers/setup.js'],
    verbose: true,
    transformIgnorePatterns: [
        'node_modules/(?!(uuid)/)'
    ],
    moduleNameMapper: {
        // Mapear TODAS las importaciones de supabaseAdmin al mock
        '^../../../database/supabaseAdmin$': '<rootDir>/tests/__mocks__/database/supabaseAdmin.js',
        '^../../../database/supabaseAdmin.js$': '<rootDir>/tests/__mocks__/database/supabaseAdmin.js'
    }
};