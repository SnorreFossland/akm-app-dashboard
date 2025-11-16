import '@testing-library/jest-dom'

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children }) => children || null,
}))