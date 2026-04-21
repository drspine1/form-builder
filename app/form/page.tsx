import { redirect } from 'next/navigation'

/**
 * /form without an ID redirects to dashboard.
 * The real form renderer lives at /form/[id]
 */
export default function FormIndexPage() {
  redirect('/dashboard')
}
