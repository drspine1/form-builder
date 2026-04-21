import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Form from '@/lib/models/Form'
import Submission from '@/lib/models/Submission'
import { ApiResponse } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await connectDB()

  const form = await Form.findById(id).lean()
  if (!form) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }

  return NextResponse.json<ApiResponse<any>>(
    { success: true, data: form, timestamp: new Date().toISOString() },
    { status: 200 }
  )
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 }
    )
  }

  await connectDB()
  const form = await Form.findById(id)
  if (!form) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }

  if (form.ownerId.toString() !== session.user.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Forbidden', timestamp: new Date().toISOString() },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { name, description, fields, settings } = body

  if (name !== undefined) form.name = name
  if (description !== undefined) form.description = description
  if (fields !== undefined) form.fields = fields
  if (settings !== undefined) form.settings = settings

  await form.save()

  return NextResponse.json<ApiResponse<any>>(
    { success: true, data: form.toObject(), timestamp: new Date().toISOString() },
    { status: 200 }
  )
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 }
    )
  }

  await connectDB()
  const form = await Form.findById(id)
  if (!form) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }

  if (form.ownerId.toString() !== session.user.id) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Forbidden', timestamp: new Date().toISOString() },
      { status: 403 }
    )
  }

  await Submission.deleteMany({ formId: id })
  await form.deleteOne()

  return NextResponse.json<ApiResponse<null>>(
    { success: true, timestamp: new Date().toISOString() },
    { status: 200 }
  )
}
