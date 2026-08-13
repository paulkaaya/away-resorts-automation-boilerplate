import { devices, Project } from '@playwright/test';

export const projects: Project[] = [
  {
    name: 'Chrome',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 720 },
    },
    grepInvert: /@mobile/,
  },

  {
    name: 'Firefox',
    use: {
      ...devices['Desktop Firefox'],
      viewport: { width: 1280, height: 720 },
    },
    grepInvert: /@mobile|@quality-gate/,
  },

  {
    name: 'Safari',
    use: {
      ...devices['Desktop Safari'],
      viewport: { width: 1280, height: 720 },
    },
    grepInvert: /@mobile|@quality-gate/,
  },

  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 14'], viewport: { width: 390, height: 664 } },
    grepInvert: /@desktop|@quality-gate/,
  },

  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 7'], viewport: { width: 390, height: 664 } },
    grepInvert: /@desktop/,
  },

  {
    name: 'Mobile Tablet Chrome',
    use: {
      viewport: { width: 1024, height: 810 },
      browserName: 'chromium',
      isMobile: true,
      hasTouch: true,
    },
    grepInvert: /@desktop|@quality-gate/,
  },

  {
    name: 'Mobile Tablet Safari',
    use: {
      ...devices['iPad Mini landscape'],
      viewport: { width: 1024, height: 768 },
    },
    grepInvert: /@desktop|@quality-gate/,
  },

  {
    name: 'Large Desktop Edge',
    use: {
      ...devices['Desktop Edge'],
      viewport: { width: 1920, height: 1080 },
      channel: 'msedge',
    },
    grepInvert: /@mobile|@quality-gate/,
  },

  {
    name: 'Large Desktop Chrome',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1920, height: 1080 },
      channel: 'chrome',
    },
    grepInvert: /@mobile|@quality-gate/,
  },
];
