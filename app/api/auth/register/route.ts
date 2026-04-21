import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { ApiResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Name, email, and password are required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Password must be at least 8 characters', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'An account with this email already exists', timestamp: new Date().toISOString() },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      provider: 'credentials',
    })

    return NextResponse.json<ApiResponse<null>>(
      { success: true, timestamp: new Date().toISOString() },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
