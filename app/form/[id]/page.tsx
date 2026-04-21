'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { validateField, splitIntoSteps } from '@/lib/utils'
import type { FormSchema, FormField as FormFieldType } from '@/lib/types'
import { FormRenderer } from '@/components/form-renderer/form-renderer'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
//great
type PageState = 'loading' | 'not-found' | 'unavailable' | 'ready' | 'submitted'

export default function PublicFormPage() {
  const params = useParams()
  const id = params?.id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/forms/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) { setPageState('not-found'); return }
        const form = data.data
        if (!form.isPublished) { setPageState('unavailable'); return }
        setSchema({
          id: form._id,
          name: form.name,
          description: form.description || '',
          fields: form.fields || [],
          settings: form.settings,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        })
        setPageState('ready')
      })
      .catch(() => setPageState('not-found'))
  }, [id])

  const steps = useMemo(() => {
    if (!schema) return []
    return splitIntoSteps(schema.fields, schema.name)
  }, [schema])

  const isMultiStep = schema?.settings?.multiStepEnabled && steps.length > 1
  const totalSteps = steps.length
  const progressPct = totalSteps > 1 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 100

  // Validate fields in the current step
  const validateCurrentStep = useCallback((): boolean => {
    if (!isMultiStep || !steps[currentStep]) return true
    const errors: Record<string, string> = {}
    for (const field of steps[currentStep].fields) {
      const result = validateField(field, formValues[field.id])
      if (!result.isValid) {
        errors[field.id] = result.errors[field.id] || 'Invalid'
      }
    }
    setStepErrors(errors)
    return Object.keys(errors).length === 0
  }, [isMultiStep, steps, currentStep, formValues])

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStepErrors({})
      setCurrentStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    setStepErrors({})
    setCurrentStep((s) => s - 1)
  }

  // For single-page mode, delegate to FormRenderer's own submit
  const handleSinglePageSubmit = async (data: Record<string, any>) => {
    const res = await fetch(`/api/forms/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Submission failed')
    }
    setPageState('submitted')
  }

  // For multi-step mode, handle final submit
  const handleMultiStepSubmit = async () => {
    if (!validateCurrentStep()) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`/api/forms/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formValues }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Submission failed')
      }
      setPageState('submitted')
    } catch (err: any) {
      setSubmitError(err.message || schema?.settings?.errorMessage || 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render states ──

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading form" />
      </div>
    )
  }

  if (pageState === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Form not found</h1>
          <p className="text-muted-foreground">This form doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  if (pageState === 'unavailable') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Form not available</h1>
          <p className="text-muted-foreground">This form is not currently accepting responses.</p>
        </div>
      </div>
    )
  }

  if (pageState === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2 max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold">
            {schema?.settings?.successMessage || 'Thank you for your submission!'}
          </h1>
        </div>
      </div>
    )
  }

  if (!schema) return null

  // ── Single-page mode ──
  if (!isMultiStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg border shadow-sm p-6 sm:p-8">
          <FormRenderer schema={schema} onSubmit={handleSinglePageSubmit} />
        </div>
        <footer className="mt-6 text-center text-xs text-muted-foreground">
          Powered by <span className="font-medium">FormCraft</span>
        </footer>
      </div>
    )
  }

  // ── Multi-step mode ──
  const step = steps[currentStep]
  const isLastStep = currentStep === totalSteps - 1

  // Build a partial schema for the current step
  const stepSchema: FormSchema = {
    ...schema,
    fields: step.fields,
    settings: {
      ...schema.settings,
      submitButtonText: isLastStep ? schema.settings.submitButtonText : 'Next',
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">        {/* Progress bar */}
        {schema.settings.progressBarEnabled && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} aria-label={`Step ${currentStep + 1} of ${totalSteps}`} />
          </div>
        )}

        <div className="bg-white rounded-lg border shadow-sm p-6 sm:p-8 space-y-6">
          {/* Step title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{schema.name}</h1>
            {step.title !== schema.name && (
              <p className="text-lg font-semibold text-muted-foreground mt-1">{step.title}</p>
            )}
            {schema.description && currentStep === 0 && (
              <p className="text-muted-foreground mt-1">{schema.description}</p>
            )}
          </div>

          {submitError && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Step fields — rendered individually with error display */}
          <div className="space-y-4">
            {step.fields.map((field) => (
              <StepField
                key={field.id}
                field={field}
                value={formValues[field.id] ?? ''}
                error={stepErrors[field.id] ?? ''}
                onChange={(val) => setFormValues((prev) => ({ ...prev, [field.id]: val }))}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
            )}
            {isLastStep ? (
              <Button
                onClick={handleMultiStepSubmit}
                disabled={isSubmitting}
                className="flex-1"
                style={
                  schema.settings?.theme?.primaryColor && schema.settings.submitButtonVariant === 'default'
                    ? { backgroundColor: schema.settings.theme.primaryColor, borderColor: schema.settings.theme.primaryColor, color: '#ffffff' }
                    : {}
                }
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />Submitting…</>
                ) : (
                  schema.settings.submitButtonText
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1">
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
      <footer className="mt-6 text-center text-xs text-muted-foreground">
        Powered by <span className="font-medium">FormCraft</span>
      </footer>
    </div>
  )
}

// Minimal field renderer for multi-step mode
function StepField({
  field,
  value,
  error,
  onChange,
}: {
  field: FormFieldType
  value: any
  error: string
  onChange: (v: any) => void
}) {
  const errorId = `${field.id}-error`
  const hasError = !!error

  if (field.type === 'section-header') return null

  return (
    <div className="space-y-1">
      <label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          id={field.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 4}
          disabled={field.disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : 'border-input'}`}
        />
      ) : field.type === 'select' || field.type === 'radio' ? (
        <select
          id={field.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : 'border-input'}`}
        >
          <option value="">{field.placeholder || 'Select…'}</option>
          {(field.options || []).map((opt) => (
            <option key={opt.id} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : field.type === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={field.id}
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={field.disabled}
            className="h-4 w-4"
          />
          <span className="text-sm">{field.label}</span>
        </div>
      ) : (
        <input
          id={field.id}
          type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
          value={value}
          onChange={(e) => onChange(field.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value)}
          placeholder={field.placeholder}
          disabled={field.disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : 'border-input'}`}
        />
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>
      )}
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  )
}
