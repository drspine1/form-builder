import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useFormBuilder } from '@/lib/store/form-builder'
import { saveFormToLocalStorage, loadFormFromLocalStorage, debounce } from '@/lib/utils'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useFormAutoSave(formId: string, interval: number = 2000) {
  const { form, setLastSavedAt, setAutoSaving } = useFormBuilder()
  const { data: session } = useSession()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const saveForm = useCallback(async () => {
    setSaveStatus('saving')
    setAutoSaving(true)

    const isDbForm = session?.user?.id && formId && formId !== 'default-form'

    try {
      if (isDbForm) {
        const res = await fetch(`/api/forms/${formId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            fields: form.fields,
            settings: form.settings,
          }),
        })

        if (!res.ok) {
          // DB failed — fall back to localStorage silently
          saveFormToLocalStorage(formId, form)
          setSaveStatus('error')
          setAutoSaving(false)
          return
        }
      } else {
        // No session or local form — localStorage only
        saveFormToLocalStorage(formId, form)
      }

      setLastSavedAt(new Date().toISOString())
      setSaveStatus('saved')
    } catch {
      // Network error — fall back to localStorage silently, no console noise
      try { saveFormToLocalStorage(formId, form) } catch {}
      setSaveStatus('error')
    } finally {
      setAutoSaving(false)
    }
  }, [form, formId, session, setAutoSaving, setLastSavedAt])

  const saveFormRef = useRef(saveForm)
  useEffect(() => { saveFormRef.current = saveForm }, [saveForm])

  const debouncedSaveRef = useRef(
    debounce((..._args: any[]) => saveFormRef.current(), interval)
  )

  useEffect(() => {
    debouncedSaveRef.current()
  }, [form])

  return { saveForm, saveStatus }
}

export function useFormPersistence(formId: string) {
  const { setForm, form } = useFormBuilder()

  const loadForm = useCallback(() => {
    const savedForm = loadFormFromLocalStorage(formId)
    if (savedForm) {
      setForm(savedForm)
      return true
    }
    return false
  }, [formId, setForm])

  const saveForm = useCallback(() => {
    saveFormToLocalStorage(formId, form)
  }, [formId, form])

  return { loadForm, saveForm }
}

export function useFormSelection() {
  const { selectField, getSelectedField, selectionState, clearSelection } =
    useFormBuilder()

  return {
    selectedFieldId: selectionState.selectedFieldId,
    selectedField: getSelectedField(),
    selectField,
    clearSelection,
  }
}

export function useFormHistory() {
  const { undo, redo, canUndo, canRedo } = useFormBuilder()

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  }
}
