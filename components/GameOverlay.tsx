import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useFrame } from '@/components/farcaster-provider';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';

// Contract configuration
const CONTRACT_ADDRESS = '0x944379223fD1B50cBB78F2d70182177217107F7e';
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_score", "type": "uint256" },
      { "internalType": "string", "name": "_playerName", "type": "string" },
      { "internalType": "string", "name": "_userPfp", "type": "string" },
      { "internalType": "uint256", "name": "_fid", "type": "uint256" }
    ],
    "name": "saveScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;



interface GameOverlayProps {
  score: number;
  onPlayAgain: () => void;
  onClose: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ score, onPlayAgain, onClose }) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [userData, setUserData] = useState<{name: string, pfp: string, address: string, fid?: number} | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txTimeout, setTxTimeout] = useState<NodeJS.Timeout | null>(null);
  const { address } = useAccount();

  // Contract hooks
  const { writeContract, data: hash, isPending: isContractPending, error: contractError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle contract errors (including user cancellation)
  useEffect(() => {
    if (contractError) {
      console.error('Contract error:', contractError);
      setSubmitMessage('Transaction cancelled or failed. Please try again.');
      setIsSubmitting(false);
      // Clear timeout on error
      if (txTimeout) {
        clearTimeout(txTimeout);
        setTxTimeout(null);
      }
    }
  }, [contractError, txTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (txTimeout) {
        clearTimeout(txTimeout);
      }
    };
  }, [txTimeout]);

  // Get user data from Farcaster context
  const { context } = useFrame();
  const { context: miniAppContext, actions } = useMiniAppContext();
  
  useEffect(() => {
    if (context?.user && address) {
      const user = context.user;
      setUserData({
        name: user.username || `FID ${user.fid}` || 'Anonymous Pilot',
        pfp: user.pfpUrl || '',
        address: address,
        fid: user.fid
      });
      setPlayerName(user.username || `FID ${user.fid}` || 'Anonymous Pilot');
    }
  }, [context, address]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      setTxHash(hash);
      // Clear timeout on successful confirmation
      if (txTimeout) {
        clearTimeout(txTimeout);
        setTxTimeout(null);
      }
      // After successful on-chain transaction, save to off-chain database
      saveToOffChainDatabase();
    }
  }, [isConfirmed, hash, txTimeout]);

  const handleSubmitScore = async () => {
    if (!playerName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage('Saving score to Onchain...');

    // Clear any existing timeout
    if (txTimeout) {
      clearTimeout(txTimeout);
    }

    // Set a timeout to handle stuck transactions (30 seconds)
    const timeout = setTimeout(() => {
      setSubmitMessage('Transaction is taking too long. Please try again.');
      setIsSubmitting(false);
    }, 30000);
    setTxTimeout(timeout);

    try {
      // First, save to smart contract (on-chain)
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'saveScore',
        args: [
          BigInt(score),
          playerName.trim(),
          userData?.pfp || '',
          BigInt(userData?.fid || 0)
        ],
      });
    } catch (error) {
      console.error('Error calling smart contract:', error);
      setSubmitMessage('Failed to save score. Please try again.');
      setIsSubmitting(false);
      if (txTimeout) {
        clearTimeout(txTimeout);
        setTxTimeout(null);
      }
    }
  };

  // Function to save to off-chain database after successful on-chain transaction
  const saveToOffChainDatabase = async () => {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          playerName: playerName.trim(),
          userAddress: userData?.address || address || '',
          userPfp: userData?.pfp || '',
          userFid: userData?.fid || null,
          txHash: txHash,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitted(true);
        setSubmitMessage(`Score saved on-chain! ${data.message || 'Also saved to database.'}`);
        
        // Automatically call handleShareScore after successful save
        setTimeout(() => {
          handleShareScore();
        }, 1000); // Small delay to ensure UI updates are complete
      } else {
        console.error('Failed to save to database');
        setSubmitMessage('Score saved on-chain, but failed to save to database.');
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      setSubmitMessage('Score saved on-chain, but failed to save to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareScore = async () => {
    const shareText = `🚀 I just scored ${score.toLocaleString()} points in Base Rocket! Can you beat my score?`;
    const APP_URL = window.location.origin;
    
    try {
      if (actions?.composeCast) {
        // Use Farcaster Mini App compose cast
        await actions.composeCast({
          text: shareText,
          embeds: [APP_URL]
        });
      } else if (navigator.share) {
        // Fallback to native share
        await navigator.share({
          title: 'Base Rocket Score',
          text: shareText,
          url: APP_URL,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText} ${APP_URL}`);
        alert('Score copied to clipboard!');
      }
    } catch (error) {
      console.log('Share cancelled or failed:', error);
      // Final fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText} ${APP_URL}`);
        alert('Score copied to clipboard!');
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
      }
    }
  };

  return (
    <div className="game-overlay">
      <div className="overlay-backdrop" onClick={onClose}></div>
      <div className="overlay-content">
        <div className="overlay-header">
          <div className="game-over-icon">🚀</div>
          <h2 className="game-over-title">Mission Complete!</h2>
        </div>

        {!submitted ? (
          <div className="score-submission">
            {userData ? (
              <div className="user-info-enhanced">
                <div className="user-profile-card">
                  <div className="profile-header">
                    <div className="profile-avatar-container">
                      {userData.pfp ? (
                        <img 
                          src={userData.pfp} 
                          alt="Profile" 
                          className="user-avatar-enhanced"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="default-avatar">
                          <span className="avatar-icon">🚀</span>
                        </div>
                      )}
                      <div className="online-indicator"></div>
                    </div>
                    <div className="profile-badge">
                      <span className="badge-text">PILOT</span>
                    </div>
                  </div>
                  
                  <div className="user-details-enhanced">
                    <h3 className="user-name-enhanced">{userData.name}</h3>
                    <div className="user-stats">
                      <div className="stat-item">
                        <span className="stat-label">FID</span>
                        <span className="stat-value">{userData.fid}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Wallet</span>
                        <span className="stat-value wallet-address">
                          {userData.address.slice(0, 6)}...{userData.address.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="score-display-enhanced">
                  <div className="score-label">Your Score</div>
                  <div className="score-value-enhanced">{score.toLocaleString()}</div>
                  <div className="score-subtitle">Points</div>
                </div>
                
                <button
                  onClick={handleSubmitScore}
                  disabled={isSubmitting || isContractPending || isConfirming}
                  className="submit-score-button-enhanced"
                >
                  <div className="button-content">
                    <div className="button-icon">
                      {isContractPending ? '⏳' : 
                       isConfirming ? '⏳' : 
                       isSubmitting ? '⏳' : '🏆'}
                    </div>
                    <div className="button-text">
                      {isContractPending ? 'Confirming Transaction...' : 
                       isConfirming ? 'Transaction Confirming...' : 
                       isSubmitting ? 'Saving...' : 'Save Score to Onchain'}
                    </div>
                  </div>
                  <div className="button-glow"></div>
                </button>
              </div>
            ) : (
              <div className="input-group-enhanced">
                <div className="input-header">
                  <h3 className="input-title">🚀 Become a Space Pilot</h3>
                  <p className="input-subtitle">Enter your pilot name to save your score</p>
                </div>
                
                <div className="input-container">
                  <div className="input-wrapper">
                    <input
                      id="playerName"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your pilot name"
                      maxLength={20}
                      className="player-name-input-enhanced"
                    />
                    <div className="input-border"></div>
                  </div>
                  <div className="input-hint">
                    <span className="hint-icon">💡</span>
                    <span>Choose a cool space pilot name!</span>
                  </div>
                </div>
                
                <div className="score-preview">
                  <div className="preview-label">Score to Save</div>
                  <div className="preview-value">{score.toLocaleString()} Points</div>
                </div>
                
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim() || isSubmitting || isContractPending || isConfirming}
                  className="submit-score-button-enhanced"
                >
                  <div className="button-content">
                    <div className="button-icon">
                      {isContractPending ? '⏳' : 
                       isConfirming ? '⏳' : 
                       isSubmitting ? '⏳' : '🏆'}
                    </div>
                    <div className="button-text">
                      {isContractPending ? 'Confirming Transaction...' : 
                       isConfirming ? 'Transaction Confirming...' : 
                       isSubmitting ? 'Saving...' : 'Save Score to Blockchain'}
                    </div>
                  </div>
                  <div className="button-glow"></div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="score-submitted-enhanced">
            
            <h3 className="success-title">✅Score Saved Successfully!</h3>
            {/* <p className="success-message">{submitMessage}</p> */}
            {txHash && (
              <div className="transaction-info">
                <div className="tx-label">Transaction Hash:</div>
                <div className="tx-hash" onClick={()=>{
                    actions?.openUrl(`https://baseiscan.io/tx/${txHash}`)
                }}>{txHash.slice(0, 10)}...{txHash.slice(-8)}</div>
              </div>
            )}
          </div>
        )}

        <div className="overlay-actions">
          <button onClick={handleShareScore} className="share-button">
            <span className="button-text">📤 Share Score</span>
            <div className="button-glow"></div>
          </button>
          <button onClick={onPlayAgain} className="play-again-button">
            <span className="button-text">🚀 Play Again</span>
            <div className="button-glow"></div>
          </button>
        </div>

        {/* <button onClick={onClose} className="close-button">
          ✕
        </button>
         */}
        <Link href="/" className="home-button">
          <span className="home-icon">🏠</span>
          <span className="home-text">Home</span>
        </Link>
      </div>
    </div>
  );
};

export default GameOverlay;
