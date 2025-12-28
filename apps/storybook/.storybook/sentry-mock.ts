// Mock for @sentry/nextjs in Storybook environment
// This avoids the next/router dependency issues

export const captureException = () => {};
export const captureMessage = () => {};
export const init = () => {};
export const withScope = () => {};
export const setUser = () => {};
export const setTag = () => {};
export const setExtra = () => {};
export const setContext = () => {};
export const addBreadcrumb = () => {};
export const startSpan = () => {};
export const withSentryConfig = (config: unknown) => config;
export const captureEvent = () => {};
export const flush = async () => true;
export const close = async () => {};
