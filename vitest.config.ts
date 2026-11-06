import { defineConfig } from 'vitest/config';
export default defineConfig({test:{
  include:['tests/unit/**/*.test.ts'],
  globalSetup:['tests/setup/run-data-root.ts'],
  setupFiles:['tests/setup/data-root.ts'],
  pool:'forks',isolate:true,fileParallelism:false,
  sequence:{hooks:'stack'},testTimeout:30000,
}});
