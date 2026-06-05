import { useState, useCallback, Suspense, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import {
  SparklesIcon, DocumentArrowDownIcon, ArrowLeftIcon, LockClosedIcon,
  CheckBadgeIcon, ArrowRightIcon, CubeIcon, Squares2X2Icon,
  PaintBrushIcon, BuildingOffice2Icon, PhotoIcon, SunIcon,
  HomeIcon, DeviceTabletIcon, CloudArrowUpIcon,
} from '@heroicons/react/24/outline'

import { useGalleryDesignStore } from '@/store/galleryDesignStore'
import { galleryStudioApi } from '@/api/galleryStudio.api'
import { ROUTES } from '@/utils/constants'
import Button from '@/components/common/Button'
import SubscriptionModal from '@/components/gallery-studio-pro/SubscriptionModal'
import StructureEditor from '@/components/gallery-studio-pro/StructureEditor'
import WallsEditor from '@/components/gallery-studio-pro/WallsEditor'
import FloorEditor from '@/components/gallery-studio-pro/FloorEditor'
import LightingEditor from '@/components/gallery-studio-pro/LightingEditor'
import StyledGalleryRoom from '@/components/gallery/StyledGalleryRoom'
import toast from 'react-hot-toast'

type TabId = 'structure' | 'walls' | 'floor' | 'lighting' | 'furniture' | 'environment'

interface TabDef {
  id: TabId
  label: string
  icon: typeof HomeIcon
  isPro: boolean
}

const TABS: TabDef[] = [
  { id: 'structure', label: 'Structure', icon: BuildingOffice2Icon, isPro: false },
  { id: 'walls', label: 'Walls', icon: PaintBrushIcon, isPro: false },
  { id: 'floor', label: 'Floor', icon: Squares2X2Icon, isPro: false },
  { id: 'lighting', label: 'Lighting', icon: SunIcon, isPro: false },
  { id: 'furniture', label: 'Furniture', icon: DeviceTabletIcon, isPro: true },
  { id: 'environment', label: 'Environment', icon: PhotoIcon, isPro: true },
]

const PRESETS = [
  { 
    id: 'classic', 
    name: 'Classic White', 
    description: 'Elegant white gallery with warm lighting',
    gradient: 'from-stone-100 to-stone-200',
    wallColor: '#f5f0eb',
    floorColor: '#d4c9a8',
    material: 'plaster',
    floorMaterial: 'marble',
    pillars: false
  },
  { 
    id: 'modern', 
    name: 'Modern Gray', 
    description: 'Contemporary gray tones with soft shadows',
    gradient: 'from-gray-300 to-gray-400',
    wallColor: '#e0e0e0',
    floorColor: '#a0a0a0',
    material: 'concrete',
    floorMaterial: 'polished_concrete',
    pillars: false
  },
  { 
    id: 'pillars', 
    name: 'Grand Pillars', 
    description: 'Classic architecture with majestic columns',
    gradient: 'from-amber-100 to-stone-300',
    wallColor: '#ede5d8',
    floorColor: '#c8b898',
    material: 'plaster',
    floorMaterial: 'marble',
    pillars: true
  },
  { 
    id: 'charcoal', 
    name: 'Charcoal Dark', 
    description: 'Sophisticated dark tones for drama',
    gradient: 'from-gray-700 to-gray-800',
    wallColor: '#3a3a3a',
    floorColor: '#2a2a2a',
    material: 'concrete',
    floorMaterial: 'epoxy',
    pillars: false
  },
]

type TimeoutHandle = ReturnType<typeof setTimeout>

function ProGateOverlay({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 rounded-xl">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
        <LockClosedIcon className="w-6 h-6 text-white" />
      </div>
      <div className="text-center max-w-xs">
        <p className="font-bold text-gray-800 text-lg">Professional Feature</p>
        <p className="text-gray-500 text-sm mt-1">Unlock advanced furniture and environment controls</p>
      </div>
      <button
        onClick={onUnlock}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
      >
        <SparklesIcon className="w-4 h-4" />
        Upgrade to Pro
      </button>
    </div>
  )
}

function SceneLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-amber-200/70 text-xs tracking-wider uppercase">Loading 3D Scene...</p>
      </div>
    </Html>
  )
}

export default function GalleryStudioProPage() {
  const navigate = useNavigate()

  const {
    customization,
    setCustomization,
    activeTab,
    setActiveTab,
    hasUnsavedChanges,
    resetToDefault,
  } = useGalleryDesignStore()

  const [isSaving, setIsSaving] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null)
  
  const debounceTimerRef = useRef<TimeoutHandle | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([
      galleryStudioApi.getSubscriptionStatus(),
      galleryStudioApi.getCustomization()
    ]).then(([status, data]) => {
      if (mounted) {
        setIsPro(status.isActive)
        if (data) setCustomization(data)
        setIsLoading(false)
      }
    }).catch(() => {
      if (mounted) setIsLoading(false)
    })
    return () => { mounted = false }
  }, [setCustomization])

  const performAutoSave = useCallback(async () => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return
    try {
      await galleryStudioApi.saveCustomization(customization)
      setLastSaved(new Date())
      setSaveError(null)
    } catch {
      setSaveError('Auto-save failed')
    }
  }, [customization, hasUnsavedChanges, autoSaveEnabled])

  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(performAutoSave, 3000)
    }
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [customization, hasUnsavedChanges, autoSaveEnabled, performAutoSave])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await galleryStudioApi.saveCustomization(customization)
      setLastSaved(new Date())
      toast.success('Gallery design saved')
      return true
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Save failed')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [customization])

  const handleSaveAndContinue = useCallback(async () => {
    if (await handleSave()) navigate(ROUTES.DASHBOARD_LAYOUT)
  }, [handleSave, navigate])

  const handleExit = useCallback(() => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Leave anyway?')) return
    navigate(ROUTES.DASHBOARD)
  }, [hasUnsavedChanges, navigate])

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setCustomization({
      ...customization,
      walls: { 
        ...customization.walls, 
        color: preset.wallColor, 
        material: preset.material as any, 
        roughness: 0.6 
      },
      floor: { 
        ...customization.floor, 
        color: preset.floorColor, 
        material: preset.floorMaterial as any, 
        gloss: 0.4, 
        roughness: 0.3 
      },
      structure: {
        ...customization.structure,
        pillars: preset.pillars
      }
    })
    toast.success(`${preset.name} theme applied`)
  }, [customization, setCustomization])

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all settings to default?')) {
      resetToDefault()
      toast.success('Reset to defaults')
    }
  }, [resetToDefault])

  const handleTabClick = (tab: TabDef) => {
    if (tab.isPro && !isPro) return setShowSubscriptionModal(true)
    setActiveTab(tab.id)
  }

  const handleSubscribe = useCallback(async (planId: 'monthly' | 'yearly') => {
    try {
      const result = await galleryStudioApi.createSubscription(planId)
      if (result.checkoutUrl) window.location.href = result.checkoutUrl
    } catch {
      toast.error('Subscription failed')
    }
    setShowSubscriptionModal(false)
  }, [])

  const renderEditor = () => {
    switch (activeTab) {
      case 'structure': return <StructureEditor />
      case 'walls': return <WallsEditor />
      case 'floor': return <FloorEditor />
      case 'lighting': return <LightingEditor />
      default: return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
            {activeTab === 'furniture' ? <DeviceTabletIcon className="w-10 h-10 text-gray-400" /> : <PhotoIcon className="w-10 h-10 text-gray-400" />}
          </div>
          <p className="font-semibold text-gray-700">{activeTab === 'furniture' ? 'Furniture Editor' : 'Environment Editor'}</p>
          <p className="text-sm text-gray-400">Coming soon in a future update</p>
        </div>
      )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  const currentTab = TABS.find(t => t.id === activeTab)
  const isProTabLocked = currentTab?.isPro && !isPro

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
          <button onClick={handleExit} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold text-gray-800">Gallery Studio Pro</h1>
            {!isPro ? (
              <button onClick={() => setShowSubscriptionModal(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                <LockClosedIcon className="w-3 h-3" /> Upgrade
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <CheckBadgeIcon className="w-3 h-3" /> Professional
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {saveError && <span className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{saveError}</span>}
            {lastSaved && !hasUnsavedChanges && <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">Saved {lastSaved.toLocaleTimeString()}</span>}
            {hasUnsavedChanges && <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Unsaved</span>}
            
            <button onClick={() => setAutoSaveEnabled(!autoSaveEnabled)} className={`p-1.5 rounded ${autoSaveEnabled ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
              <CloudArrowUpIcon className="w-4 h-4" />
            </button>
            
            <Button variant="secondary" size="sm" onClick={() => handleSave()} isLoading={isSaving} leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}>Save</Button>
            <Button size="sm" onClick={handleSaveAndContinue} leftIcon={<Squares2X2Icon className="w-4 h-4" />} rightIcon={<ArrowRightIcon className="w-4 h-4" />}>Save & Continue</Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="grid lg:grid-cols-[380px,1fr] gap-6" style={{ height: 'calc(100vh - 100px)' }}>

          <aside className="flex flex-col gap-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Quick Presets</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Apply professionally curated gallery themes</p>
                  </div>
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      onMouseEnter={() => setHoveredPreset(preset.id)}
                      onMouseLeave={() => setHoveredPreset(null)}
                      className="group text-left transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        hoveredPreset === preset.id ? 'border-amber-400 shadow-lg' : 'border-gray-100'
                      }`}>
                        <div className={`h-16 w-full bg-gradient-to-br ${preset.gradient} transition-transform duration-300 group-hover:scale-105`} />
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
                          <div className="flex-1" style={{ backgroundColor: preset.wallColor }} />
                          <div className="flex-1" style={{ backgroundColor: preset.floorColor }} />
                        </div>
                        {preset.pillars && (
                          <div className="absolute bottom-1 left-1 right-1 flex justify-between px-2">
                            <div className="w-1.5 h-3 bg-white/60 rounded-sm" />
                            <div className="w-1.5 h-3 bg-white/60 rounded-sm" />
                            <div className="w-1.5 h-3 bg-white/60 rounded-sm" />
                            <div className="w-1.5 h-3 bg-white/60 rounded-sm" />
                          </div>
                        )}
                        {hoveredPreset === preset.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckBadgeIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2.5">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-amber-700 transition-colors">
                          {preset.name}
                          {preset.pillars && (
                            <span className="ml-1.5 text-[9px] font-normal text-amber-500 bg-amber-50 px-1 py-0.5 rounded">Pillars</span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-shrink-0">
              <div className="grid grid-cols-3">
                {TABS.map((tab, i) => {
                  const isActive = activeTab === tab.id
                  const isLocked = tab.isPro && !isPro
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab)}
                      className={`relative flex flex-col items-center gap-1.5 py-3 text-center transition-all
                        ${i % 3 !== 2 ? 'border-r' : ''} ${i < 3 ? 'border-b' : ''} border-gray-100
                        ${isActive ? 'bg-amber-50 shadow-inner' : 'hover:bg-gray-50'}
                        ${i === 0 ? 'rounded-tl-2xl' : ''} ${i === 2 ? 'rounded-tr-2xl' : ''}
                        ${i === 3 ? 'rounded-bl-2xl' : ''} ${i === 5 ? 'rounded-br-2xl' : ''}`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${isActive ? 'text-amber-700' : 'text-gray-500'}`}>{tab.label}</span>
                      {isLocked && <LockClosedIcon className="absolute top-1 right-1 w-3 h-3 text-amber-400" />}
                      {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-500 rounded-full" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm relative flex-1 overflow-y-auto">
              <div className="p-5">{renderEditor()}</div>
              {isProTabLocked && <ProGateOverlay onUnlock={() => setShowSubscriptionModal(true)} />}
            </div>

            <button onClick={handleReset} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Reset to Defaults
            </button>
          </aside>

          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-4 text-sm text-gray-500 shrink-0 shadow-sm">
              <CubeIcon className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-gray-700">Live Preview</span>
              <div className="w-px h-5 bg-gray-200" />
              <span>{customization.structure?.roomWidth ?? 22}m × {customization.structure?.roomDepth ?? 22}m</span>
              <span className="ml-auto text-gray-400 text-xs hidden xl:block">Drag to orbit • Scroll to zoom</span>
            </div>

            <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl relative min-h-[400px]">
              <Canvas camera={{ position: [0, 6, 14], fov: 58 }} gl={{ antialias: true }}>
                <PerspectiveCamera makeDefault position={[0, 6, 14]} fov={58} />
                <Suspense fallback={<SceneLoader />}>
                  <StyledGalleryRoom customization={customization} highQuality={false} />
                </Suspense>
                <OrbitControls enableZoom enablePan={false} minDistance={4} maxDistance={24} maxPolarAngle={Math.PI / 1.85} target={[0, 2, 0]} autoRotate autoRotateSpeed={0.4} />
              </Canvas>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-full">
                Live 3D Preview
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex items-center justify-between text-sm text-gray-500 shrink-0 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">1</span><span>Design</span></div>
                <ArrowRightIcon className="w-4 h-4 text-gray-300" />
                <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center">2</span><span>Place</span></div>
                <ArrowRightIcon className="w-4 h-4 text-gray-300" />
                <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">3</span><span>Share</span></div>
              </div>
              {hasUnsavedChanges && <span className="text-xs text-amber-600 animate-pulse">Unsaved changes</span>}
            </div>
          </div>
        </div>
      </div>

      {showSubscriptionModal && <SubscriptionModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} onSubscribe={handleSubscribe} />}
    </div>
  )
}