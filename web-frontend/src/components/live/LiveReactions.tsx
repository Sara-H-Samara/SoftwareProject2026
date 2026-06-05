import { useEffect, useState } from 'react'
import { Reaction } from '@/hooks/useLiveSession'

interface FloatingEmoji {
  id: number
  emoji: string
  x: number
}

interface Props {
  artworkId: string
  reactions: Reaction[]
  onReact: (emoji: string) => void
}

const EMOJIS = ['❤️', '😮', '🔥']

export function LiveReactions({ artworkId, reactions, onReact }: Props) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([])
  const [counter, setCounter] = useState(0)

  // Show floating emoji when a new reaction comes in for this artwork
  useEffect(() => {
    const last = reactions[reactions.length - 1]
    if (!last || last.artworkId !== artworkId) return

    const id = counter + 1
    setCounter(id)
    setFloating(f => [...f, { id, emoji: last.emoji, x: 20 + Math.random() * 60 }])

    const timer = setTimeout(() => {
      setFloating(f => f.filter(e => e.id !== id))
    }, 2000)

    return () => clearTimeout(timer)
  }, [reactions])

  return (
    <div className="relative">
      {/* Floating emojis */}
      <div className="absolute bottom-12 left-0 right-0 pointer-events-none overflow-hidden h-24">
        {floating.map(e => (
          <span
            key={e.id}
            className="absolute text-2xl animate-float-up"
            style={{ left: `${e.x}%` }}
          >
            {e.emoji}
          </span>
        ))}
      </div>

      {/* Reaction buttons */}
      <div className="flex gap-2">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="text-xl px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:scale-110 active:scale-95 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}