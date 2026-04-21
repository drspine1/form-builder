'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Submission {
  _id: string
  data: Record<string, any>
  submittedAt: string
  ipAddress?: string
}

export default function SubmissionsPage() {
  const params = useParams()
  const formId = params?.formId as string

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [formName, setFormName] = useState('Form')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!formId) return

    const load = async () => {
      setIsLoading(true)
      try {
        // Load form name
        const formRes = await fetch(`/api/forms/${formId}`)
        if (formRes.ok) {
          const formData = await formRes.json()
          setFormName(formData.data?.name || 'Form')
        }

        // Load submissions
        const subRes = await fetch(`/api/forms/${formId}/submissions`)
        if (!subRes.ok) throw new Error('Failed to load submissions')
        const subData = await subRes.json()
        setSubmissions(subData.data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load submissions')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [formId])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 sm:px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild aria-label="Back to dashboard">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Dashboard
          </Link>
        </Button>
        <h1 className="text-lg font-bold truncate">
          Responses — {formName}
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading submissions" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-muted-foreground text-lg">No responses yet</p>
            <p className="text-muted-foreground text-sm">
              Share your form link to start collecting responses.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {submissions.length} response{submissions.length !== 1 ? 's' : ''}
            </p>
            {submissions.map((sub, idx) => (
              <div key={sub._id} className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Response #{submissions.length - idx}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </span>
                </div>
                <dl className="grid gap-2">
                  {Object.entries(sub.data ?? {}).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                      <dt className="font-medium text-muted-foreground truncate col-span-1">{key}</dt>
                      <dd className="col-span-2 break-words">
                        {Array.isArray(value)
                          ? value.join(', ')
                          : String(value ?? '—')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
