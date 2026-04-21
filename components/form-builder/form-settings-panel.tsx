'use client'

import React from 'react'
import { FormSettings } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColorPickerField } from './color-picker-field'

interface FormSettingsPanelProps {
  settings: FormSettings
  onUpdate: (settings: Partial<FormSettings>) => void
}

export const FormSettingsPanel = React.memo(function FormSettingsPanel({
  settings,
  onUpdate,
}: FormSettingsPanelProps) {
  return (
    <div className="space-y-6 h-full overflow-y-auto p-4">
      <h3 className="font-semibold">Form Settings</h3>

      {/* Messages */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Messages</h4>

        <div className="space-y-2">
          <Label htmlFor="settings-successMessage">Success Message</Label>
          <Textarea
            id="settings-successMessage"
            value={settings.successMessage}
            onChange={(e) => onUpdate({ successMessage: e.target.value })}
            placeholder="Thank you for your submission!"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-errorMessage">Error Message</Label>
          <Textarea
            id="settings-errorMessage"
            value={settings.errorMessage}
            onChange={(e) => onUpdate({ errorMessage: e.target.value })}
            placeholder="Please fix the errors above."
            rows={2}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Submit Button</h4>

        <div className="space-y-2">
          <Label htmlFor="settings-submitButtonText">Button Text</Label>
          <Input
            id="settings-submitButtonText"
            value={settings.submitButtonText}
            onChange={(e) => onUpdate({ submitButtonText: e.target.value })}
            placeholder="Submit"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-submitButtonVariant">Button Style</Label>
          <Select
            value={settings.submitButtonVariant}
            onValueChange={(value: any) => onUpdate({ submitButtonVariant: value })}
          >
            <SelectTrigger id="settings-submitButtonVariant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="destructive">Destructive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Features</h4>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="settings-multiStepEnabled"
            checked={settings.multiStepEnabled}
            onCheckedChange={(checked) =>
              onUpdate({ multiStepEnabled: checked as boolean })
            }
          />
          <Label htmlFor="settings-multiStepEnabled" className="font-normal cursor-pointer">
            Multi-step form
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="settings-progressBarEnabled"
            checked={settings.progressBarEnabled}
            onCheckedChange={(checked) =>
              onUpdate({ progressBarEnabled: checked as boolean })
            }
          />
          <Label htmlFor="settings-progressBarEnabled" className="font-normal cursor-pointer">
            Show progress bar
          </Label>
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Theme Colors</h4>

        <ColorPickerField
          id="settings-primaryColor"
          label="Primary Color"
          value={settings.theme.primaryColor}
          onChange={(hex) =>
            onUpdate({ theme: { ...settings.theme, primaryColor: hex } })
          }
        />

        <ColorPickerField
          id="settings-secondaryColor"
          label="Secondary Color"
          value={settings.theme.secondaryColor}
          onChange={(hex) =>
            onUpdate({ theme: { ...settings.theme, secondaryColor: hex } })
          }
        />

        <ColorPickerField
          id="settings-accentColor"
          label="Accent Color"
          value={settings.theme.accentColor}
          onChange={(hex) =>
            onUpdate({ theme: { ...settings.theme, accentColor: hex } })
          }
        />
      </div>
    </div>
  )
})
