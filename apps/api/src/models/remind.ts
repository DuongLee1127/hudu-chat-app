import mongoose, { Schema, Document } from 'mongoose';

export interface IRemind extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  dueAt: Date;
  sent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RemindSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true },
    dueAt: { type: Date, required: true, index: true },
    sent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Remind = mongoose.model<IRemind>('Remind', RemindSchema);
export default Remind;
