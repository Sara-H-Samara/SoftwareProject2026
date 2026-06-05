import { useEffect, useRef, useState } from 'react'

export interface ChatMessage {
  userId: string
  name: string
  message: string
  sentAt: string
  isArtist: boolean
  isSystem: boolean
}

interface Props {
  messages: ChatMessage[]
  onSend: (message: string) => void
  currentUserId: string
  disabled?: boolean
}

export function LiveChat({ messages, onSend, currentUserId, disabled }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const msg = input.trim()
    if (!msg || disabled) return
    onSend(msg)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            No messages yet — say hello! 👋
          </p>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.userId === currentUserId

          if (msg.isSystem) {
            return (
              <div key={i} className="text-center">
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  {msg.message}
                </span>
              </div>
            )
          }

          return (
            <div key={i} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white
                ${msg.isArtist
                  ? 'bg-purple-500'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                {msg.name[0]?.toUpperCase()}
              </div>

              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-medium ${
                    msg.isArtist ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {msg.name}
                    {msg.isArtist && <span className="ml-1 px-1 py-0.5 rounded text-[8px] bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">Artist</span>}
                  </span>
                </div>
                <div className={`px-3 py-1.5 rounded-2xl text-sm leading-relaxed ${
                  isOwn
                    ? 'bg-purple-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm'
                }`}>
                  {msg.message}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={disabled ? 'Session ended' : 'Say something...'}
            disabled={disabled}
            maxLength={300}
            className="flex-1 px-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-40 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}