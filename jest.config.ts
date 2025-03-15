module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transformIgnorePatterns: ['/node_modules/'],
    moduleNameMapper: {
        '^types$': '<rootDir>/src/types/index',
        '^types/(.*)$': '<rootDir>/src/types/$1',
        '^features/(.*)$': '<rootDir>/src/features/$1',
        '^data/(.*)$': '<rootDir>/src/data/$1',
        '^errors/(.*)$': '<rootDir>/src/errors/$1',
        '^errors$': '<rootDir>/src/errors/index',
        '^utils$': '<rootDir>/src/utils/index',
        '^test/(.*)$': '<rootDir>/src/test/$1',
        '^utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};