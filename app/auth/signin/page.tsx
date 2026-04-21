'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, ClipboardList, Zap, Share2, BarChart2 } from 'lucide-react'

const FEATURES = [
  {
    icon: <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />,
    title: '16 field types',
    desc: 'Text, email, dropdowns, ratings, file uploads and more.',
  },
  {
    icon: <Zap className="h-5 w-5 text-primary" aria-hidden="true" />,
    title: 'Drag & drop builder',
    desc: 'Build forms visually — no code required.',
  },
  {
    icon: <Share2 className="h-5 w-5 text-primary" aria-hidden="true" />,
    title: 'Shareable links',
    desc: 'Publish and share your form with a single URL.',
  },
  {
    icon: <BarChart2 className="h-5 w-5 text-primary" aria-hidden="true" />,
    title: 'Response tracking',
    desc: 'View all submissions in your dashboard.',
  },
]

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const registered = searchParams.get('registered') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) { setError('Invalid email or password'); return }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    await signIn('google', { callbackUrl })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="text-4xl mb-3" aria-hidden="true">📋</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">FormCraft</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Build beautiful forms, share them instantly, and collect responses — all in one place.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-lg border p-4 space-y-1 shadow-sm">
                {f.icon}
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign-in form */}
      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Sign in to get started</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Free forever. No credit card required.
          </p>
        </div>

        {registered && (
          <Alert>
            <AlertDescription>Account created! Sign in to get started.</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email" disabled={isLoading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password" required autoComplete="current-password" disabled={isLoading} />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />Signing in…</>
              : 'Sign in'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}
          disabled={isGoogleLoading} aria-label="Sign in with Google">
          {isGoogleLoading
            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
          Sign in with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="underline hover:text-foreground font-medium">
            Create one free
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t mt-8 py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} FormCraft. Build beautiful forms, free forever.</p>
      </footer>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SignInForm />
    </Suspense>
  )
}
