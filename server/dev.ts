// pnpm dev always uses Vite and live source, even when dist exists.
process.env.OFFICE_DEV='1';
await import('./index');
export {};
