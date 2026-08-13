import type { EnvConfig, ResolvedConfig } from '../types/envConfig';
import { defaults } from '../config/defaults';
import { devConfig } from '../config/dev';

export type Env = 'dev' | 'qa' | 'staging' | 'prod';

const KNOWN_ENVS: readonly Env[] = ['dev', 'qa', 'staging', 'prod'];

const environments: Partial<Record<Env, EnvConfig>> = {
  dev: devConfig,
};

export class EnvironmentManager {
  readonly currentEnv: Env;
  readonly config: ResolvedConfig;

  constructor() {
    const requestedEnv = process.env.ENV || 'dev';

    if (!KNOWN_ENVS.includes(requestedEnv as Env)) {
      throw new Error(`Unknown environment: ${requestedEnv}. Env value is ${process.env.ENV}`);
    }
    this.currentEnv = requestedEnv as Env;

    const envConfig = environments[this.currentEnv];
    if (!envConfig) {
      throw new Error(
        `No config registered for environment "${this.currentEnv}" — add config/${this.currentEnv}.ts and wire it into the environments map in utils/environmentManager.ts.`
      );
    }

    this.config = { ...defaults, ...envConfig };
  }

  /**
   * Gets a configuration value for the current environment.
   * @param key - The config key to look up.
   * @returns The value configured for `key` in the current environment.
   */
  getValue(key: keyof EnvConfig): string {
    return this.config[key];
  }

  /**
   * Gets the name of the currently active environment.
   * @returns The current environment name (e.g. `dev`, `qa`, `staging`, `prod`).
   */
  getEnv(): Env {
    return this.currentEnv;
  }

  /**
   * Checks whether the current environment is the production environment.
   * @returns `true` if the current environment is `prod`.
   */
  isProd(): boolean {
    return this.currentEnv === 'prod';
  }
}

module.exports = { EnvironmentManager };
