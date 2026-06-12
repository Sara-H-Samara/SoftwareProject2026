import { type ReactNode } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import type {
  Avatar,
  HairStyle,
  ShirtStyle,
  PantsStyle,
  AccessoryStyle,
} from '@/types'

interface Props {
  avatar: Avatar
  onChange: (partial: Partial<Avatar>) => void
}

const SKIN_PALETTE = ['#F5D8C3', '#E8B89E', '#D2956B', '#A8703F', '#7A4A2A', '#3F2517']
const HAIR_PALETTE = ['#0B0B0B', '#3B2A1F', '#6E4B2A', '#A87C4F', '#D9B27C', '#E8E2D6', '#A11B1B', '#1F3FA8']
const SHIRT_PALETTE = ['#3F6FB5', '#7A1F1F', '#1F7A3A', '#6B3FA8', '#E0E0E0', '#1A1A1A', '#F2C14E', '#E36B9A']
const PANTS_PALETTE = ['#2F2F35', '#4A6FA5', '#1A1A1A', '#6B5C3F', '#7A3F3F', '#A07050']
const SHOES_PALETTE = ['#101015', '#FFFFFF', '#7A1F1F', '#5A3A1F', '#3F6FB5', '#E0E0E0']
const ACCESSORY_PALETTE = ['#222222', '#7A1F1F', '#3F6FB5', '#F2C14E', '#FFFFFF', '#C0C0C0', '#FFD700']

const HAIR_STYLES: HairStyle[] = ['bald', 'short', 'long', 'curly', 'ponytail']
const SHIRT_STYLES: ShirtStyle[] = ['tshirt', 'hoodie', 'jacket', 'tank']
const PANTS_STYLES: PantsStyle[] = ['pants', 'shorts', 'skirt']
const ACCESSORY_STYLES: AccessoryStyle[] = [
  'none',
  'glasses',
  'sunglasses',
  'hat',
  'beanie',
  'headphones',
  'earrings',
  'mask',
]

const ACCESSORY_LABELS: Record<AccessoryStyle, string> = {
  none: 'None',
  glasses: 'Glasses',
  sunglasses: 'Sunglasses',
  hat: 'Hat',
  beanie: 'Beanie',
  headphones: 'Headphones',
  earrings: 'Earrings',
  mask: 'Mask',
}

/**
 * Pure controlled customization UI.
 *
 * Every interaction calls `onChange` with a partial diff. The parent owns
 * the full Avatar state so this component stays stateless and preview-ready.
 */
export function AvatarCustomizer({ avatar, onChange }: Props) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Section title="Skin tone">
        <ColorRow
          value={avatar.skinColor}
          options={SKIN_PALETTE}
          onSelect={c => onChange({ skinColor: c })}
        />
      </Section>

      <Section title="Hair style">
        <ChipRow
          value={avatar.hairStyle}
          options={HAIR_STYLES}
          onSelect={v => onChange({ hairStyle: v })}
        />
      </Section>

      {avatar.hairStyle !== 'bald' && (
        <Section title="Hair color">
          <ColorRow
            value={avatar.hairColor}
            options={HAIR_PALETTE}
            onSelect={c => onChange({ hairColor: c })}
          />
        </Section>
      )}

      <Section title="Top">
        <ChipRow
          value={avatar.shirtStyle}
          options={SHIRT_STYLES}
          labels={{ tshirt: 'T-shirt', hoodie: 'Hoodie', jacket: 'Jacket', tank: 'Tank' }}
          onSelect={v => onChange({ shirtStyle: v })}
        />
        <View className="h-2" />
        <ColorRow
          value={avatar.shirtColor}
          options={SHIRT_PALETTE}
          onSelect={c => onChange({ shirtColor: c })}
        />
      </Section>

      <Section title="Bottom">
        <ChipRow
          value={avatar.pantsStyle}
          options={PANTS_STYLES}
          labels={{ pants: 'Pants', shorts: 'Shorts', skirt: 'Skirt' }}
          onSelect={v => onChange({ pantsStyle: v })}
        />
        <View className="h-2" />
        <ColorRow
          value={avatar.pantsColor}
          options={PANTS_PALETTE}
          onSelect={c => onChange({ pantsColor: c })}
        />
      </Section>

      <Section title="Shoes">
        <ColorRow
          value={avatar.shoesColor}
          options={SHOES_PALETTE}
          onSelect={c => onChange({ shoesColor: c })}
        />
      </Section>

      <Section title="Accessory">
        <ChipRow
          value={avatar.accessory}
          options={ACCESSORY_STYLES}
          labels={ACCESSORY_LABELS}
          onSelect={v => onChange({ accessory: v })}
        />
        {avatar.accessory !== 'none' && (
          <>
            <View className="h-2" />
            <ColorRow
              value={avatar.accessoryColor}
              options={ACCESSORY_PALETTE}
              onSelect={c => onChange({ accessoryColor: c })}
            />
          </>
        )}
      </Section>

      <Section title="Height">
        <View className="flex-row items-center gap-3">
          <StepButton
            label="−"
            onPress={() => onChange({ height: clampHeight(avatar.height - 0.05) })}
          />
          <Text className="text-stone-700 font-medium w-16 text-center">
            {(avatar.height * 100).toFixed(0)}%
          </Text>
          <StepButton
            label="+"
            onPress={() => onChange({ height: clampHeight(avatar.height + 0.05) })}
          />
        </View>
      </Section>

      <View className="h-6" />
    </ScrollView>
  )
}

function clampHeight(v: number): number {
  return Math.max(0.85, Math.min(1.15, Math.round(v * 100) / 100))
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-stone-700 font-semibold mb-2">{title}</Text>
      {children}
    </View>
  )
}

function ColorRow({
  value,
  options,
  onSelect,
}: {
  value: string
  options: string[]
  onSelect: (color: string) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {options.map(c => {
          const selected = c.toLowerCase() === value.toLowerCase()
          return (
            <TouchableOpacity
              key={c}
              onPress={() => onSelect(c)}
              className={`w-9 h-9 rounded-full border-2 ${
                selected ? 'border-gallery-600' : 'border-stone-200'
              }`}
              style={{ backgroundColor: c }}
            />
          )
        })}
      </View>
    </ScrollView>
  )
}

function ChipRow<T extends string>({
  value,
  options,
  labels,
  onSelect,
}: {
  value: T
  options: readonly T[]
  labels?: Partial<Record<T, string>>
  onSelect: (v: T) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {options.map(opt => {
          const selected = opt === value
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              className={`px-4 py-2 rounded-full border ${
                selected ? 'bg-gallery-600 border-gallery-600' : 'bg-white border-stone-200'
              }`}
            >
              <Text className={selected ? 'text-white text-sm' : 'text-stone-700 text-sm'}>
                {labels?.[opt] ?? capitalize(opt)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  )
}

function StepButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-10 h-10 rounded-full bg-white border border-stone-200 items-center justify-center"
    >
      <Text className="text-stone-700 text-xl">{label}</Text>
    </TouchableOpacity>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
