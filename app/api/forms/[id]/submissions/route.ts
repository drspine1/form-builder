import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Form from '@/lib/models/Form'
import Submission from '@/lib/models/Submission'
import { ApiResponse } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
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

  const submissions = await Submission.find({ formId: id })
    .sort({ submittedAt: -1 })
    .lean()

  return NextResponse.json<ApiResponse<any>>(
    { success: true, data: submissions, timestamp: new Date().toISOString() },
    { status: 200 }
  )
}
