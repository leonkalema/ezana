export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const STAKE_TIERS = [
  { value: 0, label: 'No Stakes', description: 'Play for fun' },
  { value: 500, label: '500 Tokens', description: 'Low stakes' },
  { value: 1000, label: '1,000 Tokens', description: 'Medium stakes' },
  { value: 3000, label: '3,000 Tokens', description: 'High stakes' },
  { value: 10000, label: '10,000 Tokens', description: 'Elite stakes' }
];
