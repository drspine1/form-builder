// Core field types
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'number' 
  | 'password'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'file'
  | 'url'
  | 'phone'
  | 'rating'
  | 'section-header';

// Validation types
export type ValidationType = 
  | 'required' 
  | 'minLength' 
  | 'maxLength' 
  | 'pattern'
  | 'min'
  | 'max'
  | 'email'
  | 'url'
  | 'custom';

export interface ValidationRule {
  type: ValidationType;
  value?: string | number;
  message: string;
}

// Conditional logic
export interface ConditionalRule {
  id: string;
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string;
  action: 'show' | 'hide' | 'disable' | 'require';
  targetFieldId: string;
}

// Field option for select, radio, checkbox
export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

// Field definition
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  defaultValue?: string | string[] | number;
  validation: ValidationRule[];
  options?: FieldOption[];
  rows?: number; // for textarea
  pattern?: string;
  helpText?: string;
  disabled?: boolean;
  hidden?: boolean;
  conditionalRules?: ConditionalRule[];
}

// Form schema
export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
  createdAt: string;
  updatedAt: string;
}

// Form settings
export interface FormSettings {
  successMessage: string;
  errorMessage: string;
  submitButtonText: string;
  submitButtonVariant: 'default' | 'outline' | 'secondary' | 'destructive';
  multiStepEnabled: boolean;
  progressBarEnabled: boolean;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  redirectOnSubmit?: string;
  requireLogin?: boolean;
}

// Form submission
export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Builder state types
export interface SelectionState {
  selectedFieldId: string | null;
  selectedFieldIds: string[];
}

export interface UndoRedoState {
  past: FormSchema[];
  present: FormSchema;
  future: FormSchema[];
}

// API request/response types
export interface CreateSchemaRequest {
  name: string;
  description?: string;
  fields: FormField[];
}

export interface UpdateSchemaRequest {
  name?: string;
  description?: string;
  fields?: FormField[];
  settings?: Partial<FormSettings>;
}

export interface SubmitFormRequest {
  schemaId: string;
  data: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Form validation result
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
