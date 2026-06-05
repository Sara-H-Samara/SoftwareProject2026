// src/components/gallery-studio-pro/SliderControl.tsx
import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  icon?: React.ReactNode;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export default function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  icon,
  onChange,
  formatValue = (v) => v.toFixed(1),
}: SliderControlProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
          {icon && <span className="text-stone-500">{icon}</span>}
          <span>{label}</span>
        </div>
        <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
          {formatValue(value)}{unit}
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          style={{
            background: `linear-gradient(to right, #8b5cf6 ${percentage}%, #e5e7eb ${percentage}%)`,
          }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-stone-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}