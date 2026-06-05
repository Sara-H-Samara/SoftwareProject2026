import { useState, useRef, useEffect } from 'react'
import { CameraIcon, PencilIcon, CheckIcon, XMarkIcon, ShoppingBagIcon, BellIcon } from '@heroicons/react/24/outline'
import { useUpdateProfile, useUpdateProfilePicture } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getInitials, formatDate } from '@/utils/helpers'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import { useArtistStats } from '@/hooks/useFollows'
import { useUserBadges, useCheckBadges } from '@/hooks/useBadges'
import Badge from '@/components/common/Badge'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/api/axiosInstance'
import toast from 'react-hot-toast'

const getImageUrl = (url: string | undefined) => {
  if (!url || url.includes('default-avatar') || url.includes('yourstorage.blob.core.windows.net'))
    return '/default-avatar.jpg'
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return `${import.meta.env.VITE_API_BASE_URL}${url}`
  return `${import.meta.env.VITE_API_BASE_URL}/${url}`
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: stats } = useArtistStats(user?.id || '')
  const { data: badges } = useUserBadges(user?.id || '')
  const { mutate: checkBadges } = useCheckBadges()

  const [displayName, setDisplayName]         = useState(user?.displayName ?? '')
  const [galleryName, setGalleryName]         = useState(user?.galleryName ?? '')
  const [bio, setBio]                         = useState(user?.bio ?? '')
  const [imageError, setImageError]           = useState(false)
  const [isEditing, setIsEditing]             = useState(false)
  const [showSuccess, setShowSuccess]         = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting]           = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate: updateProfile, isPending: isUpdating }   = useUpdateProfile()
  const { mutate: updatePicture, isPending: isUploadingPic } = useUpdateProfilePicture()

  useEffect(() => {
    setImageError(false)
    if (user) checkBadges()
  }, [user, checkBadges])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({ displayName: displayName || undefined, galleryName: galleryName || undefined, bio: bio || undefined }, {
      onSuccess: () => {
        setIsEditing(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
        checkBadges()
      }
    })
  }

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updatePicture(file, {
        onSuccess: () => {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
          checkBadges()
        }
      })
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName ?? '')
    setGalleryName(user?.galleryName ?? '')
    setBio(user?.bio ?? '')
    setIsEditing(false)
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await api.delete('/api/auth/account')
      useAuthStore.getState().logout()
      navigate('/')
    } catch {
      toast.error('Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <CheckIcon className="w-5 h-5" />
            <span className="text-sm">Profile updated successfully!</span>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-stone-100">
            <h3 className="text-base font-semibold text-stone-800 mb-2">Delete your account?</h3>
            <p className="text-sm text-stone-400 mb-6">
              This will permanently delete your account and all your data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-60"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Profile Settings</h1>
          <p className="text-sm text-stone-500 mt-0.5">Manage your public identity and gallery details</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gallery-600 text-white hover:bg-gallery-700 transition-all"
          >
            <PencilIcon className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard value={stats.totalArtworks}            label="Artworks"  icon="🎨" />
          <StatCard value={stats.totalLikes}               label="Likes"     icon="❤️" />
          <StatCard value={stats.totalFollowers}           label="Followers" icon="👥" />
          <StatCard value={stats.averageRating.toFixed(1)} label="Rating"    icon="⭐" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">

        {/* Profile picture + name */}
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              {user?.profilePicUrl && !imageError ? (
                <img
                  src={getImageUrl(user.profilePicUrl)}
                  alt={user.displayName ?? 'Profile picture'}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-gallery-200"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gallery-500 to-purple-600 flex items-center justify-center ring-4 ring-gallery-200 text-3xl font-bold text-white">
                  {getInitials(user?.displayName)}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPic}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gallery-600 border-2 border-white flex items-center justify-center hover:bg-gallery-500 transition-colors disabled:opacity-50"
                aria-label="Change profile picture"
              >
                {isUploadingPic
                  ? <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  : <CameraIcon className="h-4 w-4 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-stone-800">{user?.displayName || 'No name set'}</h2>
                {user?.userType === 'Artist' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gallery-100 text-gallery-700 border border-gallery-200">Artist</span>
                )}
              </div>
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {[...new Set(badges)].map((badge, i) => (
                    <Badge key={`${badge}-${i}`} type={badge as any} size="md" showTooltip />
                  ))}
                </div>
              )}
              <p className="text-sm text-stone-500 mt-2">{user?.email}</p>
              <p className="text-xs text-stone-400 mt-1">Member since {user?.createdAt ? formatDate(user.createdAt) : ''}</p>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your public name"
              maxLength={100}
              disabled={!isEditing}
              className={!isEditing ? 'opacity-70' : ''}
            />
            {user?.userType === 'Artist' && (
              <Input
                label="Gallery name"
                value={galleryName}
                onChange={e => setGalleryName(e.target.value)}
                placeholder="My Virtual Gallery"
                maxLength={150}
                hint="Shown on your public gallery page"
                disabled={!isEditing}
                className={!isEditing ? 'opacity-70' : ''}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">
              Bio <span className="text-stone-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell visitors a little about yourself and your art…"
              rows={4}
              maxLength={500}
              disabled={!isEditing}
              className={`w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm
                         text-stone-800 placeholder:text-stone-400 resize-none focus:outline-none
                         focus:ring-2 focus:ring-gallery-500 focus:border-transparent
                         hover:border-stone-300 transition-colors ${!isEditing ? 'opacity-70' : ''}`}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-stone-400">{bio.length}/500</p>
              {bio.length > 0 && <span className="text-xs text-gallery-500">✨ Tell your story</span>}
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
              <Button type="submit" isLoading={isUpdating}>Save Changes</Button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all"
              >
                <XMarkIcon className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}
        </form>

        {/* Quick links */}
        <div className="px-6 pb-6 flex gap-3 flex-wrap">
          <Link
            to="/settings/notifications"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all"
          >
            <BellIcon className="w-4 h-4" /> Notification Settings
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all"
          >
            <ShoppingBagIcon className="w-4 h-4" /> Order History
          </Link>
        </div>

        {/* Account info */}
        <div className="p-6 border-t border-stone-100">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ReadOnlyField label="Email"        value={user?.email ?? '—'} />
            <ReadOnlyField label="Account Type" value={user?.userType ?? '—'} />
            <ReadOnlyField label="User ID"      value={user?.id?.slice(0, 8) ?? '—'} />
            <ReadOnlyField label="Member Since" value={user?.createdAt ? formatDate(user.createdAt) : '—'} />
          </div>
        </div>

        {/* Danger zone */}
        <div className="mx-6 mb-6 p-5 rounded-2xl border border-stone-100">
          <h3 className="text-sm font-semibold text-stone-600 mb-1">Danger Zone</h3>
          <p className="text-xs text-stone-400 mb-4">Once you delete your account, there is no going back.</p>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-stone-200 text-stone-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            Delete Account
          </button>
        </div>

      </div>
    </div>
  )
}

function StatCard({ value, label, icon }: { value: string | number; label: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-4 text-center border border-stone-100 shadow-sm hover:shadow-md transition-all">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-bold text-stone-800">{value}</p>
      <p className="text-xs text-stone-500 mt-0.5">{label}</p>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 bg-stone-50 rounded-xl border border-stone-100">
      <span className="text-xs text-stone-500">{label}</span>
      <span className="text-sm text-stone-700">{value}</span>
    </div>
  )
}