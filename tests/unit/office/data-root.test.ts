import { expect, inject, test } from 'vitest';
import { relative, sep } from 'node:path';
import { DATA } from '../../../server/office/config';
import { projectById, projectData } from '../../../server/office/projects';
import { Store } from '../../../server/store/store';

test('collection-time configuration and default Store paths stay inside the run-owned root', () => {
  const parent = inject('officeTestRoot');
  expect(relative(parent, DATA)).toMatch(/^file-[^/\\]+$/);
  expect(DATA).toBe(process.env.OFFICE_DATA_ROOT);
  for (const id of ['cec', 'brain', 'cms-field-vocabulary']) {
    const project = projectById(id), root = projectData(project);
    expect(root === DATA || root.startsWith(DATA + sep)).toBe(true);
    const store = new Store(':memory:', project);
    try { expect(store.dataRoot).toBe(root); }
    finally { store.close(); }
  }
});
