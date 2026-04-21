'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Plus, Edit, Eye, Trash2, BarChart2, LogOut, Loader2, Globe, EyeOff
} from 'lucide-react'

interface FormSummary {
  _id: string
  name: string
  isPublished: boolean
  updatedAt: string
  submissionCount?: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [forms, setForms] = useState<FormSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)

  const fetchForms = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/forms')
      if (!res.ok) throw new Error('Failed to load forms')
      const data = await res.json()

      // Fetch submission counts in parallel
      const formsWithCounts = await Promise.all(
        (data.data || []).map(async (f: FormSummary) => {
          try {
            const subRes = await fetch(`/api/forms/${f._id}/submissions`)
            if (subRes.ok) {
              const subData = await subRes.json()
              return { ...f, submissionCount: subData.data?.length ?? 0 }
            }
          } catch {}
          return { ...f, submissionCount: 0 }
        })
      )
      setForms(formsWithCounts)
    } catch (err: any) {
      setError(err.message || 'Failed to load forms')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchForms()
  }, [fetchForms])

  const handleNewForm = async () => {
    setCreatingNew(true)
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled Form' }),
      })
      if (!res.ok) throw new Error('Failed to create form')
      const data = await res.json()
      const newId = data.data._id
      localStorage.setItem('builder-db-form-id', newId)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreatingNew(false)
    }
  }

  const handleEdit = (formId: string) => {
    localStorage.setItem('builder-db-form-id', formId)
    router.push('/')
  }

  const handleDelete = async (formId: string) => {
    setDeletingId(formId)
    try {
      const res = await fetch(`/api/forms/${formId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete form')
      setForms((prev) => prev.filter((f) => f._id !== formId))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleTogglePublish = async (form: FormSummary) => {
    try {
      const res = await fetch(`/api/forms/${form._id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !form.isPublished }),
      })
      if (!res.ok) throw new Error('Failed to update publish status')
      const data = await res.json()
      setForms((prev) =>
        prev.map((f) =>
          f._id === form._id ? { ...f, isPublished: data.data.isPublished } : f
        )
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">My Forms</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {session?.user?.name || session?.user?.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 mr-1" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* New form button */}
        <div className="flex justify-end">
          <Button onClick={handleNewForm} disabled={creatingNew}>
            {creatingNew ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            New Form
          </Button>
        </div>

        {/* Forms list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading forms" />
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-muted-foreground text-lg">No forms yet</p>
            <p className="text-muted-foreground text-sm">Create your first form to get started</p>
            <Button onClick={handleNewForm} disabled={creatingNew}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Create your first form
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <div
                key={form._id}
                className="border rounded-lg p-4 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-sm truncate flex-1">{form.name}</h2>
                  <Badge variant={form.isPublished ? 'default' : 'secondary'} className="shrink-0">
                    {form.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{form.submissionCount ?? 0} submission{form.submissionCount !== 1 ? 's' : ''}</p>
                  <p>Updated {new Date(form.updatedAt).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(form._id)}
                    aria-label={`Edit ${form.name}`}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" aria-hidden="true" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/form/${form._id}`, '_blank')}
                    aria-label={`Preview ${form.name}`}
                    disabled={!form.isPublished}
                    title={!form.isPublished ? 'Publish first to preview' : 'Open form'}
                  >
                    <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                    Preview
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePublish(form)}
                    aria-label={form.isPublished ? `Unpublish ${form.name}` : `Publish ${form.name}`}
                  >
                    {form.isPublished
                      ? <EyeOff className="h-3 w-3" aria-hidden="true" />
                      : <Globe className="h-3 w-3" aria-hidden="true" />
                    }
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    aria-label={`View submissions for ${form.name}`}
                  >
                    <Link href={`/dashboard/${form._id}/submissions`}>
                      <BarChart2 className="h-3 w-3 mr-1" aria-hidden="true" />
                      Responses
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                        aria-label={`Delete ${form.name}`}
                        disabled={deletingId === form._id}
                      >
                        {deletingId === form._id
                          ? <Loader2 className="h-3 w-3 animate-spin mr-1" aria-hidden="true" />
                          : <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
                        }
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{form.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the form and all its submissions. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(form._id)}
                          style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                        >
                          Delete permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
