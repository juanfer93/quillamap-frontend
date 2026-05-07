module.exports = {
  preset: 'jest-expo',
  // Nuestra corrección para el error de 'winter' sigue siendo necesaria.
  moduleNameMapper: {
    '^expo/src/winter/runtime\\.native\\.ts$': '<rootDir>/emptyMock.js',
    '^expo/src/winter/installGlobal\\.ts$': '<rootDir>/emptyMock.js'
  },
  // Nuestra corrección para la variable de entorno y gesture handler también son necesarias.
  setupFiles: ['./jest.setup.js', './node_modules/react-native-gesture-handler/jestSetup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  // ELIMINAMOS 'transformIgnorePatterns' PARA USAR EL DEL PRESET 'jest-expo'
};
