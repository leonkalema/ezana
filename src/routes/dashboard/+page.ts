import { requireAuth } from '$lib/utils/auth-guard';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  requireAuth();
  return {};
};
