'use client';

import React, { useState, useEffect } from 'react';

interface GameLoaderProps {
  onAssetsLoaded: () => void;
}

const GameLoader: React.FC<GameLoaderProps> = ({ onAssetsLoaded }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const loadAssets = async () => {
      const assets = [
        '/assets/rocket-base-short.svg',
        '/assets/rocket-base-medium.svg',
        '/assets/rocket-base-large.svg',
        '/assets/platform-asteroid.svg',
        '/assets/platform-space-station.svg',
        '/assets/platform-crystal.svg',
        '/assets/platform-energy.svg',
        '/assets/base.png'
      ];

      let loadedCount = 0;
      const totalAssets = assets.length;

      const loadAsset = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            const progress = Math.round((loadedCount / totalAssets) * 100);
            setLoadingProgress(progress);
            
            if (loadedCount <= 3) {
              setLoadingText('Loading rocket assets...');
            } else if (loadedCount <= 7) {
              setLoadingText('Loading platform assets...');
            } else {
              setLoadingText('Finalizing...');
            }
            
            resolve();
          };
          img.onerror = reject;
          img.src = src;
        });
      };

      try {
        await Promise.all(assets.map(loadAsset));
        setLoadingText('Ready to launch!');
        setTimeout(() => {
          onAssetsLoaded();
        }, 500);
      } catch (error) {
        console.error('Failed to load assets:', error);
        setLoadingText('Loading failed. Retrying...');
        setTimeout(() => {
          loadAssets();
        }, 1000);
      }
    };

    loadAssets();
  }, [onAssetsLoaded]);

  return (
    <div className="game-loader">
      <div className="loader-background">
        <div className="stars-background">
          {Array.from({ length: 50 }).map((_, i) => (
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
      </div>

      <div className="loader-content">
        <div className="loader-animation">
          <div className="rocket-loader">
            <div className="rocket-body">🚀</div>
            <div className="rocket-trail"></div>
          </div>
        </div>

        <div className="loader-text">
          <h2 className="loader-title">Preparing Rocket Launch</h2>
          <p className="loader-subtitle">{loadingText}</p>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">{loadingProgress}%</div>
        </div>

        <div className="loading-tips">
          <div className="tip-item">
            <span className="tip-icon">🎯</span>
            <span className="tip-text">Click and drag to aim your rocket</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🚀</span>
            <span className="tip-text">Release to launch into space</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🏆</span>
            <span className="tip-text">Compete for base rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLoader;
