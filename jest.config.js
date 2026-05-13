process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.10:3000/api';

module.exports = {
  preset: 'jest-expo',
  // Nuestra corrección para el error de 'winter' sigue siendo necesaria.
  moduleNameMapper: {
    '^expo/src/winter/runtime\\.native\\.ts$': '<rootDir>/emptyMock.js',
    '^expo/src/winter/installGlobal\\.ts$': '<rootDir>/emptyMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Nuestra corrección para la variable de entorno y gesture handler también son necesarias.
  setupFiles: ['./jest.setup.js', './node_modules/react-native-gesture-handler/jestSetup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
};
