interface FarcadeSDKSinglePlayer {
  actions: {
    ready: () => void;
    gameOver: (data: { score: number }) => void;
    hapticFeedback: () => void;
  };
}

interface FarcadeSDK {
  on: (event: string, callback: (data?: any) => void) => void;
  singlePlayer: FarcadeSDKSinglePlayer;
}

declare global {
  interface Window {
    FarcadeSDK?: FarcadeSDK;
  }
}

export {};
