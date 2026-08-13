import { expect, test } from '@base';

test.describe('custom fixture example', () => {
  test('example test with custom fixture', async ({ basePage }) => {
    await basePage.goto();

    await expect(basePage.pageTitle).toHaveText(/home/);
  });
});
