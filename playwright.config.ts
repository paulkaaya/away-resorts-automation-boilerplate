import { defineConfig } from '@playwright/test';
import { EnvironmentManager } from '@utils/environmentManager';
import dotenv from 'dotenv';
import { TestmoReporterOptions } from 'playwright-testmo-reporter';
import { projects } from './config/projects';

// Load variables from .env (see .env.example) before anything reads them.
// Existing env vars win — dotenv won't override e.g. an ENV set by CI.
dotenv.config({ quiet: true });

const envManager = new EnvironmentManager();

/**
 * See https://playwright.dev/docs/test-configuration.
 */

const junitOptions = {
  embedAnnotationsAsProperties: true,
  outputFile: '.test-reports/junit-report.xml',
};

export default defineConfig({
  /* directory where the tests are located */
  testDir: './tests',
  /* directory for visual screenshots */
  snapshotPathTemplate: `./screenshots/${envManager.getEnv()}/{projectName}/{arg}{ext}`,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05, //tolerance of 5% difference
    },
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* run with 4 workers on CI */
  workers: process.env.CI ? 4 : 2,
  /* Fail faster */
  timeout: 15 * 1000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list', { printSteps: true }],
    ['junit', junitOptions],
    [
      'playwright-testmo-reporter',
      {
        outputFile: '.test-reports/testmo.xml',
        embedBrowserType: true,
      } satisfies TestmoReporterOptions,
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: envManager.getValue('baseUrl'),

    /* run headless on CI only. */
    headless: process.env.CI ? true : false,

    /* Artifacts */
    screenshot: 'on-first-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: './.test-results/',

  /*
   * Projects. The `setup` project runs first and authenticates each role
   * (tests/auth.setup.ts), then every browser project from config/projects.ts
   * runs with `dependencies: ['setup']` so a session is ready. When auth is
   * unconfigured the setup tests skip themselves, so dependents still run.
   * Browser matrix lives in config/projects.ts — trim it there.
   */
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    ...projects.map(project => ({ ...project, dependencies: ['setup'] })),
  ],
});
