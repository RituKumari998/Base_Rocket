'use client'

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCoins, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useAccount } from 'wagmi';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { authenticatedFetch } from '@/docs/lib/auth';
import { useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } from '@/docs/lib/contracts';
import { APP_URL } from '@/docs/lib/constants';

interface GiftBoxProps {
  onClose: () => void;
  onClaimComplete: () => void;
}

interface GiftBoxReward {
  tokenType: 'base' | 'pepe' | 'boop' | 'none';
  amount: number;
  amountInWei?: string;
  signature?: string;
  claimsToday: number;
  remainingClaims: number;
}

export default function GiftBox({ onClose, onClaimComplete }: GiftBoxProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<GiftBoxReward | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { address } = useAccount();
  const { context, actions } = useMiniAppContext();
  
  // Blockchain transaction for claiming tokens
  const { writeContract: writeClaimToken, data: claimTx, isSuccess: claimSuccess, isError: claimError, error: claimErrorObj } = useContractWrite();
  const { isLoading: isClaimLoading, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({ hash: claimTx });

  // Share winning reward on Farcaster
  const shareWinning = async (reward: GiftBoxReward) => {
    if (!actions) {
      console.error('Farcaster actions not available');
      return;
    }

    try {
      const username = context?.user?.username || 'Anonymous Player';
      const tokenInfo = getTokenInfo(reward.tokenType);
      
      let shareMessage = '';
      
      if (reward.tokenType === 'none') {
        shareMessage = `Just opened a WAGMI Blaster gift box! 🎁\n\nBetter luck next time... but I'm not giving up! 💪\n\nCome play and test your luck! 🎮`;
      } else {
        shareMessage = `Just WON ${reward.amount.toLocaleString()} ${tokenInfo.name} tokens from a WAGMI Blaster gift box! 🎁💰\n\n🔥 This game is FIRE! Who else is ready to claim some rewards? 👀\n\nCome play and get your bag! 💎`;
      }


      await actions.composeCast({
        text: shareMessage,
        embeds: [APP_URL || "https://chain-crush-black.vercel.app/"]
      });
      
      console.log('Successfully shared winning on Farcaster!');
    } catch (error) {
      console.error('Failed to share winning:', error);
    }
  };

  const openGiftBox = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsOpening(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/claim-gift-box', {
        method: 'POST',
        body: JSON.stringify({
          userAddress: address,
          fid: context?.user?.fid
        })
      });

      const result = await response.json();

      if (result.success) {
        setReward(result);
        setShowReward(true);
      } else {
        setError(result.error || 'Failed to claim gift box');
      }
    } catch (error) {
      console.error('Error claiming gift box:', error);
      setError('Failed to claim gift box');
    } finally {
      setIsOpening(false);
    }
  };

  const claimToken = async () => {
    if (!reward || reward.tokenType === 'none' || !reward.signature) {
      // For "Better Luck Next Time" rewards, share on Farcaster before completing
      if (reward && reward.tokenType === 'none') {
        await shareWinning(reward);
      }
      onClaimComplete();
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      const tokenAddress = getTokenAddress(reward.tokenType);
      const amountInWei = BigInt(reward.amountInWei || '0');
      console.log(tokenAddress, amountInWei, reward.signature)
      console.log('Claiming token with:', {
        tokenAddress,
        amountInWei,
        signature: reward.signature
      });
      
      writeClaimToken({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'claimTokenReward',
        args: [tokenAddress as `0x${string}`, amountInWei, reward.signature as `0x${string}`]
      });
    } catch (error) {
      console.error('Error claiming token:', error);
      setError('Failed to claim token');
      setIsClaiming(false);
    }
  };

  // Handle successful token claim
  useEffect(() => {
    if (isClaimConfirmed && isClaiming && reward) {
      setIsClaiming(false);
      setShowSuccess(true);
      
      // Share the winning on Farcaster
      shareWinning(reward);
      
      // Auto close success popup after 3 seconds
      setTimeout(() => {
        onClaimComplete();
      }, 5000);
    }
  }, [isClaimConfirmed, isClaiming, onClaimComplete, reward]);

  // Handle token claim error
  useEffect(() => {
    if (claimError && isClaiming) {
      setError(claimErrorObj?.message || 'Token claim failed');
      setIsClaiming(false);
    }
  }, [claimError, claimErrorObj, isClaiming]);

  const getTokenAddress = (tokenType: 'base' | 'pepe' | 'boop' | 'none'): string => {
    switch (tokenType) {
      case 'base':
        return '0x912CE59144191C1204E64559FE8253a0e49E6548';
      case 'pepe':
        return '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00';
      case 'boop':
        return '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3'; // Replace with actual BOOP address
      case 'none':
        throw new Error('Cannot get token address for "none" type');
      default:
        throw new Error('Invalid token type');
    }
  };

  const getTokenInfo = (tokenType: 'base' | 'pepe' | 'boop' | 'none') => {
    switch (tokenType) {
      case 'base':
        return { name: '$base', color: 'text-blue-400', icon: '/candy/1.png' };
      case 'pepe':
        return { name: '$PEPE', color: 'text-green-400', icon: '/candy/2.png' };
      case 'boop':
        return { name: '$BOOP', color: 'text-purple-400', icon: '/candy/player.png' };
      case 'none':
        return { name: 'Better Luck Next Time!', color: 'text-gray-400', icon: '😔' };
      default:
        return { name: 'Unknown', color: 'text-gray-400', icon: '❓' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.95), rgba(236, 72, 153, 0.95))',
        border: '1px solid rgba(147, 51, 234, 0.3)',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        backdropFilter: 'blur(20px)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: 'rgba(255, 255, 255, 0.6)',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {showSuccess ? (
          // Success State
          <div>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>
              ✅
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
              Successfully Claimed!
            </h2>
            
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '16px' }}>
              Your {reward!.amount.toLocaleString()} {getTokenInfo(reward!.tokenType).name} tokens have been claimed successfully!
            </p>
            
            <div style={{ 
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: 'rgb(134, 239, 172)',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              Transaction confirmed on blockchain
            </div>

            <button
              onClick={onClaimComplete}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '18px',
                backgroundColor: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(16, 185, 129))',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
              Continue
            </button>
          </div>
        ) : !showReward ? (
          // Gift Box Closed State
          <div>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>
              🎁
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
              {isOpening ? 'Opening Gift Box...' : 'Congratulations!'}
            </h2>
            
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '24px' }}>
              {isOpening 
                ? 'Your reward is being generated...' 
                : 'You\'ve earned a gift box! Click to open and claim your reward.'
              }
            </p>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'rgb(252, 165, 165)',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                "Something went wrong"
              </div>
            )}

            <button
              onClick={openGiftBox}
              disabled={isOpening}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '18px',
                transition: 'all 0.3s',
                cursor: isOpening ? 'not-allowed' : 'pointer',
                backgroundColor: isOpening 
                  ? 'rgb(75, 85, 99)' 
                  : 'linear-gradient(135deg, rgb(147, 51, 234), rgb(236, 72, 153))',
                color: 'white',
                border: 'none'
              }}
            >
              {isOpening ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '12px'
                  }}></div>
                  Opening...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesomeIcon icon={faGift} style={{ marginRight: '8px' }} />
                  Open Gift Box
                </div>
              )}
            </button>
          </div>
        ) : (
          // Gift Box Opened State
          <div>
            <div style={{ marginBottom: '24px' }}>
              {reward!.tokenType !== 'none' ? (
                <img 
                  src={getTokenInfo(reward!.tokenType).icon} 
                  alt={getTokenInfo(reward!.tokenType).name}
                  style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto' }}
                />
              ) : (
                <div style={{ fontSize: '80px' }}>😔</div>
              )}
            </div>

            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '16px',
              color: reward!.tokenType === 'base' ? 'rgb(96, 165, 250)' :
                     reward!.tokenType === 'pepe' ? 'rgb(74, 222, 128)' :
                     reward!.tokenType === 'boop' ? 'rgb(196, 181, 253)' :
                     'rgb(156, 163, 175)'
            }}>
              {getTokenInfo(reward!.tokenType).name}
            </h2>

            {reward!.tokenType !== 'none' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                  {reward!.amount.toLocaleString()}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {getTokenInfo(reward!.tokenType).name} Tokens
                </div>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Claims today: {reward!.claimsToday}/5
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Remaining: {reward!.remainingClaims}
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'rgb(252, 165, 165)',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <p>Something went wrong</p>
              </div>
            )}

                         <button
               onClick={claimToken}
               disabled={isClaiming || isClaimLoading}
               style={{
                 width: '100%',
                 padding: '16px 24px',
                 borderRadius: '16px',
                 fontWeight: 'bold',
                 fontSize: '18px',
                 transition: 'all 0.3s',
                 cursor: (isClaiming || isClaimLoading) ? 'not-allowed' : 'pointer',
                 backgroundColor: (isClaiming || isClaimLoading)
                   ? 'rgb(75, 85, 99)' 
                   : reward!.tokenType === 'none'
                   ? 'linear-gradient(135deg, rgb(156, 163, 175), rgb(107, 114, 128))'
                   : 'linear-gradient(135deg, rgb(34, 197, 94), rgb(16, 185, 129))',
                 color: 'white',
                 border: 'none'
               }}
             >
               {isClaiming || isClaimLoading ? (
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{
                     width: '20px',
                     height: '20px',
                     border: '2px solid rgba(255,255,255,0.3)',
                     borderTop: '2px solid white',
                     borderRadius: '50%',
                     animation: 'spin 1s linear infinite',
                     marginRight: '12px'
                   }}></div>
                   Claiming...
                 </div>
               ) : reward!.tokenType === 'none' ? (
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
                   Continue
                 </div>
               ) : (
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <FontAwesomeIcon icon={faCoins} style={{ marginRight: '8px' }} />
                   Claim Tokens
                 </div>
               )}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
