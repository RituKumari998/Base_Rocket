import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch } from '@/docs/lib/auth';
import { 
  recordShareReward, 
  getUserShareStats 
} from '@/docs/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userAddress, fid, shareType = 'stats' } = body;

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address is required' },
        { status: 400 }
      );
    }

    // Check if user can claim share reward (6-hour cooldown)
    const shareStats = await getUserShareStats(userAddress);
    
    if (shareStats.canShare === false) {
      const timeLeft = shareStats.nextShareTime - Date.now();
      const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Share reward on cooldown. Try again in ${hoursLeft} hours.`,
          canShare: false,
          nextShareTime: shareStats.nextShareTime
        },
        { status: 429 }
      );
    }

    // Record the share and grant +2 additional gift box claims
    await recordShareReward(userAddress, fid, shareType);

    return NextResponse.json({
      success: true,
      message: 'Share reward claimed! You now have +2 additional gift box claims.',
      additionalClaims: 2,
      nextShareTime: Date.now() + (6 * 60 * 60 * 1000) // 6 hours from now
    });

  } catch (error) {
    console.error('Error in share-reward API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

