import mongoose, { Schema, Document, Model, Types } from 'mongoose'
import type { FormField, FormSettings } from '@/lib/types'

export interface IForm extends Document {
  ownerId: Types.ObjectId
  name: string
  description?: string
  fields: FormField[]
  settings: FormSettings
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

const FormSchema = new Schema<IForm>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, default: 'Untitled Form' },
    description: { type: String, default: '' },
    fields: { type: Schema.Types.Mixed, default: [] },
    settings: { type: Schema.Types.Mixed, required: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const Form: Model<IForm> =
  mongoose.models.Form || mongoose.model<IForm>('Form', FormSchema)

export default Form
