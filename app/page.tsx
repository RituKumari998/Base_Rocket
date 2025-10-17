import { APP_URL } from "../lib/constants";
import type { Metadata } from 'next'
import { useEffect } from 'react'
import App from '../components/pages/app'


const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: 'Play Now',
    action: {
      type: 'launch_frame',
      name: 'Base Rocket',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: '#0a0a0a',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Base Rocket',
    openGraph: {
      title: 'Base Rocket',
      description: '',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}


export default function Home() {
  return <App />
}
