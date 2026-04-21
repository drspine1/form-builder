import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { FormField, ValidationRule, ValidationResult, ConditionalRule } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ID generation
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for non-secure contexts (e.g., http:// in development)
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Field utilities
export function createEmptyField(type: string): FormField {
  return {
    id: generateId(),
    type: type as any,
    label: '',
    placeholder: '',
    description: '',
    required: false,
    defaultValue: undefined,
    validation: [],
    options: [],
    disabled: false,
    hidden: false,
  }
}

export function getFieldTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: 'Text',
    email: 'Email',
    number: 'Number',
    password: 'Password',
    textarea: 'Text Area',
    select: 'Select',
    multiselect: 'Multi-Select',
    checkbox: 'Checkbox',
    radio: 'Radio',
    date: 'Date',
    time: 'Time',
    file: 'File Upload',
    url: 'URL',
    phone: 'Phone',
    rating: 'Rating',
    'section-header': 'Section Header',
  }
  return labels[type] || type
}

// Validation utilities
export function validateField(field: FormField, value: any): ValidationResult {
  const errors: Record<string, string> = {}

  // Required validation
  if (field.required && (value === undefined || value === '' || value === null)) {
    errors[field.id] = `${field.label} is required`
    return { isValid: false, errors }
  }

  // Skip other validations if field is empty and not required
  if (!field.required && (value === undefined || value === '' || value === null)) {
    return { isValid: true, errors: {} }
  }

  // Apply validation rules
  for (const rule of field.validation) {
    switch (rule.type) {
      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          errors[field.id] = rule.message
        }
        break
      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          errors[field.id] = rule.message
        }
        break
      case 'min':
        if (typeof value === 'number' && value < (rule.value as number)) {
          errors[field.id] = rule.message
        }
        break
      case 'max':
        if (typeof value === 'number' && value > (rule.value as number)) {
          errors[field.id] = rule.message
        }
        break
      case 'email':
        if (!isValidEmail(value)) {
          errors[field.id] = rule.message
        }
        break
      case 'url':
        if (!isValidUrl(value)) {
          errors[field.id] = rule.message
        }
        break
      case 'pattern':
        if (rule.value && !new RegExp(rule.value as string).test(value)) {
          errors[field.id] = rule.message
        }
        break
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Conditional logic utilities
export function evaluateConditionalRule(
  rule: ConditionalRule,
  fieldValue: any
): boolean {
  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value
    case 'notEquals':
      return fieldValue !== rule.value
    case 'contains':
      return String(fieldValue).includes(rule.value)
    case 'greaterThan':
      return Number(fieldValue) > Number(rule.value)
    case 'lessThan':
      return Number(fieldValue) < Number(rule.value)
    default:
      return false
  }
}

// Form data utilities
export function serializeFormData(data: Record<string, any>): string {
  return JSON.stringify(data, null, 2)
}

export function deserializeFormData(json: string): Record<string, any> {
  try {
    return JSON.parse(json)
  } catch {
    return {}
  }
}

// Storage utilities
export function saveFormToLocalStorage(formId: string, form: any): void {
  try {
    localStorage.setItem(`form_${formId}`, JSON.stringify(form))
  } catch (e) {
    console.error('Failed to save form to localStorage:', e)
  }
}

export function loadFormFromLocalStorage(formId: string): any | null {
  try {
    const data = localStorage.getItem(`form_${formId}`)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Failed to load form from localStorage:', e)
    return null
  }
}

// Array utilities
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array]
  const [movedItem] = newArray.splice(from, 1)
  newArray.splice(to, 0, movedItem)
  return newArray
}

// Multi-step form utilities
export interface FormStep {
  title: string
  fields: FormField[]
}

/**
 * Splits a fields array into steps using section-header fields as boundaries.
 * Section-header fields become step titles and are excluded from step fields.
 * If no section-headers exist, returns a single step with all fields.
 */
export function splitIntoSteps(fields: FormField[], formName: string): FormStep[] {
  const steps: FormStep[] = []
  let currentStep: FormStep = { title: formName, fields: [] }

  for (const field of fields) {
    if (field.type === 'section-header') {
      // Close current step (only add if it has fields or is the first)
      if (currentStep.fields.length > 0 || steps.length === 0) {
        steps.push(currentStep)
      }
      // Start new step with this header's label as title
      currentStep = { title: field.label || 'Step', fields: [] }
    } else {
      currentStep.fields.push(field)
    }
  }

  // Push the last step
  steps.push(currentStep)

  // Filter out empty steps (except if it's the only one)
  const nonEmpty = steps.filter((s) => s.fields.length > 0)
  return nonEmpty.length > 0 ? nonEmpty : [{ title: formName, fields: [] }]
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
