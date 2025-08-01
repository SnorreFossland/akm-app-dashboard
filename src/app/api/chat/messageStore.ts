// Create a global message store that persists across Next.js hot reloads
declare global {
    var messageStore: Map<string, any> | undefined;
}

// Use global variable to persist across hot reloads in development
const messageStore = globalThis.messageStore ?? new Map<string, any>();

if (process.env.NODE_ENV === 'development') {
    globalThis.messageStore = messageStore;
}

export { messageStore };