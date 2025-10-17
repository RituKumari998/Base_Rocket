'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Game component with no SSR to avoid hydration issues
const Game = dynamic(() => import('@/components/Game'), { ssr: false });

export default function GamePage() {
  return <Game />;
}
