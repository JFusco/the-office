import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, inject } from 'vitest';

declare module 'vitest' {
  export interface ProvidedContext { officeTestRoot: string }
}

// No application imports: config captures DATA during test-module collection.
const previous = process.env.OFFICE_DATA_ROOT;
const root = mkdtempSync(join(inject('officeTestRoot'), 'file-'));
process.env.OFFICE_DATA_ROOT = root;
afterAll(() => {
  rmSync(root, { recursive: true, force: true });
  if (previous === undefined) delete process.env.OFFICE_DATA_ROOT;
  else process.env.OFFICE_DATA_ROOT = previous;
});
