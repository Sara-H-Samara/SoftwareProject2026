import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  CloudArrowUpIcon, SparklesIcon, PhotoIcon,
  XMarkIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { useCreateArtwork, useUpdateArtwork, useArtwork } from '@/hooks/useArtworks'
import { aiApi } from '@/api/ai.api'
import { ROUTES, ARTWORK_TYPES } from '@/utils/constants'
import { getApiErrorMessage } from '@/utils/helpers'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import type { ArtworkType } from '@/types'
import toast from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const DIMENSION_UNITS = ['cm', 'inches', 'mm', 'm', 'ft']

async function toBase64DataUrl(file: File, maxDim = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = (height * maxDim) / width; width = maxDim }
        else                { width  = (width  * maxDim) / height; height = maxDim }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function UploadArtworkPage() {
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const navigate = useNavigate()
  const isEditMode = Boolean(editId)
  const { data: existingArtwork } = useArtwork(editId ?? '')

  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [artworkType,  setArtworkType]  = useState<ArtworkType>('Painting')
  const [materials,    setMaterials]    = useState('')
  const [dimWidth,     setDimWidth]     = useState('')
  const [dimHeight,    setDimHeight]    = useState('')
  const [dimDepth,     setDimDepth]     = useState('')
  const [dimUnit,      setDimUnit]      = useState('cm')
  const [year,         setYear]         = useState('')
  const [price,        setPrice]        = useState('')
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragOver,     setDragOver]     = useState(false)
  const [errors,       setErrors]       = useState<Record<string, string>>({})

  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [showSuggestions,  setShowSuggestions]  = useState(false)
  const [aiStatus,         setAiStatus]         = useState('')
  const [aiAnalyzed,       setAiAnalyzed]       = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const buildDimensionsString = () => {
    if (!dimWidth && !dimHeight) return undefined
    const parts = [dimWidth, dimHeight].filter(Boolean)
    if (dimDepth) parts.push(dimDepth)
    return parts.join(' × ') + ' ' + dimUnit
  }

  const parseDimensionsString = (dim: string) => {
    if (!dim) return
    const unitMatch = dim.match(/(cm|inches|mm|m|ft)$/i)
    if (unitMatch) setDimUnit(unitMatch[1].toLowerCase())
    const numbers = dim.replace(/(cm|inches|mm|m|ft)/gi, '').split(/[x×]/).map(s => s.trim())
    if (numbers[0]) setDimWidth(numbers[0])
    if (numbers[1]) setDimHeight(numbers[1])
    if (numbers[2]) setDimDepth(numbers[2])
  }

  useEffect(() => {
    if (!existingArtwork) return
    setTitle(existingArtwork.title)
    setDescription(existingArtwork.description ?? '')
    setArtworkType(existingArtwork.artworkType as ArtworkType)
    setMaterials(existingArtwork.materials ?? '')
    parseDimensionsString(existingArtwork.dimensions ?? '')
    setYear(existingArtwork.year?.toString() ?? '')
    setPrice(existingArtwork.price?.toString() ?? '')
    setImagePreview(existingArtwork.imageUrl)
  }, [existingArtwork])

  const { mutate: createArtwork, isPending: isCreating } = useCreateArtwork()
  const { mutate: updateArtwork, isPending: isUpdating } = useUpdateArtwork()
  const isSaving = isCreating || isUpdating

  const { mutate: suggestDescription, isPending: isSuggesting } = useMutation({
    mutationFn: () => aiApi.suggestDescription({
      title: title || '',
      artworkType: artworkType || 'Painting',
      materials: materials || undefined,
    }),
    onSuccess: (text) => { setDescription(text); toast.success('Description generated!') },
    onError:   (e)    => toast.error(getApiErrorMessage(e, 'AI description failed.')),
  })

  const { mutate: analyzeImage, isPending: isAnalyzing } = useMutation({
    mutationFn: async () => {
      let imageUrl: string | undefined
      if (imageFile) {
        setAiStatus('Compressing image…')
        imageUrl = await toBase64DataUrl(imageFile, 512)
      } else if (existingArtwork?.imageUrl) {
        imageUrl = existingArtwork.imageUrl
      }
      if (!imageUrl) throw new Error('No image available')
      setAiStatus('AI is analyzing your artwork…')
      return await aiApi.analyzeImage({ imageUrl, artworkType })
    },
    onSuccess: (result) => {
      setAiStatus('')
      if (result.suggestedTitle)       setTitle(result.suggestedTitle)
      if (result.suggestedDescription) setDescription(result.suggestedDescription)
      if (result.suggestedMaterials)   setMaterials(result.suggestedMaterials)
      const validTypes = ARTWORK_TYPES as readonly string[]
      if (result.suggestedArtworkType && validTypes.includes(result.suggestedArtworkType))
        setArtworkType(result.suggestedArtworkType as ArtworkType)
      if (result.suggestedPrice)       setPrice(result.suggestedPrice.toString())

      if (result.titleAlternatives?.length > 0) {
        const allTitles = [result.suggestedTitle, ...result.titleAlternatives].filter(Boolean)
        setTitleSuggestions(allTitles)
        setShowSuggestions(true)
      }

      setAiAnalyzed(true)
      toast.success('AI filled in your artwork details!')
    },
    onError: (e) => {
      setAiStatus('')
      toast.error(getApiErrorMessage(e, 'AI analysis failed.'))
    },
  })

  const { mutate: suggestTitles, isPending: isSuggestingTitles } = useMutation({
    mutationFn: async () => {
      let imageUrl: string | undefined
      if (imageFile) {
        setAiStatus('Compressing image…')
        imageUrl = await toBase64DataUrl(imageFile, 512)
      } else if (existingArtwork?.imageUrl) {
        imageUrl = existingArtwork.imageUrl
      }
      setAiStatus('AI is analyzing your artwork…')
      const suggestions = await aiApi.suggestTitles({
        artworkType,
        materials:   materials   || undefined,
        description: description || undefined,
        imageUrl,
      })
      setAiStatus('')
      return suggestions
    },
    onSuccess: (suggestions) => {
      if (suggestions.length > 0) {
        setTitleSuggestions(suggestions)
        setShowSuggestions(true)
        toast.success('AI titles generated!')
      } else {
        toast.error('AI returned no suggestions — try again.')
      }
    },
    onError: (e) => {
      setAiStatus('')
      toast.error(getApiErrorMessage(e, 'AI analysis failed.'))
    },
  })

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!isEditMode && !imageFile) e.image = 'Please select an image'
    if (year && (isNaN(+year) || +year < 1000 || +year > new Date().getFullYear()))
      e.year = `Year must be between 1000 and ${new Date().getFullYear()}`
    if (price && (isNaN(+price) || +price < 0))
      e.price = 'Price must be a positive number'
    if ((dimWidth && isNaN(+dimWidth)) || (dimHeight && isNaN(+dimHeight)) || (dimDepth && isNaN(+dimDepth)))
      e.dimensions = 'Width, height and depth must be numbers'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE)        { setErrors(p => ({ ...p, image: 'File must be under 10 MB.' }));       return }
    if (!file.type.startsWith('image/')) { setErrors(p => ({ ...p, image: 'Please upload an image file.' })); return }
    setErrors(p => { const e = { ...p }; delete e.image; return e })
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setTitleSuggestions([])
    setShowSuggestions(false)
    setAiAnalyzed(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }, [handleFile])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      title:       title.trim(),
      description: description.trim() || undefined,
      artworkType,
      materials:   materials.trim()  || undefined,
      dimensions:  buildDimensionsString(),
      year:        year  ? +year  : undefined,
      price:       price ? +price : undefined,
    }
    if (isEditMode && editId) {
      updateArtwork({ id: editId, data: payload }, { onSuccess: () => navigate(ROUTES.DASHBOARD_ARTWORKS) })
    } else if (imageFile) {
      createArtwork({ data: payload, imageFile },  { onSuccess: () => navigate(ROUTES.DASHBOARD_ARTWORKS) })
    }
  }

  const isAiLoading = isAnalyzing || isSuggestingTitles

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(ROUTES.DASHBOARD_ARTWORKS)}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to My Artworks
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">
          {isEditMode ? 'Edit Artwork' : 'Upload New Artwork'}
        </h1>
        <p className="text-stone-500 mt-2">
          {isEditMode
            ? 'Update your artwork details and let AI help you refine it.'
            : 'Upload your artwork and let AI analyze it — title, description, price and more.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Image Upload */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <label className="text-sm font-semibold text-stone-700 block mb-4">
            Artwork Image {!isEditMode && <span className="text-red-500 ml-1">*</span>}
          </label>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden bg-stone-100">
              <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-contain" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null)
                  setImagePreview(null)
                  setTitleSuggestions([])
                  setShowSuggestions(false)
                  setAiAnalyzed(false)
                }}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors backdrop-blur-sm"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              {/* AI Analyze button — prominent, inside image area */}
              {!aiAnalyzed && (
                <div className="absolute bottom-3 left-3 right-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => analyzeImage()}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                               bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg
                               hover:from-purple-700 hover:to-indigo-700 transition-all
                               backdrop-blur-sm disabled:opacity-70"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{aiStatus || 'Analyzing…'}</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        Analyze with AI — fill all fields
                      </>
                    )}
                  </button>
                </div>
              )}

              {aiAnalyzed && (
                <div className="absolute bottom-3 left-3 bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  AI analyzed — fields filled
                </div>
              )}
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-4 p-12 rounded-xl
                border-2 border-dashed cursor-pointer transition-all duration-200
                ${dragOver
                  ? 'border-gallery-500 bg-gallery-50 scale-[1.01]'
                  : 'border-stone-300 hover:border-gallery-400 hover:bg-stone-50'}`}
            >
              {dragOver
                ? <CloudArrowUpIcon className="h-12 w-12 text-gallery-500 animate-bounce" />
                : <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                    <PhotoIcon className="h-8 w-8 text-stone-400" />
                  </div>}
              <div className="text-center">
                <p className="text-stone-600 font-medium">
                  {dragOver ? 'Drop your image here' : 'Drag & drop your artwork'}
                </p>
                <p className="text-sm text-stone-400 mt-1">
                  or click to browse · JPG, PNG, WebP · up to 10 MB
                </p>
                <p className="text-xs text-purple-500 mt-2 flex items-center justify-center gap-1">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  AI will analyze your image and fill in all fields automatically
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            className="hidden"
          />
          {errors.image && (
            <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
              <ExclamationCircleIcon className="w-4 h-4" /> {errors.image}
            </p>
          )}
        </div>

        {/* Title + AI Titles */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-stone-700">
              Artwork Title <span className="text-red-500">*</span>
            </label>
            {imagePreview && (
              <button
                type="button"
                onClick={() => suggestTitles()}
                disabled={isAiLoading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                           text-purple-600 border border-purple-200 hover:bg-purple-50
                           transition-all disabled:opacity-60"
              >
                {isSuggestingTitles ? (
                  <>
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="max-w-[160px] truncate">{aiStatus || 'Generating…'}</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" /> More titles
                  </>
                )}
              </button>
            )}
          </div>

          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Sunset Over the Mediterranean"
            required
            error={errors.title}
          />

          {showSuggestions && titleSuggestions.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">AI Title Suggestions</h4>
                  <span className="text-xs text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                    AI analyzed your image
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="text-purple-400 hover:text-purple-600 text-xs"
                >
                  Dismiss
                </button>
              </div>
              <div className="grid gap-2">
                {titleSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setTitle(s); setShowSuggestions(false); toast.success(`Title set: "${s}"`) }}
                    className="group flex items-center justify-between p-3 bg-white rounded-lg
                               hover:bg-purple-50 border border-purple-100 hover:border-purple-300
                               transition-all hover:shadow-sm text-left"
                  >
                    <span className="text-stone-700 group-hover:text-purple-700 font-medium">{s}</span>
                    <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                      Select →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Artwork Type */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <label className="text-sm font-semibold text-stone-700 block mb-2">Artwork Type</label>
          <select
            value={artworkType}
            onChange={e => setArtworkType(e.target.value as ArtworkType)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900
                       focus:outline-none focus:ring-2 focus:ring-gallery-500 hover:border-gallery-300 transition-colors"
          >
            {ARTWORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-stone-700">Description</label>
            {title && (
              <button
                type="button"
                onClick={() => suggestDescription()}
                disabled={isSuggesting}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                           text-gallery-600 border border-gallery-200 hover:bg-gallery-50 transition-all disabled:opacity-60"
              >
                {isSuggesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gallery-500 border-t-transparent rounded-full animate-spin" />
                    <span>Generating…</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" /> AI Describe
                  </>
                )}
              </button>
            )}
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your artwork's inspiration, technique, and story…"
            rows={5}
            maxLength={2000}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900
                       placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2
                       focus:ring-gallery-500 focus:border-transparent transition-colors"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-stone-400">{description.length}/2000 characters</p>
            {description && (
              <span className="text-xs text-gallery-600 flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3" /> AI ready
              </span>
            )}
          </div>
        </div>

        {/* Materials & Dimensions */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            <label className="text-sm font-semibold text-stone-700 block mb-2">Materials & Medium</label>
            <Input
              value={materials}
              onChange={e => setMaterials(e.target.value)}
              placeholder="Oil on canvas, Acrylic, Digital…"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            <label className="text-sm font-semibold text-stone-700 block mb-1">Dimensions</label>
            <p className="text-xs text-stone-400 mb-3">Width × Height × Depth (Depth optional)</p>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { value: dimWidth,  setter: setDimWidth,  label: 'Width'  },
                { value: dimHeight, setter: setDimHeight, label: 'Height' },
                { value: dimDepth,  setter: setDimDepth,  label: 'Depth'  },
              ].map(({ value, setter, label }) => (
                <div key={label}>
                  <input
                    type="number"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder="—"
                    min="0"
                    step="0.1"
                    aria-label={label}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5
                               text-stone-900 text-center placeholder:text-stone-300
                               focus:outline-none focus:ring-2 focus:ring-gallery-500
                               focus:border-transparent transition-colors text-sm"
                  />
                  <p className="text-xs text-center text-stone-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <select
              value={dimUnit}
              onChange={e => setDimUnit(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5
                         text-stone-700 text-sm focus:outline-none focus:ring-2
                         focus:ring-gallery-500 transition-colors"
            >
              {DIMENSION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>

            {(dimWidth || dimHeight) && (
              <p className="text-xs text-stone-500 mt-2 bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">
                📐 {buildDimensionsString()}
              </p>
            )}

            {errors.dimensions && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <ExclamationCircleIcon className="w-4 h-4" /> {errors.dimensions}
              </p>
            )}
          </div>
        </div>

        {/* Year & Price */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            <label className="text-sm font-semibold text-stone-700 block mb-2">Year Created</label>
            <Input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder={String(new Date().getFullYear())}
              min="1000"
              max={new Date().getFullYear()}
              error={errors.year}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            <label className="text-sm font-semibold text-stone-700 block mb-2">Price (USD)</label>
            <Input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Leave empty if not for sale"
              min="0"
              step="0.01"
              error={errors.price}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" isLoading={isSaving} className="flex-1 py-3 text-base font-semibold">
            {isEditMode ? 'Save Changes' : 'Publish Artwork'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(ROUTES.DASHBOARD_ARTWORKS)}
            className="px-6"
          >
            Cancel
          </Button>
        </div>

      </form>
    </div>
  )
}