module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo|@expo/.*|expo-router|expo-modules-core)',
  ],
  moduleNameMapper: {
    '^expo/src/winter/runtime\.native\.ts$': '<rootDir>/__mocks__/emptyMock.js',
    '^expo/src/winter/installGlobal\.ts$': '<rootDir>/__mocks__/emptyMock.js',
  },
};
