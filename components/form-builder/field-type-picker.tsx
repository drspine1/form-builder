'use client'

import React from 'react'
import { FormField, FieldType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Type,
  Mail,
  Hash,
  Lock,
  FileText,
  ToggleLeft,
  CheckCircle,
  Radio,
  Calendar,
  Clock,
  FileUp,
  Link,
  Phone,
  Star,
  Heading3,
} from 'lucide-react'

const FIELD_TYPES: Array<{ type: FieldType; label: string; icon: React.ReactNode }> = [
  { type: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
  { type: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { type: 'number', label: 'Number', icon: <Hash className="h-4 w-4" /> },
  { type: 'password', label: 'Password', icon: <Lock className="h-4 w-4" /> },
  { type: 'textarea', label: 'Text Area', icon: <FileText className="h-4 w-4" /> },
  { type: 'select', label: 'Select', icon: <ToggleLeft className="h-4 w-4" /> },
  { type: 'multiselect', label: 'Multi-Select', icon: <CheckCircle className="h-4 w-4" /> },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckCircle className="h-4 w-4" /> },
  { type: 'radio', label: 'Radio', icon: <Radio className="h-4 w-4" /> },
  { type: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" /> },
  { type: 'time', label: 'Time', icon: <Clock className="h-4 w-4" /> },
  { type: 'file', label: 'File Upload', icon: <FileUp className="h-4 w-4" /> },
  { type: 'url', label: 'URL', icon: <Link className="h-4 w-4" /> },
  { type: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4" /> },
  { type: 'rating', label: 'Rating', icon: <Star className="h-4 w-4" /> },
  { type: 'section-header', label: 'Section', icon: <Heading3 className="h-4 w-4" /> },
]

interface FieldTypePickerProps {
  onSelect: (type: FieldType) => void
}

export const FieldTypePicker = React.memo(function FieldTypePicker({
  onSelect,
}: FieldTypePickerProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Add Field</h3>
      <div className="grid grid-cols-2 gap-2">
        {FIELD_TYPES.map(({ type, label, icon }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => onSelect(type)}
            aria-label={`Add ${label} field`}
            className="h-auto flex flex-col gap-1 py-3"
          >
            <span aria-hidden="true">{icon}</span>
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
})

export { FIELD_TYPES }
