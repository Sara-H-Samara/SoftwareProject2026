import { useState, useRef, useEffect } from 'react'
import { CameraIcon, PencilIcon, CheckIcon, XMarkIcon, ShoppingBagIcon, FolderIcon } from '@heroicons/react/24/outline'
import { BellIcon } from '@heroicons/react/24/solid'
import { useUpdateProfile, useUpdateProfilePicture } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getInitials, formatDate } from '@/utils/helpers'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
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

export default function VisitorProfilePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [displayName,       setDisplayName]       = useState(user?.displayName ?? '')
  const [bio,               setBio]               = useState(user?.bio ?? '')
  const [imageError,        setImageError]        = useState(false)
  const [isEditing,         setIsEditing]         = useState(false)
  const [showSuccess,       setShowSuccess]       = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting,        setIsDeleting]        = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate: updateProfile, isPending: isUpdating }     = useUpdateProfile()
  const { mutate: updatePicture, isPending: isUploadingPic } = useUpdateProfilePicture()

  useEffect(() => { setImageError(false) }, [user])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({ displayName: displayName || undefined, bio: bio || undefined }, {
      onSuccess: () => {
        setIsEditing(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
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
        }
      })
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName ?? '')
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
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50">
          <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <CheckIcon className="w-5 h-5" />
            <span className="text-sm">Profile updated!</span>
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
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-stone-200 text-stone-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-60"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Profile</h1>
          <p className="text-sm text-stone-500 mt-0.5">Manage your personal information</p>
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

      <div className="flex items-center justify-between mb-6">
        <Link to="/settings/notifications" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-gallery-600 transition-colors">
          <BellIcon className="w-4 h-4" /> Notification Settings
        </Link>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              {user?.profilePicUrl && !imageError ? (
                <img
                  src={getImageUrl(user.profilePicUrl)}
                  alt={user.displayName ?? 'Profile'}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-gallery-100"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gallery-500 to-purple-600 flex items-center justify-center ring-4 ring-gallery-100 text-2xl font-bold text-white">
                  {getInitials(user?.displayName)}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPic}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gallery-600 border-2 border-white flex items-center justify-center hover:bg-gallery-500 transition-colors disabled:opacity-50"
              >
                {isUploadingPic
                  ? <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  : <CameraIcon className="h-4 w-4 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-stone-800">{user?.displayName || 'Art Enthusiast'}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gallery-50 text-gallery-700">{user?.userType}</span>
              </div>
              <p className="text-sm text-stone-500 mt-0.5">{user?.email}</p>
              <p className="text-xs text-stone-400 mt-2">Member since {user?.createdAt ? formatDate(user.createdAt) : ''}</p>
            </div>
          </div>

          {isEditing && (
            <form onSubmit={handleSave} className="mt-6 pt-6 border-t border-stone-100 space-y-4">
              <Input label="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your public name" maxLength={100} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-stone-700">Bio <span className="text-stone-400 ml-1">(optional)</span></label>
                <textarea
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Tell us about your art interests..."
                  rows={3} maxLength={500}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-700 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-gallery-500"
                />
                <p className="text-xs text-stone-400 text-right">{bio.length}/500</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" isLoading={isUpdating}>Save Changes</Button>
                <button type="button" onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all">
                  <XMarkIcon className="w-4 h-4" /> Cancel
                </button>
              </div>
            </form>
          )}

          {!isEditing && bio && (
            <div className="mt-6 pt-6 border-t border-stone-100">
              <h3 className="text-sm font-medium text-stone-700 mb-2">Bio</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        <Link to="/collections" className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-stone-100 hover:border-gallery-200 hover:shadow-sm transition-all group">
          <div className="w-9 h-9 rounded-xl bg-gallery-50 flex items-center justify-center group-hover:bg-gallery-100 transition-colors flex-shrink-0">
            <FolderIcon className="w-5 h-5 text-gallery-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-800">My Collections</p>
            <p className="text-xs text-stone-400">Saved artworks</p>
          </div>
        </Link>
        <Link to="/orders" className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-stone-100 hover:border-gallery-200 hover:shadow-sm transition-all group">
          <div className="w-9 h-9 rounded-xl bg-gallery-50 flex items-center justify-center group-hover:bg-gallery-100 transition-colors flex-shrink-0">
            <ShoppingBagIcon className="w-5 h-5 text-gallery-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-800">Order History</p>
            <p className="text-xs text-stone-400">Past purchases</p>
          </div>
        </Link>
      </div>

      {/* Account info */}
      <div className="pt-8 border-t border-stone-100">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ReadOnlyField label="Email"        value={user?.email ?? '—'} />
          <ReadOnlyField label="Account Type" value={user?.userType ?? '—'} />
          <ReadOnlyField label="User ID"      value={user?.id?.slice(0, 8) ?? '—'} />
          <ReadOnlyField label="Member Since" value={user?.createdAt ? formatDate(user.createdAt) : '—'} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-8 p-5 rounded-2xl border border-stone-100">
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