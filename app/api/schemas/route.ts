import { NextRequest, NextResponse } from 'next/server'
import { FormSchema, ApiResponse } from '@/lib/types'

// In-memory storage for MVP (replace with database later)
const schemas = new Map<string, FormSchema>()

/**
 * POST /api/schemas
 * Create a new form schema
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, fields } = body

    if (!name) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Form name is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    const schema: FormSchema = {
      id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      fields: fields || [],
      settings: {
        successMessage: 'Thank you for your submission!',
        errorMessage: 'Please fix the errors above.',
        submitButtonText: 'Submit',
        submitButtonVariant: 'default',
        multiStepEnabled: false,
        progressBarEnabled: false,
        theme: {
          primaryColor: '#000000',
          secondaryColor: '#ffffff',
          accentColor: '#0066cc',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    schemas.set(schema.id, schema)
    console.log(`Schema created: ${schema.id}`)

    return NextResponse.json<ApiResponse<FormSchema>>(
      {
        success: true,
        data: schema,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create schema error:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Failed to create schema',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/schemas
 * Get all schemas
 */
export async function GET(request: NextRequest) {
  try {
    const allSchemas = Array.from(schemas.values())

    return NextResponse.json<ApiResponse<FormSchema[]>>(
      {
        success: true,
        data: allSchemas,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get schemas error:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Failed to fetch schemas',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
