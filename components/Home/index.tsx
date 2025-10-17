'use client'

import Homepage from '@/components/HomePage'
import { useFrame } from '@/components/farcaster-provider'
import { useEffect } from 'react'

export function Demo() {

  const { isSDKLoaded, actions } = useFrame()
  useEffect(()=>{
    if(isSDKLoaded){
      actions?.addFrame()
    }
  },[isSDKLoaded])

  return (
      <div className="h-[90vh] w-full max-w-md">
        <Homepage />
      </div>

  )
}
