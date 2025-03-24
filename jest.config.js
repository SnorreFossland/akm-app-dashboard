const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    // Tell Jest to transform react-markdown and other ES module packages
    '/node_modules/(?!(react-markdown|vfile|vfile-message|unist-util-stringify-position|unified|bail|is-plain-obj|trough|remark-parse|micromark|decode-named-character-reference|character-entities|micromark-util|micromark-extension|remark-rehype|rehype|hast-util|property-information|space-separated-tokens|comma-separated-tokens|mdast-util|ccount|escape-string-regexp|markdown-table)/)'
  ],
}

module.exports = createJestConfig(customJestConfig)