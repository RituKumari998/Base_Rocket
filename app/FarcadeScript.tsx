'use client';

import Script from 'next/script';

export default function FarcadeScript() {
  return (
    <Script 
      src="https://cdn.jsdelivr.net/npm/@farcade/game-sdk@latest/dist/index.min.js"
      strategy="beforeInteractive"
    />
  );
}
