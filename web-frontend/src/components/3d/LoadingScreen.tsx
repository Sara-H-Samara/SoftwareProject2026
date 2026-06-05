/**
 * LoadingScreen.tsx
 * Loading overlay rendered inside <Canvas> via <Html>.
 * Uses useProgress() for real percentage tracking.
 */
import { useProgress, Html } from '@react-three/drei'

export default function LoadingScreen() {
  const { progress, active } = useProgress()
  if (!active) return null

  return (
    <Html center>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        fontFamily: '"Playfair Display", Georgia, serif', userSelect: 'none',
      }}>
        {/* Spinner */}
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid rgba(200,170,106,0.2)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid transparent', borderTopColor: '#c8aa6a',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#c8aa6a', fontWeight: 700,
          }}>
            V
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: 180, height: 3, background: 'rgba(200,170,106,0.15)',
          borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: '#c8aa6a',
            width: `${progress}%`, transition: 'width 0.3s ease',
            borderRadius: 4,
          }} />
        </div>

        <p style={{ color: '#a08050', fontSize: 13, fontStyle: 'italic', letterSpacing: '0.04em' }}>
          {progress < 100
            ? `Loading gallery… ${Math.round(progress)}%`
            : 'Entering gallery…'}
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </Html>
  )
}
