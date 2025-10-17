import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch } from '@/docs/lib/auth';
import { 
  generateGiftBoxReward, 
  recordGiftBoxClaim, 
  getUserGiftBoxStats,
  generateSignature 
} from '@/docs/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userAddress, fid } = body;

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address is required' },
        { status: 400 }
      );
    }

    // Check if user has remaining claims
    const userStats = await getUserGiftBoxStats(userAddress);
    
    if (userStats.remainingClaims <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No remaining claims. Try again in 12 hours.',
          claimsToday: userStats.claimsToday,
          remainingClaims: userStats.remainingClaims
        },
        { status: 429 }
      );
    }

    // Generate reward based on score (you can pass score from frontend if needed)
    // For now, using a random score between 100-5000 for reward calculation
    const mockScore = Math.floor(Math.random() * 4900) + 100;
    const reward = generateGiftBoxReward(mockScore);

    // Generate signature for blockchain claim
    let signature = '';
    let amountInWei = '0';
    
    if (reward.tokenType !== 'none') {
      // Convert amount to wei (assuming 18 decimals)
      amountInWei = (BigInt(Math.floor(reward.amount * 1e18))).toString();
      signature = await generateSignature(userAddress, reward.tokenType, amountInWei);
    }

    // Record the claim
    await recordGiftBoxClaim(userAddress, fid, reward);

    // Return the reward data
    return NextResponse.json({
      success: true,
      tokenType: reward.tokenType,
      amount: reward.amount,
      amountInWei,
      signature,
      claimsToday: userStats.claimsToday + 1,
      remainingClaims: userStats.remainingClaims - 1
    });

  } catch (error) {
    console.error('Error in claim-gift-box API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}