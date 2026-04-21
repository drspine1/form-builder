import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Form from '@/lib/models/Form'
import { ApiResponse } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
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

  const { isPublished } = await request.json()
  form.isPublished = Boolean(isPublished)
  await form.save()

  return NextResponse.json<ApiResponse<{ isPublished: boolean }>>(
    {
      success: true,
      data: { isPublished: form.isPublished },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
