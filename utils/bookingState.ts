import type { Env } from '@utils/environmentManager';
import fs from 'node:fs';
import path from 'node:path';

export interface BookingState {
  reference: string;
  surname: string;
}

const stateDirectory = path.resolve('.test-state');

/**
 *
 * @param env
 * @returns
 */
function statePath(env: Env): string {
  return path.join(stateDirectory, `booking-${env}.json`);
}

/**
 *
 * @param env
 * @returns
 */
export function readBookingState(env: Env): BookingState | undefined {
  const suffix = env.toUpperCase();
  const reference = process.env[`BOOKING_REFERENCE_${suffix}`];
  const surname = process.env[`BOOKING_SURNAME_${suffix}`];
  const configuredState = reference && surname;
  if (configuredState) {
    return { reference, surname };
  }

  const filePath = statePath(env);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as BookingState;
}

/**
 *
 * @param env
 * @param state
 */
export function writeBookingState(env: Env, state: BookingState): void {
  fs.mkdirSync(stateDirectory, { recursive: true });
  fs.writeFileSync(statePath(env), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}
