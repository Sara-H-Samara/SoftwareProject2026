// src/pages/Auth/AvatarSetupPage.tsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMyAvatar, useUpdateAvatar } from '@/hooks/useAvatar'
import { AvatarPreview3D } from '@/components/avatar/AvatarPreview3D'
import { AvatarCustomizer } from '@/components/avatar/AvatarCustomizer'
import { DEFAULT_AVATAR } from '@/components/avatar/buildAvatar'
import type { Avatar } from '@/types/avatar'
import { Spinner } from '@/components/common/Spinner'
import toast from 'react-hot-toast'

export default function AvatarSetupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')

  const { data: serverAvatar, isLoading } = useMyAvatar()
  const updateMutation = useUpdateAvatar()

  const [localAvatar,   setLocalAvatar]   = useState<Avatar | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [isSaving,      setIsSaving]      = useState(false)

  // Sync local state with server data.
  // Only runs when serverAvatar or isLoading change — localAvatar intentionally excluded
  // from deps to avoid a re-run loop (effect sets localAvatar → effect fires again).
  useEffect(() => {
    if (serverAvatar) {
      setLocalAvatar(serverAvatar)
      setUsingFallback(false)
    } else if (!isLoading) {
      // Server returned no avatar (new user) — seed with defaults
      setLocalAvatar(prev => prev ?? (DEFAULT_AVATAR as Avatar))
      setUsingFallback(true)
    }
  }, [serverAvatar, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // True when local state diverges from the last saved server state
  const isDirty = useMemo(() => {
    if (!localAvatar || !serverAvatar) return !!localAvatar
    const strip = ({ id: _id, userId: _u, updatedAt: _t, ...rest }: Avatar) => rest
    return JSON.stringify(strip(localAvatar)) !== JSON.stringify(strip(serverAvatar))
  }, [localAvatar, serverAvatar])

  const handleAvatarChange = useCallback((partial: Partial<Avatar>) => {
    setLocalAvatar(prev => prev ? { ...prev, ...partial } : null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!localAvatar) return
    setIsSaving(true)
    try {
      await updateMutation.mutateAsync(localAvatar)
      toast.success('Avatar saved!')
      navigate(next ?? '/profile')
    } catch {
      toast.error('Failed to save avatar')
    } finally {
      setIsSaving(false)
    }
  }, [localAvatar, updateMutation, next, navigate])

  if (isLoading || !localAvatar) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-stone-800">Customize Your Avatar</h1>
          <div className="w-10" />
        </div>

        {/* Fallback notice */}
        {usingFallback && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            Couldn't reach the server — showing default avatar. Customizations will sync when you save.
          </div>
        )}

        {/* Main layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
            <AvatarPreview3D avatar={localAvatar} autoRotate />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            <AvatarCustomizer avatar={localAvatar} onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="px-6 py-2 rounded-xl bg-gallery-600 text-white font-medium hover:bg-gallery-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving…' : next ? 'Save & Continue' : 'Save Avatar'}
          </button>
        </div>

      </div>
    </div>
  )
}