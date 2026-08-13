// Prettier CLI config shim. The actual options live in `eslint.config.mjs`
// (`prettierOptions`) so all formatting config sits in one place. This file only
// exists so the Prettier CLI — `pnpm format` and the on-edit hook for non-TS
// files (md/json/yml) — uses the exact same options as the ESLint integration.
export { prettierOptions as default } from './eslint.config.mjs';
