
// Gift Box System Functions
const GIFT_BOXES_PER_DAY = 5;

export async function canUserClaimGiftBox(userAddress: string, fid?: number): Promise<{
  canClaim: boolean;
  claimsToday: number;
  remainingClaims: number;
  lastClaimTime?: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const currentTime = Date.now();
  
  console.log('🔍 canUserClaimGiftBox - searching for user by FID:', fid);
  
  // Find user's game score record by FID (more reliable)
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  console.log('🔍 canUserClaimGiftBox - found userData:', {
    exists: !!userData,
    userAddress: userData?.userAddress,
    lastGiftBoxUpdate: userData?.lastGiftBoxUpdate,
    giftBoxClaimsInPeriod: userData?.giftBoxClaimsInPeriod
  });
  
  if (!userData) {
    // User doesn't exist in gameScores, can claim
    console.log('🔍 canUserClaimGiftBox - user not found, can claim');
    return {
      canClaim: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: undefined
    };
  }
  
  // Check if last gift box claim was more than 12 hours ago
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  console.log('🔍 canUserClaimGiftBox - current values:', {
    lastGiftBoxUpdate,
    claimsInPeriod,
    currentTime,
    timeDiff: currentTime - lastGiftBoxUpdate
  });
  
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, reset counter
    console.log('🔍 canUserClaimGiftBox - 12 hours passed, resetting');
    return {
      canClaim: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: lastGiftBoxUpdate
    };
  }
  
  // Check if user has claims remaining in current 12-hour period
  const canClaim = claimsInPeriod < GIFT_BOXES_PER_DAY;
  
  console.log('🔍 canUserClaimGiftBox - result:', {
    canClaim,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod)
  });
  
  return {
    canClaim,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod),
    lastClaimTime: lastGiftBoxUpdate
  };
}

// Function to check if user can see gift box (without incrementing count)
export async function canUserSeeGiftBox(userAddress: string, fid?: number): Promise<{
  canSee: boolean;
  claimsToday: number;
  remainingClaims: number;
  lastClaimTime?: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const currentTime = Date.now();
  
  // Find user's game score record by FID
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  if (!userData) {
    // User doesn't exist in gameScores, can see gift box
    return {
      canSee: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: undefined
    };
  }
  
  // Check if last gift box claim was more than 12 hours ago
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, reset counter
    return {
      canSee: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: lastGiftBoxUpdate
    };
  }
  
  // Check if user has claims remaining in current 12-hour period
  const canSee = claimsInPeriod < GIFT_BOXES_PER_DAY;
  
  return {
    canSee,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod),
    lastClaimTime: lastGiftBoxUpdate
  };
}

export async function generateGiftBoxReward(score: number = 0): Promise<{
  tokenType: 'base' | 'pepe' | 'boop' | 'none';
  amount: number;
}> {
  // Calculate "better luck next time" probability based on score
  let betterLuckProbability = 0.5; // Default 50%
  
  if (score < 1000) {
    betterLuckProbability = 0.96; // 90% chance for scores under 4000
  } else if (score < 3000) {
    betterLuckProbability = 0.7; // 70% chance for scores 4000-7999
  } else if (score < 5000) {
    betterLuckProbability = 0.5; // 50% chance for scores 8000-11999
  } else if (score < 8000) {
    betterLuckProbability = 0.3; // 30% chance for scores 12000-15999
  } else if (score < 12000) {
    betterLuckProbability = 0.2; // 20% chance for scores 16000-19999
  } else {
    betterLuckProbability = 0.1; // 10% chance for scores 20000+
  }
  
  const random = Math.random();
  console.log(random,betterLuckProbability)
  if (random < betterLuckProbability) {
    console.log(`🎁 Gift Box: Better luck next time! (${(betterLuckProbability * 100).toFixed(1)}% chance) - Score: ${score.toLocaleString()}`);
    return { tokenType: 'none', amount: 0 };
  }
  
  // Remaining chance of getting a token (distributed equally among the 3 tokens)
  const tokenRandom = Math.random();
  const tokenChance = (1 - betterLuckProbability) / 3; // Equal distribution among 3 tokens
  
  if (tokenRandom < tokenChance) {
    // base: 0.025 - 0.075 (halved from 0.05 - 0.15)
    const baseAmount = 0.02 + (Math.random() * 0.05);
    console.log(`🎁 Gift Box: base reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${baseAmount.toFixed(6)} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'base', amount: parseFloat(baseAmount.toFixed(6)) };
  } else if (tokenRandom < tokenChance * 2) {
    // PEPE: 2236 - 6778 (halved from 4473 - 13557)
    const pepeAmount = 1236 + Math.floor(Math.random() * (3778 - 1236 + 1));
    console.log(`🎁 Gift Box: PEPE reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${pepeAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'pepe', amount: pepeAmount };
  } else {
    // BOOP: 711 - 1000 (halved from 1423 - 2000)
    const boopAmount = 411 + Math.floor(Math.random() * (1000 - 411 + 1));
    console.log(`🎁 Gift Box: BOOP reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${boopAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'boop', amount: boopAmount };
  }
}

export async function claimGiftBox(userAddress: string, fid?: number): Promise<{
  success: boolean;
  tokenType: 'base' | 'pepe' | 'boop' | 'none';
  amount: number;
  amountInWei?: string;
  signature?: string;
  claimsToday: number;
  remainingClaims: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const userAddressLower = userAddress;
  
  // Check if user can claim
  const canClaim = await canUserClaimGiftBox(userAddress, fid);
  if (!canClaim.canClaim) {
    return {
      success: false,
      tokenType: 'none',
      amount: 0,
      claimsToday: canClaim.claimsToday,
      remainingClaims: canClaim.remainingClaims
    };
  }
  
  // Get user's best score for reward calculation
  let userBestScore = 0;
  if (fid) {
    try {
      const userGameData = await db.collection('gameScores').findOne(
        { fid: fid },
        { sort: { score: -1 } }
      );
      userBestScore = userGameData?.currentSeasonScore || 0;
      console.log(`🎯 User best score for gift box calculation: ${userBestScore.toLocaleString()}`);
    } catch (error) {
      console.log('⚠️ Error getting user score for gift box, using 0:', error);
      userBestScore = 0;
    }
  }
  
  // Generate reward based on user's score
  const reward = await generateGiftBoxReward(userBestScore);
  
  // Update gift box claims in gameScores collection
  const currentTime = Date.now();
  const lastGiftBoxUpdate = canClaim.lastClaimTime || 0;
  const claimsInPeriod = canClaim.claimsToday;
  
  console.log('🔍 Claiming gift box - Debug info:', {
    userAddress: userAddressLower,
    lastGiftBoxUpdate,
    claimsInPeriod,
    currentTime,
    timeDiff: currentTime - lastGiftBoxUpdate,
    twelveHours: 12 * 60 * 60 * 1000
  });
  
  // Check if we need to reset the counter (12 hours passed)
  let newClaimsInPeriod = 1;
  let newLastGiftBoxUpdate = currentTime;
  
  if (lastGiftBoxUpdate === 0) {
    // First time claiming - start with 1
    newClaimsInPeriod = 1;
    newLastGiftBoxUpdate = currentTime;
    console.log('🎯 First time claiming - starting with 1');
  } else if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, start new period
    newClaimsInPeriod = 1;
    newLastGiftBoxUpdate = currentTime;
    console.log('🔄 12 hours passed - resetting counter to 1');
  } else {
    // Continue in current period
    newClaimsInPeriod = claimsInPeriod + 1;
    newLastGiftBoxUpdate = currentTime; // Always update to current time when claiming
    console.log(`📈 Continuing period - incrementing from ${claimsInPeriod} to ${newClaimsInPeriod}`);
  }
  
  console.log('💾 Updating database with:', {
    userAddress: userAddressLower,
    newClaimsInPeriod,
    newLastGiftBoxUpdate
  });
  
  const updateResult = await db.collection('gameScores').updateOne(
    { fid: fid },
    {
      $set: {
        giftBoxClaimsInPeriod: newClaimsInPeriod,
        lastGiftBoxUpdate: newLastGiftBoxUpdate,
        updatedAt: new Date()
      },
      $inc: {
        totalRewardsClaimed: 1
      }
    },
    { upsert: true }
  );
  
  console.log('✅ Database update result:', {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount,
    upsertedCount: updateResult.upsertedCount
  });
  
  // Store the claim
  const giftBoxClaim: GiftBoxClaim = {
    userAddress: userAddressLower,
    fid,
    tokenType: reward.tokenType,
    amount: reward.amount,
    timestamp: Date.now(),
    createdAt: new Date()
  };
  
  await db.collection('giftBoxClaims').insertOne(giftBoxClaim);
  
  // Generate signature for token reward (only if not "none")
  let signature: string | undefined;
  if (reward.tokenType !== 'none') {
    const { ethers } = await import('ethers');
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY;
    
    // Convert amount to wei (18 decimals)
    const amountInWei = convertToWei(reward.amount);
    
    console.log('Signature data:', {
      userAddress: userAddressLower,
      tokenAddress: getTokenAddress(reward.tokenType),
      amount: reward.amount,
      amountInWei: amountInWei
    });
    
    if (serverPrivateKey) {
      const wallet = new ethers.Wallet(serverPrivateKey);

      const packedData = ethers.solidityPacked(
        ["address", "address", "uint256"],
        [userAddressLower, getTokenAddress(reward.tokenType), amountInWei]
      );
      const messageHash = ethers.keccak256(packedData);
      
      signature = await wallet.signMessage(ethers.getBytes(messageHash));
    }
  }
  
  return {
    success: true,
    tokenType: reward.tokenType,
    amount: reward.amount,
    amountInWei: reward.tokenType !== 'none' ? convertToWei(reward.amount).toString() : '0',
    signature,
    claimsToday: newClaimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - newClaimsInPeriod)
  };
}

function getTokenAddress(tokenType: 'base' | 'pepe' | 'boop' | 'none'): string {
  // These should match your actual token contract addresses
  switch (tokenType) {
    case 'base':
      return '0x912CE59144191C1204E64559FE8253a0e49E6548'; // base token address
    case 'pepe':
      return '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00'; // PEPE token address
    case 'boop':
      return '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3'; // Replace with actual BOOP address
    case 'none':
      throw new Error('Cannot get token address for "none" type');
    default:
      throw new Error('Invalid token type');
  }
}

function convertToWei(amount: number): bigint {
  // Convert amount to 18 decimals (wei)
  return BigInt(Math.floor(amount * Math.pow(10, 18)));
}

export async function getUserGiftBoxStats(userAddress: string, fid?: number): Promise<{
  totalClaims: number;
  totalbase: number;
  totalPepe: number;
  totalBoop: number;
  claimsToday: number;
  remainingClaims: number;
  totalRewardsClaimed: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const userAddressLower = userAddress.toLowerCase();
  const currentTime = Date.now();
  
  // Get user's game score record by FID
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  // Get current period claims
  let claimsToday = 0;
  if (userData) {
    const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
    const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
    
    // Check if 12 hours have passed since last update
    if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
      claimsToday = 0; // Reset if 12 hours passed
    } else {
      claimsToday = claimsInPeriod;
    }
  }
  
  // Get all-time stats from giftBoxClaims collection
  const allClaims = await db.collection('giftBoxClaims').find({
    userAddress: userAddressLower
  }).toArray();
  
  let totalbase = 0;
  let totalPepe = 0;
  let totalBoop = 0;
  
  allClaims.forEach(claim => {
    if (claim.tokenType === 'base') totalbase += claim.amount;
    else if (claim.tokenType === 'pepe') totalPepe += claim.amount;
    else if (claim.tokenType === 'boop') totalBoop += claim.amount;
  });
  
  return {
    totalClaims: allClaims.length,
    totalbase,
    totalPepe,
    totalBoop,
    claimsToday,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsToday),
    totalRewardsClaimed: userData?.totalRewardsClaimed || 0
  };
} 