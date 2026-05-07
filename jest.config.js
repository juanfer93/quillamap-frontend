module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js', './jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo|@expo/.*|expo-router|expo-modules-core)',
  ],
  // LA LLAVE MAESTRA:
  moduleNameMapper: {
    '^expo/src/winter/runtime\\.native\\.ts$': '<rootDir>/emptyMock.js',
    '^expo/src/winter/installGlobal\\.ts$': '<rootDir>/emptyMock.js'
  }
};
