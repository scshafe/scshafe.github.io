'use client';

import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ColorPicker({ label, value, onChange, disabled }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Only update parent if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    // Reset to actual value if invalid
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex items-center justify-between gap-3" ref={pickerRef}>
      <label className="text-[length:var(--text-sm)] text-[var(--foreground-secondary)] min-w-[120px]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: value }}
            aria-label={`Pick color for ${label}`}
          />
          {isOpen && !disabled && (
            <div className="absolute z-10 top-full left-0 mt-1">
              <input
                type="color"
                value={value}
                onChange={handleColorPickerChange}
                className="w-12 h-10 cursor-pointer border-0 p-0"
              />
            </div>
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          className="w-24 px-2 py-1 text-[length:var(--text-sm)] bg-[var(--background)] border border-[var(--border)] rounded font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
