// src/components/gallery-studio-pro/ColorPicker.tsx 
import { useState, useCallback, memo } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

const DEFAULT_PRESETS = [
  '#ece6dc', '#f5f0e8', '#e8e0d0', '#d4c8b8',
  '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#1f2937', '#4b5563', '#9ca3af',
  '#ffffff', '#000000',
];

function ColorPickerComponent({ label, value, onChange, presetColors = DEFAULT_PRESETS }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = useCallback((newColor: string) => {
    onChange(newColor);
    setIsOpen(false);
  }, [onChange]);

  const isValidHex = /^#[0-9A-F]{6}$/i.test(value);
  const displayValue = isValidHex ? value.toUpperCase() : '#000000';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-stone-700 block">
        {label}
      </label>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-xl border-2 border-stone-200 shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: displayValue }}
          aria-label="Open color picker"
        />
        
        <div className="flex-1">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              let newColor = e.target.value;
              if (!newColor.startsWith('#')) newColor = '#' + newColor;
              if (/^#[0-9A-F]{6}$/i.test(newColor)) {
                onChange(newColor);
              }
            }}
            className="w-full px-3 py-2 text-sm font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="#000000"
          />
        </div>
        
        <input
          type="color"
          value={displayValue}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer hover:opacity-80"
          aria-label="Native color picker"
        />
      </div>
      
      {isOpen && (
        <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200 animate-fadeIn">
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                  displayValue === color.toUpperCase() 
                    ? 'border-purple-500 scale-110 ring-2 ring-purple-200 ring-offset-1' 
                    : 'border-white hover:border-stone-300'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
`;
if (!document.querySelector('#color-picker-styles')) {
  style.id = 'color-picker-styles';
  document.head.appendChild(style);
}

export default memo(ColorPickerComponent);