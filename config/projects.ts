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
    name: 'Safari',
    use: {
      ...devices['Desktop Safari'],
      viewport: { width: 1280, height: 720 },
    },
    grepInvert: /@mobile|@quality-gate/,
  },

  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 7'], viewport: { width: 390, height: 664 } },
    grepInvert: /@desktop/,
  },

  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 14'], viewport: { width: 390, height: 664 } },
    grepInvert: /@desktop|@quality-gate/,
  },
];
