'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { FormSchema, FormField as FormFieldType, FieldType } from '@/lib/types'
import { validateField } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormRendererProps {
  schema: FormSchema
  onSubmit: (data: Record<string, any>) => Promise<void>
  isSubmitting?: boolean
}

interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
}

interface FormFieldProps {
  field: FormFieldType
  value: any
  error: string
  onChange: (value: any) => void
  onBlur: () => void
}

// ---------------------------------------------------------------------------
// FIELD_RENDERER_MAP — one entry per FieldType, replaces chained conditionals
// ---------------------------------------------------------------------------

type FieldRendererFn = (
  field: FormFieldType,
  value: any,
  onChange: (v: any) => void,
  onBlur: () => void,
  hasError: boolean,
  describedBy: string | undefined
) => React.ReactNode

const FIELD_RENDERER_MAP: Record<FieldType, FieldRendererFn> = {
  text: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Input
      id={field.id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  email: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Input
      id={field.id}
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  number: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Input
      id={field.id}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  password: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Input
      id={field.id}
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  phone: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Input
      id={field.id}
      type="tel"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  url: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Input
      id={field.id}
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  date: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Input
      id={field.id}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={field.disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  time: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Input
      id={field.id}
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={field.disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  file: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Input
      id={field.id}
      type="file"
      onChange={(e) => onChange(e.target.files?.[0])}
      onBlur={onBlur}
      disabled={field.disabled}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  textarea: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Textarea
      id={field.id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      rows={field.rows || 4}
      aria-invalid={hasError || undefined}
      aria-describedby={describedBy}
      className={hasError ? 'border-destructive' : ''}
    />
  ),

  select: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Select value={value} onValueChange={onChange} disabled={field.disabled}>
      <SelectTrigger
        id={field.id}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={hasError ? 'border-destructive' : ''}
        onBlur={onBlur}
      >
        <SelectValue placeholder={field.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {(field.options || []).map((option) => (
          <SelectItem key={option.id} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),

  // Radio rendered as a Select for now (same as original behaviour)
  radio: (field, value, onChange, onBlur, hasError, describedBy) => (
    <Select value={value} onValueChange={onChange} disabled={field.disabled}>
      <SelectTrigger
        id={field.id}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={hasError ? 'border-destructive' : ''}
        onBlur={onBlur}
      >
        <SelectValue placeholder={field.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {(field.options || []).map((option) => (
          <SelectItem key={option.id} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),

  checkbox: (field, value, onChange, _onBlur, _hasError, describedBy) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={field.id}
        checked={value || false}
        onCheckedChange={onChange}
        disabled={field.disabled}
        aria-describedby={describedBy}
      />
      <Label htmlFor={field.id} className="font-normal cursor-pointer">
        {field.label}
        {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </Label>
    </div>
  ),

  multiselect: (field, value, onChange, _onBlur, _hasError, describedBy) => (
    <fieldset aria-describedby={describedBy}>
      <legend className="text-sm font-medium mb-2">
        {field.label}
        {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </legend>
      <div className="space-y-2">
        {(field.options || []).map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${field.id}-${option.id}`}
              checked={(value || []).includes(option.value)}
              onCheckedChange={(checked) => {
                const newValue = checked
                  ? [...(value || []), option.value]
                  : (value || []).filter((v: string) => v !== option.value)
                onChange(newValue)
              }}
              disabled={field.disabled}
            />
            <Label
              htmlFor={`${field.id}-${option.id}`}
              className="font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  ),

  rating: (field, value, onChange, _onBlur, _hasError, describedBy) => (
    <div
      role="group"
      aria-labelledby={`${field.id}-label`}
      aria-describedby={describedBy}
      className="flex gap-2"
    >
      {[1, 2, 3, 4, 5].map((rating) => (
        <Button
          key={rating}
          type="button"
          variant={value === rating ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(rating)}
          disabled={field.disabled}
          aria-label={`Rate ${rating} out of 5`}
          aria-pressed={value === rating}
          className="w-10 h-10 p-0"
        >
          {rating}
        </Button>
      ))}
    </div>
  ),

  'section-header': (field) => (
    <h2 className="text-2xl font-semibold mt-6" aria-level={2}>
      {field.label}
    </h2>
  ),
}

// ---------------------------------------------------------------------------
// FormField — renders a single field using the lookup map
// ---------------------------------------------------------------------------

const FormFieldComponent = React.memo(function FormFieldComponent({
  field,
  value,
  error,
  onChange,
  onBlur,
}: FormFieldProps) {
  const hasError = !!error
  const errorId = `${field.id}-error`
  const helpId = `${field.id}-help`

  const describedBy = [
    error ? errorId : null,
    field.helpText ? helpId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined

  // Section headers are self-contained — no label/error wrapper needed
  if (field.type === 'section-header') {
    return <>{FIELD_RENDERER_MAP['section-header'](field, value, onChange, onBlur, hasError, describedBy)}</>
  }

  const renderer = FIELD_RENDERER_MAP[field.type]
  if (!renderer) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[FormField] Unknown field type: "${field.type}". Rendering nothing.`)
    }
    return null
  }

  return (
    <div className="space-y-2">
      {/* Label — multiselect uses its own fieldset/legend, checkbox has inline label */}
      {field.type !== 'checkbox' && field.type !== 'multiselect' && (
        <Label htmlFor={field.id} id={`${field.id}-label`}>
          {field.label}
          {field.required && (
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
          )}
        </Label>
      )}

      {renderer(field, value, onChange, onBlur, hasError, describedBy)}

      {/* Error message */}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Help text */}
      {field.helpText && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {field.helpText}
        </p>
      )}
    </div>
  )
})

// ---------------------------------------------------------------------------
// FormRenderer — main component
// ---------------------------------------------------------------------------

export const FormRenderer = React.memo(function FormRenderer({
  schema,
  onSubmit,
  isSubmitting = false,
}: FormRendererProps) {
  const [formState, setFormState] = useState<FormState>({
    values: {},
    errors: {},
    touched: {},
  })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Stable change handler — uses functional updater so no deps needed
  const handleChange = useCallback((fieldId: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      values: { ...prev.values, [fieldId]: value },
    }))
  }, [])

  // Stable blur handler
  const handleBlur = useCallback(
    (fieldId: string) => {
      setFormState((prev) => ({
        ...prev,
        touched: { ...prev.touched, [fieldId]: true },
      }))

      const field = schema.fields.find((f) => f.id === fieldId)
      if (field) {
        setFormState((prev) => {
          const result = validateField(field, prev.values[fieldId])
          return {
            ...prev,
            errors: result.isValid
              ? { ...prev.errors, [fieldId]: '' }
              : { ...prev.errors, ...result.errors },
          }
        })
      }
    },
    [schema.fields]
  )

  // Per-field stable callbacks — only recreated when schema.fields changes
  const fieldCallbacks = useMemo(
    () =>
      Object.fromEntries(
        schema.fields.map((f) => [
          f.id,
          {
            onChange: (v: any) => handleChange(f.id, v),
            onBlur: () => handleBlur(f.id),
          },
        ])
      ),
    [schema.fields, handleChange, handleBlur]
  )

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    for (const field of schema.fields) {
      const result = validateField(field, formState.values[field.id])
      if (!result.isValid) {
        newErrors[field.id] = result.errors[field.id] || 'Invalid'
      }
    }
    setFormState((prev) => ({ ...prev, errors: newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsLoading(true)
      setSubmitError(null)
      await onSubmit(formState.values)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed')
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = isLoading || isSubmitting

  // Apply theme primary color to submit button if set
  const primaryColor = schema.settings?.theme?.primaryColor
  const submitButtonStyle: React.CSSProperties =
    primaryColor && schema.settings.submitButtonVariant === 'default'
      ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#ffffff' }
      : {}

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{schema.name}</h1>
        {schema.description && (
          <p className="text-muted-foreground mt-2">{schema.description}</p>
        )}
      </div>

      {/* Form-level submission error */}
      {submitError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Fields */}
      <div className="space-y-6">
        {schema.fields.map((field) => {
          const cbs = fieldCallbacks[field.id] ?? {
            onChange: (v: any) => handleChange(field.id, v),
            onBlur: () => handleBlur(field.id),
          }
          return (
            <FormFieldComponent
              key={field.id}
              field={field}
              value={formState.values[field.id] ?? ''}
              error={formState.touched[field.id] ? (formState.errors[field.id] ?? '') : ''}
              onChange={cbs.onChange}
              onBlur={cbs.onBlur}
            />
          )
        })}
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isDisabled}
        variant={schema.settings.submitButtonVariant}
        className="w-full"
        style={submitButtonStyle}
        aria-label={isDisabled ? 'Submitting…' : schema.settings.submitButtonText}
      >
        {isDisabled ? 'Submitting…' : schema.settings.submitButtonText}
      </Button>
    </form>
  )
})

export default FormRenderer
