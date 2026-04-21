import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Form from '@/lib/models/Form'
import { ApiResponse, FormSettings } from '@/lib/types'

const DEFAULT_SETTINGS: FormSettings = {
  successMessage: 'Thank you for your submission!',
  errorMessage: 'Please fix the errors above.',
  submitButtonText: 'Submit',
  submitButtonVariant: 'default',
  multiStepEnabled: false,
  progressBarEnabled: false,
  theme: { primaryColor: '#000000', secondaryColor: '#ffffff', accentColor: '#0066cc' },
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 }
    )
  }

  await connectDB()
  const forms = await Form.find({ ownerId: session.user.id })
    .sort({ updatedAt: -1 })
    .lean()

  return NextResponse.json<ApiResponse<any>>(
    { success: true, data: forms, timestamp: new Date().toISOString() },
    { status: 200 }
  )
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 }
    )
  }

  await connectDB()
  const body = await request.json().catch(() => ({}))

  const form = await Form.create({
    ownerId: session.user.id,
    name: body.name || 'Untitled Form',
    description: body.description || '',
    fields: body.fields || [],
    settings: body.settings || DEFAULT_SETTINGS,
    isPublished: false,
  })

  return NextResponse.json<ApiResponse<any>>(
    { success: true, data: form.toObject(), timestamp: new Date().toISOString() },
    { status: 201 }
  )
}
