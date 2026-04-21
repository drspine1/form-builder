'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogOut } from 'lucide-react'
import React, { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useFormBuilder } from '@/lib/store/form-builder'
import { useFormAutoSave, useFormSelection, useFormHistory } from '@/hooks/use-form-builder'
import { createEmptyField } from '@/lib/utils'
import { FieldType, FormSchema } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BuilderHeader } from '@/components/form-builder/builder-header'
import { FieldTypePicker } from '@/components/form-builder/field-type-picker'
import { FieldList } from '@/components/form-builder/field-list'
import { FieldConfigPanel } from '@/components/form-builder/field-config-panel'
import { FormSettingsPanel } from '@/components/form-builder/form-settings-panel'
import { FormPreviewPanel } from '@/components/form-builder/form-preview-panel'

export default function BuilderPage() {
  const [mounted, setMounted] = useState(false)
  const [dbFormId, setDbFormId] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)

  const { data: session } = useSession()
  const router = useRouter()
  const { form, addField, updateField, updateForm, updateSettings, setForm } = useFormBuilder()
  const { selectedFieldId, selectedField, selectField } = useFormSelection()
  const { undo, redo, canUndo, canRedo } = useFormHistory()

  // Use dbFormId for MongoDB sync, fall back to 'default-form' for localStorage
  const activeFormId = dbFormId || 'default-form'
  const { saveStatus } = useFormAutoSave(activeFormId)

  // All hooks before early return
  const handleAddField = useCallback(
    (type: FieldType) => {
      const field = createEmptyField(type)
      addField(field)
      selectField(field.id)
    },
    [addField, selectField]
  )

  const handleFieldUpdate = useCallback(
    (updates: any) => {
      if (selectedFieldId) updateField(selectedFieldId, updates)
    },
    [selectedFieldId, updateField]
  )

  const handlePublishToggle = useCallback(async () => {
    if (!dbFormId) return
    try {
      const res = await fetch(`/api/forms/${dbFormId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsPublished(data.data.isPublished)
      }
    } catch (err) {
      console.error('Publish toggle failed:', err)
    }
  }, [dbFormId, isPublished])

  // On mount: load or create form in MongoDB if logged in
  useEffect(() => {
    // One-time cleanup: remove any oversized legacy store data from before version 2
    try {
      const raw = localStorage.getItem('form-builder-store')
      if (raw && raw.length > 500_000) {
        // Over 500KB means it has old history snapshots — wipe it
        localStorage.removeItem('form-builder-store')
      }
    } catch {}
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !session?.user?.id) return

    const initForm = async () => {
      // Check localStorage for a saved dbFormId
      const savedId = localStorage.getItem('builder-db-form-id')

      if (savedId) {
        try {
          const res = await fetch(`/api/forms/${savedId}`)
          if (res.ok) {
            const data = await res.json()
            const dbForm = data.data
            // Hydrate store with DB form
            setForm({
              id: dbForm._id,
              name: dbForm.name,
              description: dbForm.description || '',
              fields: dbForm.fields || [],
              settings: dbForm.settings,
              createdAt: dbForm.createdAt,
              updatedAt: dbForm.updatedAt,
            } as FormSchema)
            setDbFormId(dbForm._id)
            setIsPublished(dbForm.isPublished)
            return
          }
        } catch {}
      }

      // No saved form — create a new one
      try {
        const res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            fields: form.fields,
            settings: form.settings,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const newForm = data.data
          setDbFormId(newForm._id)
          setIsPublished(newForm.isPublished)
          localStorage.setItem('builder-db-form-id', newForm._id)
          // Update store id to match DB
          updateForm({ id: newForm._id })
        }
      } catch (err) {
        console.error('Failed to create form in DB:', err)
      }
    }

    initForm()
  }, [mounted, session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen" aria-live="polite">
        Loading…
      </div>
    )
  }

  const settingsContent = (
    <FormSettingsPanel settings={form.settings} onUpdate={updateSettings} />
  )

  const previewUrl = dbFormId ? `/form/${dbFormId}` : '/form'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BuilderHeader
        formName={form.name}
        onNameChange={(name) => updateForm({ name })}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onPreview={() => window.open(previewUrl, '_blank')}
        settingsContent={settingsContent}
        saveStatus={saveStatus}
        isPublished={isPublished}
        onPublishToggle={session?.user?.id ? handlePublishToggle : undefined}
        userName={session?.user?.name || session?.user?.email}
        onDashboard={session?.user?.id ? () => router.push('/dashboard') : undefined}
        onSignOut={session?.user?.id ? () => signOut({ callbackUrl: '/auth/signin' }) : undefined}
      />

      {/* ── Mobile layout (< md) ── */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg border p-4 space-y-4 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold">{form.name}</h1>
                {form.description && (
                  <p className="text-muted-foreground mt-1 text-sm">{form.description}</p>
                )}
              </div>
              <FieldList selectedFieldId={selectedFieldId} onFieldSelect={selectField} />
            </div>
          </div>
        </main>
        <div className="border-t bg-background">
          <Tabs defaultValue="fields">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="fields" className="flex-1">Add Fields</TabsTrigger>
              <TabsTrigger value="config" className="flex-1">Configure</TabsTrigger>
              <TabsTrigger value="schema" className="flex-1">Schema</TabsTrigger>
            </TabsList>
            <div className="max-h-64 overflow-y-auto">
              <TabsContent value="fields" className="p-4">
                <FieldTypePicker onSelect={handleAddField} />
              </TabsContent>
              <TabsContent value="config" className="p-4">
                <FieldConfigPanel field={selectedField} onUpdate={handleFieldUpdate} />
              </TabsContent>
              <TabsContent value="schema" className="p-4">
                <FormPreviewPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* ── Desktop layout (≥ md) ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <aside className="w-64 border-r overflow-y-auto p-4 space-y-6" aria-label="Field toolbox">
          <FieldTypePicker onSelect={handleAddField} />
        </aside>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6" aria-label="Form canvas">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg border p-8 space-y-6 shadow-sm">
              <div>
                <h1 className="text-3xl font-bold">{form.name}</h1>
                {form.description && (
                  <p className="text-muted-foreground mt-2">{form.description}</p>
                )}
              </div>
              <FieldList selectedFieldId={selectedFieldId} onFieldSelect={selectField} />
            </div>
          </div>
        </main>
        <aside className="w-80 border-l overflow-y-auto flex flex-col" aria-label="Field configuration">
          <Tabs defaultValue="config" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b justify-start px-4 pt-4">
              <TabsTrigger value="config">Config</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
            </TabsList>
            <TabsContent value="config" className="flex-1 overflow-y-auto">
              <FieldConfigPanel field={selectedField} onUpdate={handleFieldUpdate} />
            </TabsContent>
            <TabsContent value="schema" className="flex-1 overflow-y-auto">
              <FormPreviewPanel />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  )
}
