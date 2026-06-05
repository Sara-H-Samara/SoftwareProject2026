// src/components/gallery-room/XRSupport.tsx
import { useEffect, useState } from 'react'

interface XRSupportProps {
  enabled?: boolean
}

export function XRSupport({ enabled = false }: XRSupportProps) {
  const [isXRSupported, setIsXRSupported] = useState(false)
  const [isPresenting, setIsPresenting] = useState(false)

  useEffect(() => {
    // Check if WebXR is supported
    const checkXRSupport = async () => {
      if ('xr' in navigator) {
        try {
          const supported = await (navigator as any).xr?.isSessionSupported('immersive-vr')
          setIsXRSupported(!!supported)
        } catch {
          setIsXRSupported(false)
        }
      }
    }
    
    if (enabled) {
      checkXRSupport()
    }
  }, [enabled])

  // Listen for XR session events
  useEffect(() => {
    if (!isXRSupported || !enabled) return

    const handleXRSessionStart = () => setIsPresenting(true)
    const handleXRSessionEnd = () => setIsPresenting(false)

    window.addEventListener('xrsessionstart' as any, handleXRSessionStart)
    window.addEventListener('xrsessionend' as any, handleXRSessionEnd)

    return () => {
      window.removeEventListener('xrsessionstart' as any, handleXRSessionStart)
      window.removeEventListener('xrsessionend' as any, handleXRSessionEnd)
    }
  }, [isXRSupported, enabled])

  if (!isXRSupported || !enabled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={async () => {
          try {
            const xrDevice = await (navigator as any).xr?.requestSession('immersive-vr')
            if (xrDevice) {
              console.log('XR session started')
            }
          } catch (error) {
            console.error('Failed to start XR session:', error)
          }
        }}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
      >
        {isPresenting ? 'Exit VR' : 'Enter VR'}
      </button>
    </div>
  )
}

// Optional: VR Button Component (simpler version)
export function VRButton() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    const checkSupport = async () => {
      if ('xr' in navigator) {
        try {
          const supported = await (navigator as any).xr?.isSessionSupported('immersive-vr')
          setIsSupported(!!supported)
        } catch {
          setIsSupported(false)
        }
      }
    }
    checkSupport()
  }, [])

  if (!isSupported) return null

  return (
    <button
      onClick={async () => {
        try {
          await (navigator as any).xr?.requestSession('immersive-vr')
        } catch (error) {
          console.error('Failed to start VR:', error)
        }
      }}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
    >
      🥽 Enter VR
    </button>
  )
}