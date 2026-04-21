import { NextRequest, NextResponse } from 'next/server'
import { FormSubmission, ApiResponse } from '@/lib/types'

// In-memory storage for MVP (replace with database later)
const submissions = new Map<string, FormSubmission[]>()

/**
 * POST /api/forms/submit
 * Submit form data
 */
export async function POST(request: NextRequest) {
  try {
    const { formId, data } = await request.json()

    if (!formId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Form ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // Create submission record
    const submission: FormSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formId,
      data,
      submittedAt: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }

    // Store submission
    if (!submissions.has(formId)) {
      submissions.set(formId, [])
    }
    submissions.get(formId)!.push(submission)

    console.log(`Form submission received for form ${formId}`)

    return NextResponse.json<ApiResponse<FormSubmission>>(
      {
        success: true,
        data: submission,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Failed to process submission',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/forms/submit
 * This route does not support GET — return 405
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json<ApiResponse<null>>(
    {
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    },
    { status: 405, headers: { Allow: 'POST' } }
  )
}
