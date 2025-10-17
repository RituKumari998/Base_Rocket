'use client'

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare, faGift, faCoins, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useAccount } from 'wagmi';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { authenticatedFetch } from '@/docs/lib/auth';

interface UserStatsData {
  giftBoxStats: {
    claimsToday: number;
    remainingClaims: number;
    totalClaims: number;
    totalTokensWon: {
      base: number;
      pepe: number;
      boop: number;
    };
  };
  gameStats: {
    totalGames: number;
    highScore: number;
    averageScore: number;
  };
  shareStats: {
    canShare: boolean;
    nextShareTime: number;
    totalShares: number;
  };
}

export default function UserStats() {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address } = useAccount();
  const { context, actions } = useMiniAppContext();

  useEffect(() => {
    if (address) {
      loadUserStats();
    }
  }, [address]);

  const loadUserStats = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load gift box stats
      const giftBoxResponse = await authenticatedFetch('/api/user-stats/gift-box', {
        method: 'POST',
        body: JSON.stringify({ userAddress: address })
      });
      
      const giftBoxData = await giftBoxResponse.json();
      
      // Load game stats
      const gameResponse = await authenticatedFetch('/api/user-stats/game', {
        method: 'POST',
        body: JSON.stringify({ userAddress: address })
      });
      
      const gameData = await gameResponse.json();
      
      // Load share stats
      const shareResponse = await authenticatedFetch('/api/user-stats/share', {
        method: 'POST',
        body: JSON.stringify({ userAddress: address })
      });
      
      const shareData = await shareResponse.json();
      
      setStats({
        giftBoxStats: giftBoxData.success ? giftBoxData.data : {
          claimsToday: 0,
          remainingClaims: 5,
          totalClaims: 0,
          totalTokensWon: { base: 0, pepe: 0, boop: 0 }
        },
        gameStats: gameData.success ? gameData.data : {
          totalGames: 0,
          highScore: 0,
          averageScore: 0
        },
        shareStats: shareData.success ? shareData.data : {
          canShare: true,
          nextShareTime: 0,
          totalShares: 0
        }
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      setError('Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareStats = async () => {
    if (!actions || !stats) {
      console.error('Farcaster actions not available');
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      const username = context?.user?.username || 'Anonymous Player';
      
      const shareMessage = `🎮 WAGMI Blaster Stats Update! 🎮

🏆 High Score: ${stats.gameStats.highScore}
🎁 Total Gift Box Claims: ${stats.giftBoxStats.totalClaims}
💰 Tokens Won:
   • ${stats.giftBoxStats.totalTokensWon.base.toFixed(3)} $base
   • ${stats.giftBoxStats.totalTokensWon.pepe.toLocaleString()} $PEPE
   • ${stats.giftBoxStats.totalTokensWon.boop.toLocaleString()} $BOOP

🔥 Ready to beat my high score? Come play and get your bag! 💎`;

      await actions.composeCast({
        text: shareMessage,
        embeds: [process.env.NEXT_PUBLIC_URL || "https://basejump.vercel.app/"]
      });

      // Claim share reward
      try {
        await authenticatedFetch('/api/share-reward', {
          method: 'POST',
          body: JSON.stringify({
            userAddress: address,
            fid: context?.user?.fid,
            shareType: 'stats'
          })
        });
        
        // Reload stats to update share info
        await loadUserStats();
      } catch (rewardError) {
        console.error('Error claiming share reward:', rewardError);
      }
      
    } catch (error) {
      console.error('Failed to share stats:', error);
      setError('Failed to share stats');
    } finally {
      setIsSharing(false);
    }
  };

  const formatTimeUntilNextShare = (nextShareTime: number) => {
    const now = Date.now();
    const timeLeft = nextShareTime - now;
    
    if (timeLeft <= 0) return 'Available now';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        Loading stats...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        <p>{error}</p>
        <button
          onClick={loadUserStats}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'white'
      }}>
        No stats available
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.95), rgba(236, 72, 153, 0.95))',
      border: '1px solid rgba(147, 51, 234, 0.3)',
      borderRadius: '20px',
      padding: '24px',
      margin: '20px',
      color: 'white',
      backdropFilter: 'blur(20px)'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <FontAwesomeIcon icon={faTrophy} style={{ marginRight: '8px' }} />
        Your Stats
      </h2>

      {/* Game Stats */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
          🎮 Game Performance
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {stats.gameStats.highScore}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              High Score
            </div>
          </div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {stats.gameStats.totalGames}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Total Games
            </div>
          </div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {Math.floor(stats.gameStats.averageScore)}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Avg Score
            </div>
          </div>
        </div>
      </div>

      {/* Gift Box Stats */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
          <FontAwesomeIcon icon={faGift} style={{ marginRight: '8px' }} />
          Gift Box Rewards
        </h3>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span>Claims Today:</span>
            <span style={{ fontWeight: 'bold' }}>
              {stats.giftBoxStats.claimsToday}/5
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span>Remaining:</span>
            <span style={{ fontWeight: 'bold', color: '#4ade80' }}>
              {stats.giftBoxStats.remainingClaims}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Total Claims:</span>
            <span style={{ fontWeight: 'bold' }}>
              {stats.giftBoxStats.totalClaims}
            </span>
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '16px',
          borderRadius: '12px'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
            <FontAwesomeIcon icon={faCoins} style={{ marginRight: '8px' }} />
            Tokens Won
          </h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#96A5F0' }}>$base:</span>
              <span style={{ fontWeight: 'bold' }}>
                {stats.giftBoxStats.totalTokensWon.base.toFixed(3)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#4ADE80' }}>$PEPE:</span>
              <span style={{ fontWeight: 'bold' }}>
                {stats.giftBoxStats.totalTokensWon.pepe.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#C4B5FD' }}>$BOOP:</span>
              <span style={{ fontWeight: 'bold' }}>
                {stats.giftBoxStats.totalTokensWon.boop.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Stats */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '16px',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
          <FontAwesomeIcon icon={faShare} style={{ marginRight: '8px' }} />
          Share Rewards
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
            Next Share Reward:
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {formatTimeUntilNextShare(stats.shareStats.nextShareTime)}
          </div>
        </div>
        
        <button
          onClick={handleShareStats}
          disabled={!stats.shareStats.canShare || isSharing}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'all 0.3s',
            cursor: stats.shareStats.canShare && !isSharing ? 'pointer' : 'not-allowed',
            backgroundColor: stats.shareStats.canShare && !isSharing
              ? 'linear-gradient(135deg, rgb(34, 197, 94), rgb(16, 185, 129))'
              : 'rgb(75, 85, 99)',
            color: 'white',
            border: 'none',
            opacity: stats.shareStats.canShare && !isSharing ? 1 : 0.6
          }}
        >
          {isSharing ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }}></div>
              Sharing...
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesomeIcon icon={faShare} style={{ marginRight: '8px' }} />
              Share Stats (+2 Claims)
            </div>
          )}
        </button>
        
        {stats.shareStats.totalShares > 0 && (
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
            Total shares: {stats.shareStats.totalShares}
          </div>
        )}
      </div>
    </div>
  );
}

