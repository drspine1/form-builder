import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ISubmission extends Document {
  formId: Types.ObjectId
  data: Record<string, unknown>
  submittedAt: Date
  ipAddress?: string
  userAgent?: string
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
      index: true,
    },
    data: { type: Schema.Types.Mixed, required: true },
    submittedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: false }
)

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>('Submission', SubmissionSchema)

export default Submission
