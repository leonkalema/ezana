import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';

export const requireAuth = () => {
  if (browser) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw redirect(303, '/login');
    }
  }
};
