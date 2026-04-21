import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthSessionProvider } from '@/components/session-provider'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'FormCraft — Build & Share Forms',
    template: '%s | FormCraft',
  },
  description:
    'FormCraft lets you build beautiful, shareable forms with drag-and-drop ease. No coding required.',
  keywords: ['form builder', 'drag and drop forms', 'online forms', 'form creator'],
  authors: [{ name: 'FormCraft' }],
  creator: 'FormCraft',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'FormCraft — Build & Share Forms',
    description: 'Build beautiful, shareable forms with drag-and-drop ease.',
    siteName: 'FormCraft',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormCraft — Build & Share Forms',
    description: 'Build beautiful, shareable forms with drag-and-drop ease.',
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>",
        type: 'image/svg+xml',
      },
    ],
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
