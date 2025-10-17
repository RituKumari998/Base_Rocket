import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface ScoreEntry {
  _id: string;
  score: number;
  playerName: string;
  userAddress?: string;
  userPfp?: string;
  userFid?: number;
  timestamp: Date;
}

const LeaderboardPage: React.FC = () => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const router = useRouter();

  const handlePlayGame = () => {
    setIsNavigating(true);
    router.push('/game');
  };

  const handleHome = () => {
    setIsNavigating(true);
    router.push('/');
  };

  useEffect(() => {
    fetchScores();
    startCountdown();
  }, []);

  const startCountdown = () => {
    const targetTimestamp = 1757431107; // Unix timestamp
    const targetDate = new Date(targetTimestamp * 1000);

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        setTimeLeft({ days, hours, minutes, seconds: 0 });

        // Update DOM elements directly for smooth animation
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');

        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        // Update DOM elements
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');

        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minutesEl) minutesEl.textContent = '00';
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute instead of every second

    return () => clearInterval(interval);
  };

  const fetchScores = async () => {
    try {
      const response = await fetch('/api/scores');
      if (response.ok) {
        const data = await response.json();
        setScores(data);
      }
    } catch (error) {
      console.error('Failed to fetch scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  return (
    <div className="leaderboard-container">
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

      <div className="leaderboard-content">
        <div className="leaderboard-banner-compact">
          <div className="banner-content-compact">
            <div className="banner-left">
              <img src="/assets/base.png" alt="base Token" className="base-token-compact" />
              <div className="banner-text-compact">
                <h3 className="banner-title-compact">Top 10 Win 100 base</h3>
                <p className="banner-subtitle-compact">base Rewards</p>
              </div>
            </div>
            <div className="countdown-compact">
              <div className="timer-display-compact">
                <span className="timer-unit-compact">
                  <span className="timer-number-compact" id="days">00</span>
                  <span className="timer-text-compact">D</span>
                </span>
                <span className="timer-separator-compact">:</span>
                <span className="timer-unit-compact">
                  <span className="timer-number-compact" id="hours">00</span>
                  <span className="timer-text-compact">H</span>
                </span>
                <span className="timer-separator-compact">:</span>
                <span className="timer-unit-compact">
                  <span className="timer-number-compact" id="minutes">00</span>
                  <span className="timer-text-compact">M</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="leaderboard-header">
          <div className="header-decoration">
            <div className="header-star">⭐</div>
            <div className="header-star">🌟</div>
            <div className="header-star">✨</div>
          </div>
          <h1 className="leaderboard-title">🏆 Space Leaderboard</h1>
          <p className="leaderboard-subtitle">Elite Rocket Pilots of the Galaxy</p>
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{scores.length}</span>
              <span className="stat-label">Total Pilots</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{scores.length > 0 ? scores[0].score.toLocaleString() : '0'}</span>
              <span className="stat-label">Highest Score</span>
            </div>
          </div>
        </div>

        <div className="leaderboard-list">
          {loading ? (
            <div className="loading-enhanced">
              <div className="loading-animation">
                <div className="loading-rocket">🚀</div>
                <div className="loading-trail"></div>
              </div>
              <p className="loading-text">Loading space data...</p>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : scores.length === 0 ? (
            <div className="no-scores-enhanced">
              <div className="no-scores-animation">
                <div className="no-scores-icon">🌌</div>
                <div className="floating-particles">
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                </div>
              </div>
              <h3 className="no-scores-title">Empty Space</h3>
              <p className="no-scores-message">No pilots have launched yet!</p>
              <p className="no-scores-subtitle">Be the first to make your mark in the galaxy</p>
            </div>
          ) : (
            <div className="leaderboard-grid">
              {scores.map((score, index) => (
                <div key={score._id} className={`score-entry-enhanced ${index < 3 ? 'top-three' : ''} rank-${index + 1}`}>
                  <div className="player-section">
                    <div className="player-card">
                      <div className="player-avatar-container">
                        {score.userPfp ? (
                          <img 
                            src={score.userPfp} 
                            alt="Profile" 
                            className="player-avatar"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="default-avatar">
                            <span className="avatar-icon">🚀</span>
                          </div>
                        )}
                        {index < 3 && <div className="avatar-crown"></div>}
                        <div className="rank-badge-overlay">
                          <div className="rank-badge">
                            <span className="rank-icon">{getRankIcon(index)}</span>
                          </div>
                          {index < 3 && <div className="rank-glow"></div>}
                        </div>
                      </div>
                      
                      <div className="player-details">
                        <h3 className="player-name">{score.playerName || 'Anonymous Pilot'}</h3>
                        <div className="player-meta">
                          <span className="player-date">{formatDate(score.timestamp)}</span>
                         
                        </div>
                        {index < 10 && (
                          <div className="reward-eligible-badge">
                            <span className="reward-icon">🏆</span>
                            <span className="reward-text">Eligible for Reward</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="score-section">
                    <div className="score-display">
                      <div className="score-number">{score.score.toLocaleString()}</div>
                      <div className="score-label">Points</div>
                    </div>
                  
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="leaderboard-actions">
          <motion.button 
            onClick={handlePlayGame}
            disabled={isNavigating}
            className="play-again-button-enhanced"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="button-content">
              <span className="button-icon">🚀</span>
              <span className="button-text">
                {isNavigating ? 'Loading...' : 'Launch Rocket'}
              </span>
            </div>
            <div className="button-glow"></div>
          </motion.button>
        </div>
      </div>

      <div className="bottom-navigation">
        <motion.button 
          onClick={handleHome}
          disabled={isNavigating}
          className="nav-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Home</span>
        </motion.button>
        <motion.button 
          className="nav-button active"
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

export default LeaderboardPage;
