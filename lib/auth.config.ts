import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

/**
 * Lightweight auth config — safe for Edge runtime (middleware).
 * Does NOT import mongoose or bcryptjs.
 * The actual credential validation happens in lib/auth.ts (Node.js only).
 */
export const authConfig: NextAuthConfig = {
  providers: [
    // Credentials provider listed here so NextAuth knows it exists,
    // but authorize() is defined in lib/auth.ts (Node.js runtime only)
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize is intentionally omitted here — it lives in lib/auth.ts
      async authorize() {
        return null
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: { strategy: 'jwt' },
}
