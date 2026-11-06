export interface SharedFormData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

import type { EnvironmentManager } from '@utils/environmentManager';

/**
 *
 * @param envManager
 * @returns
 */
export function getSharedFormData(envManager: EnvironmentManager): SharedFormData {
  return {
    title: envManager.getValue('formTitle'),
    firstName: envManager.getValue('formFirstName'),
    lastName: envManager.getValue('formLastName'),
    email: envManager.getValue('formEmail'),
    phone: envManager.getValue('formPhone'),
  };
}

export const callbackInterest = 'Testing, Please Ignore';
