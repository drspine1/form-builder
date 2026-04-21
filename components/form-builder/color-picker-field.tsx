'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface ColorPickerFieldProps {
  id: string
  label: string
  value: string
  onChange: (hex: string) => void
}

export const ColorPickerField = React.memo(function ColorPickerField({
  id,
  label,
  value,
  onChange,
}: ColorPickerFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          id={`${id}-swatch`}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 rounded border cursor-pointer"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
    </div>
  )
})
