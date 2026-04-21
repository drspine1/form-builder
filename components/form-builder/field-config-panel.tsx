'use client'

import React from 'react'
import { FormField, FieldOption } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus } from 'lucide-react'
import { generateId } from '@/lib/utils'

interface FieldConfigPanelProps {
  field: FormField | null
  onUpdate: (updates: Partial<FormField>) => void
}

export const FieldConfigPanel = React.memo(function FieldConfigPanel({
  field,
  onUpdate,
}: FieldConfigPanelProps) {
  if (!field) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
        Select a field to configure
      </div>
    )
  }

  const handleOptionChange = (index: number, key: 'label' | 'value', value: string) => {
    const options = [...(field.options || [])]
    options[index] = { ...options[index], [key]: value }
    onUpdate({ options })
  }

  const handleAddOption = () => {
    const options = [...(field.options || [])]
    options.push({ id: generateId(), label: '', value: '' })
    onUpdate({ options })
  }

  const handleRemoveOption = (index: number) => {
    const options = field.options?.filter((_, i) => i !== index) || []
    onUpdate({ options })
  }

  const hasOptions =
    field.type === 'select' || field.type === 'multiselect' || field.type === 'radio'

  return (
    <div className="space-y-6 h-full overflow-y-auto p-4">
      {/* Basic Settings */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Basic Settings</h4>

        <div className="space-y-2">
          <Label htmlFor="config-label">Label</Label>
          <Input
            id="config-label"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Field label"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="config-placeholder">Placeholder</Label>
          <Input
            id="config-placeholder"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Placeholder text"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="config-description">Description</Label>
          <Textarea
            id="config-description"
            value={field.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Field description"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="config-required"
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked as boolean })}
          />
          <Label htmlFor="config-required" className="font-normal cursor-pointer">
            Required field
          </Label>
        </div>

        {field.type === 'textarea' && (
          <div className="space-y-2">
            <Label htmlFor="config-rows">Rows</Label>
            <Input
              id="config-rows"
              type="number"
              value={field.rows || 4}
              onChange={(e) => onUpdate({ rows: parseInt(e.target.value) })}
              min={1}
              max={20}
            />
          </div>
        )}
      </div>

      {/* Options */}
      {hasOptions && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Options</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddOption}
              aria-label="Add option"
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {(field.options || []).map((option, index) => (
              <div key={option.id} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`config-option-label-${index}`} className="text-xs">
                    Label
                  </Label>
                  <Input
                    id={`config-option-label-${index}`}
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                    placeholder="Label"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`config-option-value-${index}`} className="text-xs">
                    Value
                  </Label>
                  <Input
                    id={`config-option-value-${index}`}
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                    placeholder="Value"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveOption(index)}
                  aria-label={`Remove option ${option.label || index + 1}`}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
