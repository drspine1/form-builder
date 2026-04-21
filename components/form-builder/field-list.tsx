'use client'

import React from 'react'
import { useFormBuilder } from '@/lib/store/form-builder'
import { FormField } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GripVertical, Copy, Trash2 } from 'lucide-react'

interface FieldItemProps {
  field: FormField
  index: number
  totalFields: number
  isSelected: boolean
  onSelect: (fieldId: string) => void
  onDuplicate: (fieldId: string) => void
  onDelete: (fieldId: string) => void
  onDragStart: (e: React.DragEvent, fieldId: string) => void
  onMoveUp: (fieldId: string) => void
  onMoveDown: (fieldId: string) => void
}

export const FieldItem = React.memo(function FieldItem({
  field,
  index,
  totalFields,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  onDragStart,
  onMoveUp,
  onMoveDown,
}: FieldItemProps) {
  const fieldLabel = field.label || 'Untitled Field'

  const handleDragHandleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      onMoveUp(field.id)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onMoveDown(field.id)
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, field.id)}
      className={cn(
        'group flex items-center gap-3 rounded-lg border-2 border-transparent p-3 transition-all cursor-move',
        'bg-white hover:border-primary/50 hover:shadow-sm',
        isSelected && 'border-primary bg-primary/5 shadow-md'
      )}
      onClick={() => onSelect(field.id)}
    >
      {/* Drag handle — keyboard accessible */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drag to reorder"
        onKeyDown={handleDragHandleKeyDown}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{fieldLabel}</div>
        <div className="text-xs text-muted-foreground">
          {field.type}
          {field.required && ' • Required'}
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate(field.id)
          }}
          aria-label={`Duplicate ${fieldLabel} field`}
          className="h-7 w-7 p-0"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(field.id)
          }}
          aria-label={`Delete ${fieldLabel} field`}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
})

interface FieldListProps {
  onFieldSelect: (fieldId: string) => void
  selectedFieldId: string | null
}

export const FieldList = React.memo(function FieldList({
  onFieldSelect,
  selectedFieldId,
}: FieldListProps) {
  const { form, deleteField, duplicateField, reorderFields, selectField } =
    useFormBuilder()
  const [draggedId, setDraggedId] = React.useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedId(fieldId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedId) return

    const dragIndex = form.fields.findIndex((f) => f.id === draggedId)
    if (dragIndex === dropIndex) return

    const newOrder = form.fields.map((f) => f.id)
    const [movedId] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, movedId)

    reorderFields(newOrder)
    setDraggedId(null)
    setDragOverIndex(null)
  }

  const handleMoveUp = (fieldId: string) => {
    const index = form.fields.findIndex((f) => f.id === fieldId)
    if (index <= 0) return
    const newOrder = form.fields.map((f) => f.id)
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    reorderFields(newOrder)
  }

  const handleMoveDown = (fieldId: string) => {
    const index = form.fields.findIndex((f) => f.id === fieldId)
    if (index < 0 || index >= form.fields.length - 1) return
    const newOrder = form.fields.map((f) => f.id)
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    reorderFields(newOrder)
  }

  return (
    <div className="space-y-2" role="list" aria-label="Form fields">
      {form.fields.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
          No fields yet. Add one from the toolbox.
        </div>
      ) : (
        form.fields.map((field, index) => (
          <div
            key={field.id}
            role="listitem"
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              'transition-colors',
              dragOverIndex === index && 'bg-primary/10 rounded-lg'
            )}
          >
            <FieldItem
              field={field}
              index={index}
              totalFields={form.fields.length}
              isSelected={selectedFieldId === field.id}
              onSelect={(id) => {
                selectField(id)
                onFieldSelect(id)
              }}
              onDuplicate={() => duplicateField(field.id)}
              onDelete={() => deleteField(field.id)}
              onDragStart={handleDragStart}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </div>
        ))
      )}
    </div>
  )
})
