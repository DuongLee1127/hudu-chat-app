import mongoose, { Schema, Document } from 'mongoose';

export interface IPoll extends Document {
  conversationId: mongoose.Types.ObjectId;
  messageId: mongoose.Types.ObjectId;
  question: string;
  options: Array<{ text: string; voterIds: mongoose.Types.ObjectId[] }>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PollSchema: Schema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true, unique: true },
    question: { type: String, required: true, trim: true },
    options: [
      {
        text: { type: String, required: true, trim: true },
        voterIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

const Poll = mongoose.model<IPoll>('Poll', PollSchema);
export default Poll;
