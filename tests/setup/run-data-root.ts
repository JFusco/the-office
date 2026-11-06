import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TestProject } from 'vitest/node';

export default function setup(project: TestProject) {
  const root = mkdtempSync(join(tmpdir(), 'office-unit-run-'));
  project.provide('officeTestRoot', root);
  // Also cleans files whose collection failed before afterAll could run.
  return () => rmSync(root, { recursive: true, force: true });
}
