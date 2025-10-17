import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const HomePage: React.FC = () => {
  const { isConnected } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  
  // Handle connect error and refresh page for specific connector error
  useEffect(() => {
    if (connectError) {
      const message = connectError?.message?.toLowerCase?.() || '';
      if (message.includes('connector.getchainid is not a function')) {
        window.location.reload();
      }
    }
  }, [connectError]);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handlePlayGame = () => {
    setIsNavigating(true);
    router.push('/game');
  };

  const handleLeaderboard = () => {
    setIsNavigating(true);
    router.push('/leaderboard');
  };

  return (
    <div className="home-container">
      <div className="stars-background">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
      
      <div className="home-content">
        <div className="logo-section">
          <div className="rocket-logo">
            <svg width="120" height="160" viewBox="0 0 120 160" fill="none">
              <rect x="40" y="20" width="40" height="100" fill="#2D374B" rx="4"/>
              <rect x="44" y="30" width="32" height="16" fill="#4A90E2" rx="2"/>
              <rect x="44" y="50" width="32" height="16" fill="#4A90E2" rx="2"/>
              <rect x="44" y="70" width="32" height="16" fill="#4A90E2" rx="2"/>
              <path d="M60 10 L80 20 L40 20 Z" fill="#4A90E2"/>
              <path d="M30 115 L40 125 L40 105 Z" fill="#2D374B"/>
              <path d="M90 115 L80 125 L80 105 Z" fill="#2D374B"/>
              <ellipse cx="50" cy="130" rx="6" ry="16" fill="#4A90E2"/>
              <ellipse cx="70" cy="130" rx="6" ry="16" fill="#4A90E2"/>
              <circle cx="60" cy="50" r="12" fill="#4A90E2"/>
              <circle cx="60" cy="50" r="8" fill="#E6F3FF"/>
              <rect x="56" y="46" width="2" height="8" fill="#FFFFFF"/>
              <rect x="60" y="46" width="2" height="8" fill="#FFFFFF"/>
              <rect x="64" y="46" width="2" height="8" fill="#4A90E2"/>
            </svg>
          </div>
          <h1 className="game-title">Base Rocket</h1>
          <p className="game-subtitle">Launch your rocket to the stars!</p>
        </div>

        <div className="action-buttons">
          {!isConnected ? (
            <div className="wallet-connection-section">
              <div className="wallet-message">
                <p>Connect your wallet to start playing and save your scores!</p>
              </div>
              <motion.div 
                className="mb-8 max-w-sm mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <motion.button
                  type="button"
                  onClick={() => connect({ connector: connectors[0] })}
                  className="connect-wallet-button"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    boxShadow: '0 8px 25px -5px rgba(74, 144, 226, 0.3), 0 0 20px rgba(74, 144, 226, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <span className="wallet-icon">⚡</span>
                    <span className="font-black tracking-wider">CONNECT WALLET</span>
                    <span className="arrow-icon">→</span>
                  </div>
                </motion.button>
              </motion.div>
            </div>
          ) : (
            <motion.button 
              onClick={handlePlayGame}
              disabled={isNavigating}
              className="play-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="button-text">
                {isNavigating ? '🚀 Loading...' : '🚀 PLAY GAME'}
              </span>
              <div className="button-glow"></div>
            </motion.button>
          )}
        </div>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">⭐</div>
            <span>Space Adventure</span>
          </div>
          <div className="feature">
            <div className="feature-icon">🏆</div>
            <span>Leaderboard</span>
          </div>
          <div className="feature">
            <div className="feature-icon">🎮</div>
            <span>Physics Based</span>
          </div>
        </div>
      </div>

      <div className="bottom-navigation">
        <motion.button 
          className="nav-button active"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Home</span>
        </motion.button>
        <motion.button 
          onClick={handleLeaderboard}
          disabled={isNavigating}
          className="nav-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="nav-icon">🏆</span>
          <span className="nav-text">Leaderboard</span>
        </motion.button>
      </div>
    </div>
  );
};

export default HomePage;
