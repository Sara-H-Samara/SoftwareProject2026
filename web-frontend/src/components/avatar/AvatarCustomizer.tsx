// src/components/avatar/AvatarCustomizer.tsx
import type { ReactNode } from 'react'
import type { Avatar, HairStyle, ShirtStyle, PantsStyle, AccessoryStyle } from '@/types/avatar'

// ─── Palettes ─────────────────────────────────────────────────────────────────
const SKIN_PALETTE     = ['#F5D8C3','#E8B89E','#D2956B','#A8703F','#7A4A2A','#3F2517']
const HAIR_PALETTE     = ['#0B0B0B','#3B2A1F','#6E4B2A','#A87C4F','#D9B27C','#E8E2D6','#A11B1B','#1F3FA8']
const SHIRT_PALETTE    = ['#3F6FB5','#7A1F1F','#1F7A3A','#6B3FA8','#E0E0E0','#1A1A1A','#F2C14E','#E36B9A']
const PANTS_PALETTE    = ['#2F2F35','#4A6FA5','#1A1A1A','#6B5C3F','#7A3F3F','#A07050']
const SHOES_PALETTE    = ['#101015','#FFFFFF','#7A1F1F','#5A3A1F','#3F6FB5','#E0E0E0']
const ACCESSORY_PALETTE= ['#222222','#7A1F1F','#3F6FB5','#F2C14E','#FFFFFF','#C0C0C0','#FFD700']

// ─── Options ──────────────────────────────────────────────────────────────────
const HAIR_STYLES:      HairStyle[]      = ['bald','short','long','curly','ponytail']
const SHIRT_STYLES:     ShirtStyle[]     = ['tshirt','hoodie','jacket','tank']
const PANTS_STYLES:     PantsStyle[]     = ['pants','shorts','skirt']
const ACCESSORY_STYLES: AccessoryStyle[] = ['none','glasses','sunglasses','hat','beanie','headphones','earrings','mask']

const ACCESSORY_LABELS: Record<AccessoryStyle, string> = {
  none:'None', glasses:'Glasses', sunglasses:'Sunglasses', hat:'Hat',
  beanie:'Beanie', headphones:'Headphones', earrings:'Earrings', mask:'Mask',
}
const SHIRT_LABELS: Record<ShirtStyle, string> = {
  tshirt:'T-shirt', hoodie:'Hoodie', jacket:'Jacket', tank:'Tank',
}
const PANTS_LABELS: Record<PantsStyle, string> = {
  pants:'Pants', shorts:'Shorts', skirt:'Skirt',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clampHeight(v: number): number {
  return Math.max(0.85, Math.min(1.15, Math.round(v * 100) / 100))
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  )
}

function ColorRow({ value, options, onSelect }: {
  value: string; options: string[]; onSelect: (c: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(color => {
        const selected = color.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={color}
            aria-label={color}
            aria-pressed={selected}
            onClick={() => onSelect(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gallery-500 ${
              selected
                ? 'border-gallery-600 scale-110 shadow-md'
                : 'border-stone-200 hover:scale-105 dark:border-stone-600'
            }`}
            style={{ backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}

function ChipRow<T extends string>({ value, options, labels, onSelect }: {
  value: T; options: readonly T[]
  labels?: Record<T, string>; onSelect: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const selected = opt === value
        return (
          <button
            key={opt}
            aria-pressed={selected}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gallery-500 ${
              selected
                ? 'bg-gallery-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700'
            }`}
          >
            {labels?.[opt] ?? capitalize(opt)}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface AvatarCustomizerProps {
  avatar: Avatar
  onChange: (partial: Partial<Avatar>) => void
}

export function AvatarCustomizer({ avatar, onChange }: AvatarCustomizerProps) {
  return (
    <div className="flex-1 overflow-y-auto pr-2">

      <Section title="Skin tone">
        <ColorRow value={avatar.skinColor} options={SKIN_PALETTE}
          onSelect={skinColor => onChange({ skinColor })} />
      </Section>

      <Section title="Hair style">
        <ChipRow value={avatar.hairStyle} options={HAIR_STYLES}
          onSelect={hairStyle => onChange({ hairStyle })} />
      </Section>

      {avatar.hairStyle !== 'bald' && (
        <Section title="Hair color">
          <ColorRow value={avatar.hairColor} options={HAIR_PALETTE}
            onSelect={hairColor => onChange({ hairColor })} />
        </Section>
      )}

      <Section title="Top">
        <ChipRow value={avatar.shirtStyle} options={SHIRT_STYLES} labels={SHIRT_LABELS}
          onSelect={shirtStyle => onChange({ shirtStyle })} />
        <div className="h-2" />
        <ColorRow value={avatar.shirtColor} options={SHIRT_PALETTE}
          onSelect={shirtColor => onChange({ shirtColor })} />
      </Section>

      <Section title="Bottom">
        <ChipRow value={avatar.pantsStyle} options={PANTS_STYLES} labels={PANTS_LABELS}
          onSelect={pantsStyle => onChange({ pantsStyle })} />
        <div className="h-2" />
        <ColorRow value={avatar.pantsColor} options={PANTS_PALETTE}
          onSelect={pantsColor => onChange({ pantsColor })} />
      </Section>

      <Section title="Shoes">
        <ColorRow value={avatar.shoesColor} options={SHOES_PALETTE}
          onSelect={shoesColor => onChange({ shoesColor })} />
      </Section>

      <Section title="Accessory">
        <ChipRow value={avatar.accessory} options={ACCESSORY_STYLES} labels={ACCESSORY_LABELS}
          onSelect={accessory => onChange({ accessory })} />
        {avatar.accessory !== 'none' && (
          <>
            <div className="h-2" />
            <ColorRow value={avatar.accessoryColor} options={ACCESSORY_PALETTE}
              onSelect={accessoryColor => onChange({ accessoryColor })} />
          </>
        )}
      </Section>

      <Section title="Height">
        <div className="flex items-center gap-4">
          <button
            aria-label="Decrease height"
            onClick={() => onChange({ height: clampHeight(avatar.height - 0.05) })}
            disabled={avatar.height <= 0.85}
            className="w-10 h-10 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 flex items-center justify-center hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-stone-700 dark:text-stone-300 text-xl leading-none">−</span>
          </button>

          <div className="flex flex-col items-center w-16">
            <span className="text-stone-700 dark:text-stone-300 font-medium tabular-nums">
              {(avatar.height * 100).toFixed(0)}%
            </span>
            <div className="w-full mt-1 h-1 rounded-full bg-stone-200 dark:bg-stone-700">
              <div
                className="h-1 rounded-full bg-gallery-500 transition-all"
                style={{ width: `${((avatar.height - 0.85) / 0.30) * 100}%` }}
              />
            </div>
          </div>

          <button
            aria-label="Increase height"
            onClick={() => onChange({ height: clampHeight(avatar.height + 0.05) })}
            disabled={avatar.height >= 1.15}
            className="w-10 h-10 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 flex items-center justify-center hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-stone-700 dark:text-stone-300 text-xl leading-none">+</span>
          </button>
        </div>
      </Section>

    </div>
  )
}