import { useState, useEffect, useMemo } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMyAvatar, useUpdateAvatar } from '@/hooks/useAvatar'
import { AvatarPreview3D } from '@/components/avatar/AvatarPreview3D'
import { AvatarCustomizer } from '@/components/avatar/AvatarCustomizer'
import { DEFAULT_AVATAR } from '@/components/avatar/buildAvatar'
import type { Avatar } from '@/types'

const LOAD_WATCHDOG_MS = 10_000

function cloneDefaultAvatar(): Avatar {
  return { ...DEFAULT_AVATAR }
}

/**
 * Avatar customization screen.
 *
 * Loads the user's avatar from /api/avatars/me. Local state mirrors the
 * server copy for instant 3D preview updates. Falls back to DEFAULT_AVATAR
 * on API failure or a 10 s watchdog so the screen never spins forever.
 */
export default function AvatarCustomizeScreen() {
  const router = useRouter()
  const { next } = useLocalSearchParams<{ next?: string }>()

  const { data: serverAvatar, isLoading, isError, refetch } = useMyAvatar()
  const updateMutation = useUpdateAvatar()

  const [local, setLocal] = useState<Avatar | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  // Sync from server when available — overrides any temporary fallback.
  useEffect(() => {
    if (!serverAvatar) return
    setLocal(serverAvatar)
    setUsingFallback(false)
  }, [serverAvatar])

  // Immediate fallback on query error.
  useEffect(() => {
    if (!isError || local) return
    setLocal(cloneDefaultAvatar())
    setUsingFallback(true)
  }, [isError, local])

  // 10 s watchdog — never leave the user on an infinite loader.
  useEffect(() => {
    if (local) return

    const timer = setTimeout(() => {
      setUsingFallback(true)
      setLocal(prev => prev ?? cloneDefaultAvatar())
    }, LOAD_WATCHDOG_MS)

    return () => clearTimeout(timer)
  }, [local])

  const previewAvatar = useMemo<Avatar>(() => local ?? DEFAULT_AVATAR, [local])

  const dirty = useMemo(() => {
    if (!local) return false
    const baseline = serverAvatar ?? DEFAULT_AVATAR
    return JSON.stringify(stripMeta(local)) !== JSON.stringify(stripMeta(baseline))
  }, [local, serverAvatar])

  const handleChange = (partial: Partial<Avatar>) => {
    setLocal(prev => (prev ? { ...prev, ...partial } : prev))
  }

  const handleSave = async () => {
    if (!local) return
    try {
      const saved = await updateMutation.mutateAsync({
        skinColor: local.skinColor,
        height: local.height,
        hairStyle: local.hairStyle,
        hairColor: local.hairColor,
        shirtStyle: local.shirtStyle,
        shirtColor: local.shirtColor,
        pantsStyle: local.pantsStyle,
        pantsColor: local.pantsColor,
        shoesColor: local.shoesColor,
        accessory: local.accessory,
        accessoryColor: local.accessoryColor,
      })
      setLocal(saved)
      setUsingFallback(false)
      if (next) router.replace(next as any)
      else router.back()
    } catch {
      /* error already toasted by the hook */
    }
  }

  const canSave = dirty || !!next
  const saveDisabled = updateMutation.isPending || !canSave

  if (!local) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="mt-3 text-stone-500">Loading your avatar…</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-stone-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={22} color="#44403c" />
        </TouchableOpacity>
        <Text className="text-stone-800 font-semibold text-base">Customize avatar</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          disabled={isLoading}
          className="p-2"
          accessibilityLabel="Refresh avatar"
        >
          <Ionicons name="refresh-outline" size={20} color={isLoading ? '#d6d3d1' : '#44403c'} />
        </TouchableOpacity>
      </View>

      {/* Offline / fallback banner */}
      {usingFallback && (
        <View className="mx-4 mt-3 flex-row items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <Ionicons name="cloud-offline-outline" size={18} color="#b45309" />
          <Text className="flex-1 text-sm text-amber-800">
            Couldn&apos;t reach the server — showing default avatar. Customizations will sync when you save.
          </Text>
        </View>
      )}

      {/* 3D Preview */}
      <View className="px-4 pt-4">
  <AvatarPreview3D
    key={makeAvatarPreviewKey(previewAvatar)}
    avatar={previewAvatar}
    height={280}
  />
</View>

      {/* Customization panel */}
      <View className="flex-1 px-4 pt-5">
        <AvatarCustomizer avatar={local} onChange={handleChange} />
      </View>

      {/* Bottom action bar */}
      <View className="px-4 py-3 border-t border-stone-100 bg-white">
        <TouchableOpacity
          onPress={handleSave}
          disabled={saveDisabled}
          className={`rounded-2xl py-4 items-center ${
            saveDisabled ? 'bg-stone-300' : 'bg-gallery-600'
          }`}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              {next ? 'Save & Enter Gallery' : dirty ? 'Save Avatar' : 'Saved'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function makeAvatarPreviewKey(a: Avatar): string {
  return [
    a.skinColor,
    a.height,
    a.hairStyle,
    a.hairColor,
    a.shirtStyle,
    a.shirtColor,
    a.pantsStyle,
    a.pantsColor,
    a.shoesColor,
    a.accessory,
    a.accessoryColor,
  ].join('|')
}



function stripMeta(a: Avatar): Omit<Avatar, 'id' | 'userId' | 'updatedAt'> {
  const { id: _id, userId: _u, updatedAt: _t, ...rest } = a
  return rest
}
