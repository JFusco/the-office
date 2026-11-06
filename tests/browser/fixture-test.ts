import { test as base, expect } from '@playwright/test';
import { fixtureMode } from './support';

export { expect };
export type { Page, Locator, APIRequestContext } from '@playwright/test';
export const test = base.extend<{ resetOffice: void }>({
  resetOffice: [async ({ request }, use) => {
    if (fixtureMode) {
      const response = await request.post('/__fixture/reset');
      expect(response.ok(), 'reset synthetic Office before each test').toBe(true);
    }
    await use();
  }, { auto: true }],
});
