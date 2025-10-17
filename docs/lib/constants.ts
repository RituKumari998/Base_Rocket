// App constants
export const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://basejump.vercel.app';

// Gift Box Constants
export const GIFT_BOX_CONFIG = {
  MAX_CLAIMS_PER_PERIOD: 5,
  CLAIM_PERIOD_HOURS: 12,
  SHARE_COOLDOWN_HOURS: 6,
  SHARE_REWARD_CLAIMS: 2
};

// Reward Constants
export const REWARD_CONFIG = {
  base: {
    MIN_AMOUNT: 0.02,
    MAX_AMOUNT: 0.07,
    DECIMALS: 18
  },
  PEPE: {
    MIN_AMOUNT: 1236,
    MAX_AMOUNT: 3778,
    DECIMALS: 18
  },
  BOOP: {
    MIN_AMOUNT: 411,
    MAX_AMOUNT: 1000,
    DECIMALS: 18
  }
};

// Score Tiers for Better Rewards
export const SCORE_TIERS = [
  { min: 0, max: 500, tier: 0, betterLuckChance: 0.5 },
  { min: 500, max: 1000, tier: 1, betterLuckChance: 0.46 },
  { min: 1000, max: 1500, tier: 2, betterLuckChance: 0.42 },
  { min: 1500, max: 2000, tier: 3, betterLuckChance: 0.38 },
  { min: 2000, max: 2500, tier: 4, betterLuckChance: 0.34 },
  { min: 2500, max: 3000, tier: 5, betterLuckChance: 0.30 },
  { min: 3000, max: 3500, tier: 6, betterLuckChance: 0.26 },
  { min: 3500, max: 4000, tier: 7, betterLuckChance: 0.22 },
  { min: 4000, max: 4500, tier: 8, betterLuckChance: 0.18 },
  { min: 4500, max: 5000, tier: 9, betterLuckChance: 0.14 },
  { min: 5000, max: Infinity, tier: 10, betterLuckChance: 0.10 }
];

// API Endpoints
export const API_ENDPOINTS = {
  CLAIM_GIFT_BOX: '/api/claim-gift-box',
  SHARE_REWARD: '/api/share-reward',
  USER_STATS: '/api/user-stats'
};

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  NO_REMAINING_CLAIMS: 'No remaining claims. Try again in 12 hours.',
  SHARE_COOLDOWN: 'Share reward on cooldown. Try again later.',
  INVALID_AUTH: 'Invalid or expired authentication key',
  NETWORK_ERROR: 'Network error. Please try again.',
  CLAIM_FAILED: 'Failed to claim reward. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  GIFT_BOX_OPENED: 'Gift box opened successfully!',
  TOKENS_CLAIMED: 'Tokens claimed successfully!',
  SHARE_REWARD_CLAIMED: 'Share reward claimed! You now have +2 additional gift box claims.',
  SHARED_ON_FARCASTER: 'Successfully shared on Farcaster!'
};

// UI Constants
export const UI_CONFIG = {
  ANIMATION_DURATION: 1000,
  SUCCESS_DISPLAY_TIME: 5000,
  GIFT_BOX_DELAY: 1500,
  MODAL_Z_INDEX: 9999
};

// Database Collection Names
export const COLLECTIONS = {
  GIFT_BOX_CLAIMS: 'giftBoxClaims',
  USER_GIFT_BOX_STATS: 'userGiftBoxStats',
  SHARE_REWARDS: 'shareRewards',
  USER_SHARE_STATS: 'userShareStats',
  GAME_SCORES: 'gameScores',
  USED_AUTH_KEYS: 'usedAuthKeys'
};

