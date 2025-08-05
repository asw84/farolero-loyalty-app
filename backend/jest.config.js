// backend/jest.config.js

module.exports = {
  // The "setupFilesAfterEnv" option is the correct place for scripts that need to configure the testing environment.
  setupFilesAfterEnv: ['./jest.setup.js'],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
};
