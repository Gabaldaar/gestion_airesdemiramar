
export const AUTH_COOKIE_NAME = 'auth_session';

// IMPORTANT: In a real application, this secret should be a secure, randomly generated string
// stored in environment variables. It should not be hardcoded.
// For example: process.env.JWT_SECRET
export const JWT_SECRET = 'your-super-secret-jwt-key-that-is-at-least-32-characters-long';

// In a real application, this password should NEVER be in the source code.
// It should be a securely stored environment variable.
export const APP_PASSWORD = process.env.APP_PASSWORD || 'miramar2024';
