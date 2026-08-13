import { test } from '@base';

test.describe('accessibility and performance tests - homepage', { tag: ['@quality-gate'] }, () => {
  test.describe.configure({ retries: 0 });

  test('accessibility - homepage', async ({ accessibility, basePage }) => {
    await accessibility(basePage);
  });

  test('should pass lighthouse tests - homepage', async ({ lighthouse, basePage }) => {
    await lighthouse(basePage);
  });
});

/* Repeat for additional pages to test as needed */
