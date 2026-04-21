import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Form from '@/lib/models/Form'
import Submission from '@/lib/models/Submission'
import { ApiResponse } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  await connectDB()

  const form = await Form.findById(id)
  if (!form) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }

  if (!form.isPublished) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'This form is not available', timestamp: new Date().toISOString() },
      { status: 403 }
    )
  }

  const { data } = await request.json()

  const submission = await Submission.create({
    formId: form._id,
    data: data || {},
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  })

  return NextResponse.json<ApiResponse<any>>(
    { success: true, data: submission.toObject(), timestamp: new Date().toISOString() },
    { status: 201 }
  )
}
