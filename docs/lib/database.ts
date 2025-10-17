import { MongoClient, Db } from 'mongodb';

// Database connection
let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db();

  return { client, db };
}

// Gift Box Types
export interface GiftBoxReward {
  tokenType: 'base' | 'pepe' | 'boop' | 'none';
  amount: number;
}

export interface GiftBoxClaim {
  userAddress: string;
  fid?: number;
  tokenType: string;
  amount: number;
  timestamp: number;
  score?: number;
}

export interface UserGiftBoxStats {
  userAddress: string;
  claimsToday: number;
  lastClaimTime: number;
  totalClaims: number;
  totalTokensWon: {
    base: number;
    pepe: number;
    boop: number;
  };
}

export interface ShareReward {
  userAddress: string;
  fid?: number;
  shareType: string;
  timestamp: number;
  additionalClaims: number;
}

export interface UserShareStats {
  userAddress: string;
  lastShareTime: number;
  totalShares: number;
  canShare: boolean;
  nextShareTime: number;
}

// Gift Box Reward Generation
export function generateGiftBoxReward(score: number): GiftBoxReward {
  // Higher scores = better rewards
  const scoreTier = Math.min(Math.floor(score / 500), 10); // 0-10 tiers
  
  // Base probabilities (better luck chance decreases with higher scores)
  const baseBetterLuckChance = Math.max(0.5 - (scoreTier * 0.04), 0.05); // 50% to 5%
  const random = Math.random();
  
  if (random < baseBetterLuckChance) {
    return { tokenType: 'none', amount: 0 };
  }
  
  // Token selection probabilities
  const tokenRandom = Math.random();
  
  if (tokenRandom < 0.4) {
    // base - 40% chance
    const baseAmount = 0.02 + (scoreTier * 0.005); // 0.02 to 0.07
    const variation = baseAmount * 0.2 * (Math.random() - 0.5); // ±20% variation
    return { 
      tokenType: 'base', 
      amount: Math.max(0.02, baseAmount + variation) 
    };
  } else if (tokenRandom < 0.7) {
    // PEPE - 30% chance
    const baseAmount = 1236 + (scoreTier * 254); // 1236 to 3778
    const variation = baseAmount * 0.2 * (Math.random() - 0.5); // ±20% variation
    return { 
      tokenType: 'pepe', 
      amount: Math.max(1236, Math.floor(baseAmount + variation)) 
    };
  } else {
    // BOOP - 30% chance
    const baseAmount = 411 + (scoreTier * 59); // 411 to 1000
    const variation = baseAmount * 0.2 * (Math.random() - 0.5); // ±20% variation
    return { 
      tokenType: 'boop', 
      amount: Math.max(411, Math.floor(baseAmount + variation)) 
    };
  }
}

// Database Functions
export async function recordGiftBoxClaim(
  userAddress: string, 
  fid?: number, 
  reward?: GiftBoxReward
): Promise<void> {
  const { db } = await connectToDatabase();
  
  const claim: GiftBoxClaim = {
    userAddress: userAddress.toLowerCase(),
    fid,
    tokenType: reward?.tokenType || 'none',
    amount: reward?.amount || 0,
    timestamp: Date.now()
  };
  
  await db.collection('giftBoxClaims').insertOne(claim);
  
  // Update user stats
  await updateUserGiftBoxStats(userAddress, reward);
}

export async function getUserGiftBoxStats(userAddress: string): Promise<{
  claimsToday: number;
  remainingClaims: number;
  lastClaimTime: number;
  totalClaims: number;
  totalTokensWon: { base: number; pepe: number; boop: number };
}> {
  const { db } = await connectToDatabase();
  
  const userAddr = userAddress.toLowerCase();
  const now = Date.now();
  const twelveHoursAgo = now - (12 * 60 * 60 * 1000);
  
  // Get user stats
  const userStats = await db.collection('userGiftBoxStats').findOne({ userAddress: userAddr });
  
  // Count claims in last 12 hours
  const recentClaims = await db.collection('giftBoxClaims').countDocuments({
    userAddress: userAddr,
    timestamp: { $gte: twelveHoursAgo }
  });
  
  const claimsToday = Math.min(recentClaims, 5); // Max 5 claims per 12 hours
  const remainingClaims = Math.max(0, 5 - claimsToday);
  
  return {
    claimsToday,
    remainingClaims,
    lastClaimTime: userStats?.lastClaimTime || 0,
    totalClaims: userStats?.totalClaims || 0,
    totalTokensWon: userStats?.totalTokensWon || { base: 0, pepe: 0, boop: 0 }
  };
}

async function updateUserGiftBoxStats(userAddress: string, reward?: GiftBoxReward): Promise<void> {
  const { db } = await connectToDatabase();
  
  const userAddr = userAddress.toLowerCase();
  const now = Date.now();
  
  const updateData: any = {
    $inc: { totalClaims: 1 },
    $set: { lastClaimTime: now }
  };
  
  if (reward && reward.tokenType !== 'none') {
    updateData.$inc[`totalTokensWon.${reward.tokenType}`] = reward.amount;
  }
  
  await db.collection('userGiftBoxStats').updateOne(
    { userAddress: userAddr },
    { $setOnInsert: { userAddress: userAddr }, ...updateData },
    { upsert: true }
  );
}

// Share Reward Functions
export async function recordShareReward(
  userAddress: string, 
  fid?: number, 
  shareType: string = 'stats'
): Promise<void> {
  const { db } = await connectToDatabase();
  
  const shareReward: ShareReward = {
    userAddress: userAddress.toLowerCase(),
    fid,
    shareType,
    timestamp: Date.now(),
    additionalClaims: 2
  };
  
  await db.collection('shareRewards').insertOne(shareReward);
  
  // Update user share stats
  await updateUserShareStats(userAddress);
}

export async function getUserShareStats(userAddress: string): Promise<{
  canShare: boolean;
  nextShareTime: number;
  lastShareTime: number;
  totalShares: number;
}> {
  const { db } = await connectToDatabase();
  
  const userAddr = userAddress.toLowerCase();
  const now = Date.now();
  const sixHoursAgo = now - (6 * 60 * 60 * 1000);
  
  // Get last share
  const lastShare = await db.collection('shareRewards')
    .findOne(
      { userAddress: userAddr },
      { sort: { timestamp: -1 } }
    );
  
  const lastShareTime = lastShare?.timestamp || 0;
  const canShare = lastShareTime < sixHoursAgo;
  const nextShareTime = lastShareTime + (6 * 60 * 60 * 1000);
  
  // Get total shares
  const totalShares = await db.collection('shareRewards').countDocuments({
    userAddress: userAddr
  });
  
  return {
    canShare,
    nextShareTime,
    lastShareTime,
    totalShares
  };
}

async function updateUserShareStats(userAddress: string): Promise<void> {
  const { db } = await connectToDatabase();
  
  const userAddr = userAddress.toLowerCase();
  const now = Date.now();
  
  await db.collection('userShareStats').updateOne(
    { userAddress: userAddr },
    { 
      $set: { lastShareTime: now },
      $inc: { totalShares: 1 }
    },
    { upsert: true }
  );
}

// Signature Generation
export async function generateSignature(
  userAddress: string, 
  tokenType: string, 
  amountInWei: string
): Promise<string> {
  if (!process.env.SERVER_PRIVATE_KEY) {
    throw new Error('SERVER_PRIVATE_KEY environment variable is not set');
  }
  
  // For now, return a mock signature
  // In production, you would use ethers.js or similar to generate a real signature
  const mockSignature = `0x${Buffer.from(`${userAddress}-${tokenType}-${amountInWei}-${Date.now()}`).toString('hex')}`;
  
  return mockSignature;
}

// Game Score Functions
export async function saveGameScore(
  userAddress: string,
  score: number,
  fid?: number,
  gameData?: any
): Promise<void> {
  const { db } = await connectToDatabase();
  
  const gameScore = {
    userAddress: userAddress.toLowerCase(),
    fid,
    score,
    timestamp: Date.now(),
    gameData
  };
  
  await db.collection('gameScores').insertOne(gameScore);
}

export async function getUserGameStats(userAddress: string): Promise<{
  totalGames: number;
  highScore: number;
  averageScore: number;
  lastGameTime: number;
}> {
  const { db } = await connectToDatabase();
  
  const userAddr = userAddress.toLowerCase();
  
  const [totalGames, highScoreDoc, averageScoreDoc, lastGame] = await Promise.all([
    db.collection('gameScores').countDocuments({ userAddress: userAddr }),
    db.collection('gameScores').findOne(
      { userAddress: userAddr },
      { sort: { score: -1 } }
    ),
    db.collection('gameScores').aggregate([
      { $match: { userAddress: userAddr } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]).toArray(),
    db.collection('gameScores').findOne(
      { userAddress: userAddr },
      { sort: { timestamp: -1 } }
    )
  ]);
  
  return {
    totalGames,
    highScore: highScoreDoc?.score || 0,
    averageScore: averageScoreDoc[0]?.avgScore || 0,
    lastGameTime: lastGame?.timestamp || 0
  };
}
