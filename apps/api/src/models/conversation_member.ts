import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationMember extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
  lastReadAt: Date;
}

const ConversationMemberSchema: Schema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'joinedAt', updatedAt: false },
  },
);

// Unique index to prevent duplicate members in a conversation
ConversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

const ConversationMember = mongoose.model<IConversationMember>(
  'ConversationMember',
  ConversationMemberSchema,
);
export default ConversationMember;
