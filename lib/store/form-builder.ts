import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { FormSchema, FormField, FormSettings, SelectionState } from '@/lib/types';
import { generateId } from '@/lib/utils';

const MAX_HISTORY_SIZE = 50;

interface FormBuilderStore {
  // State
  form: FormSchema;
  selectionState: SelectionState;
  history: {
    past: FormSchema[];
    future: FormSchema[];
  };
  isAutoSaving: boolean;
  lastSavedAt: string | null;

  // Core actions
  setForm: (form: FormSchema) => void;
  updateForm: (updates: Partial<FormSchema>) => void;

  // Field management
  addField: (field: FormField, position?: number) => void;
  updateField: (fieldId: string, updates: Partial<FormField>) => void;
  deleteField: (fieldId: string) => void;
  reorderFields: (fieldIds: string[]) => void;
  duplicateField: (fieldId: string) => void;

  // Selection
  selectField: (fieldId: string | null) => void;
  selectMultipleFields: (fieldIds: string[]) => void;
  clearSelection: () => void;
  getSelectedField: () => FormField | null;

  // Settings
  updateSettings: (settings: Partial<FormSettings>) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: (form: FormSchema) => void;

  // Auto-save
  setAutoSaving: (isSaving: boolean) => void;
  setLastSavedAt: (date: string) => void;

  // Reset
  resetForm: () => void;
}

// Stable template — no side effects at module load time (fixes hydration mismatch)
const DEFAULT_FORM_TEMPLATE: Omit<FormSchema, 'id'> = {
  name: 'Untitled Form',
  description: '',
  fields: [],
  settings: {
    successMessage: 'Thank you for your submission!',
    errorMessage: 'Please fix the errors above.',
    submitButtonText: 'Submit',
    submitButtonVariant: 'default',
    multiStepEnabled: false,
    progressBarEnabled: false,
    theme: {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      accentColor: '#0066cc',
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Helper to push history with the size cap applied inline
function withHistory(
  state: { form: FormSchema; history: { past: FormSchema[]; future: FormSchema[] } },
  updatedForm: FormSchema
) {
  const newPast = [...state.history.past, state.form];
  if (newPast.length > MAX_HISTORY_SIZE) newPast.shift();
  return {
    form: updatedForm,
    history: { past: newPast, future: [] },
  };
}

export const useFormBuilder = create<FormBuilderStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ID generated lazily inside the factory — runs only on the client
        form: { ...DEFAULT_FORM_TEMPLATE, id: generateId() },
        selectionState: { selectedFieldId: null, selectedFieldIds: [] },
        history: { past: [], future: [] },
        isAutoSaving: false,
        lastSavedAt: null,

        setForm: (form) => {
          set((state) => withHistory(state, form));
        },

        updateForm: (updates) => {
          set((state) => {
            const updatedForm: FormSchema = {
              ...state.form,
              ...updates,
              // Never let a partial update clobber settings unless explicitly provided
              settings: updates.settings
                ? { ...state.form.settings, ...updates.settings }
                : state.form.settings,
              updatedAt: new Date().toISOString(),
            };
            return withHistory(state, updatedForm);
          });
        },

        addField: (field, position) => {
          set((state) => {
            const fields =
              position !== undefined
                ? [
                    ...state.form.fields.slice(0, position),
                    field,
                    ...state.form.fields.slice(position),
                  ]
                : [...state.form.fields, field];

            const updatedForm: FormSchema = {
              ...state.form,
              fields,
              updatedAt: new Date().toISOString(),
            };
            return withHistory(state, updatedForm);
          });
        },

        updateField: (fieldId, updates) => {
          set((state) => {
            const fields = state.form.fields.map((f) =>
              f.id === fieldId ? { ...f, ...updates } : f
            );
            const updatedForm: FormSchema = {
              ...state.form,
              fields,
              updatedAt: new Date().toISOString(),
            };
            return withHistory(state, updatedForm);
          });
        },

        deleteField: (fieldId) => {
          set((state) => {
            const fields = state.form.fields.filter((f) => f.id !== fieldId);
            const updatedForm: FormSchema = {
              ...state.form,
              fields,
              updatedAt: new Date().toISOString(),
            };
            const next = withHistory(state, updatedForm);

            // Clear selection if the deleted field was selected
            if (state.selectionState.selectedFieldId === fieldId) {
              return {
                ...next,
                selectionState: { selectedFieldId: null, selectedFieldIds: [] },
              };
            }
            return next;
          });
        },

        reorderFields: (fieldIds) => {
          set((state) => {
            const fieldMap = new Map(state.form.fields.map((f) => [f.id, f]));
            const fields = fieldIds.map((id) => fieldMap.get(id)!);
            const updatedForm: FormSchema = {
              ...state.form,
              fields,
              updatedAt: new Date().toISOString(),
            };
            return withHistory(state, updatedForm);
          });
        },

        duplicateField: (fieldId) => {
          set((state) => {
            const fieldToDuplicate = state.form.fields.find((f) => f.id === fieldId);
            if (!fieldToDuplicate) return state;

            const duplicatedField: FormField = {
              ...fieldToDuplicate,
              id: generateId(),
              label: `${fieldToDuplicate.label} (Copy)`,
            };

            const fieldIndex = state.form.fields.findIndex((f) => f.id === fieldId);
            const fields = [
              ...state.form.fields.slice(0, fieldIndex + 1),
              duplicatedField,
              ...state.form.fields.slice(fieldIndex + 1),
            ];

            const updatedForm: FormSchema = {
              ...state.form,
              fields,
              updatedAt: new Date().toISOString(),
            };
            return withHistory(state, updatedForm);
          });
        },

        selectField: (fieldId) => {
          set({
            selectionState: {
              selectedFieldId: fieldId,
              selectedFieldIds: fieldId ? [fieldId] : [],
            },
          });
        },

        selectMultipleFields: (fieldIds) => {
          set({
            selectionState: {
              selectedFieldId: fieldIds[0] || null,
              selectedFieldIds: fieldIds,
            },
          });
        },

        clearSelection: () => {
          set({
            selectionState: { selectedFieldId: null, selectedFieldIds: [] },
          });
        },

        getSelectedField: () => {
          const state = get();
          if (!state.selectionState.selectedFieldId) return null;
          return (
            state.form.fields.find(
              (f) => f.id === state.selectionState.selectedFieldId
            ) || null
          );
        },

        updateSettings: (settings) => {
          set((state) => {
            const updatedForm: FormSchema = {
              ...state.form,
              settings: { ...state.form.settings, ...settings },
              updatedAt: new Date().toISOString(),
            };
            return withHistory(state, updatedForm);
          });
        },

        // Retained for interface compatibility — history is now inlined in each action
        pushHistory: (_form) => {
          // no-op: history is managed inline in each mutating action
        },

        undo: () => {
          set((state) => {
            if (state.history.past.length === 0) return state;

            const previousForm = state.history.past[state.history.past.length - 1];
            const newPast = state.history.past.slice(0, -1);

            return {
              form: previousForm,
              history: {
                past: newPast,
                future: [state.form, ...state.history.future],
              },
            };
          });
        },

        redo: () => {
          set((state) => {
            if (state.history.future.length === 0) return state;

            const nextForm = state.history.future[0];
            const newFuture = state.history.future.slice(1);

            return {
              form: nextForm,
              history: {
                past: [...state.history.past, state.form],
                future: newFuture,
              },
            };
          });
        },

        canUndo: () => get().history.past.length > 0,
        canRedo: () => get().history.future.length > 0,

        setAutoSaving: (isSaving) => set({ isAutoSaving: isSaving }),
        setLastSavedAt: (date) => set({ lastSavedAt: date }),

        resetForm: () => {
          set({
            form: { ...DEFAULT_FORM_TEMPLATE, id: generateId() },
            selectionState: { selectedFieldId: null, selectedFieldIds: [] },
            history: { past: [], future: [] },
            lastSavedAt: null,
          });
        },
      }),
      {
        name: 'form-builder-store',
        version: 2,
        // Only persist the form — never history (too large for localStorage quota)
        partialize: (state) => ({
          form: state.form,
        }),
        // Wrap storage in try/catch so quota errors never crash the app
        storage: {
          getItem: (name) => {
            try {
              const value = localStorage.getItem(name)
              return value ? JSON.parse(value) : null
            } catch {
              return null
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, JSON.stringify(value))
            } catch (e) {
              // Quota exceeded — clear old data and retry once
              try {
                localStorage.removeItem(name)
                localStorage.setItem(name, JSON.stringify(value))
              } catch {
                // If still failing, silently skip — MongoDB sync will handle persistence
              }
            }
          },
          removeItem: (name) => {
            try { localStorage.removeItem(name) } catch {}
          },
        },
      }
    )
  )
);
