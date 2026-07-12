import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationMember extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
  lastReadAt: Date;
  lastReadMessageId?: mongoose.Types.ObjectId;
  mutedUntil?: Date | null;
  isArchived: boolean;
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
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    mutedUntil: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'joinedAt', updatedAt: false },
  },
);

// Unique index to prevent duplicate members in a conversation
ConversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
// Optimize lookups of all conversations a user belongs to
ConversationMemberSchema.index({ userId: 1 });

const ConversationMember = mongoose.model<IConversationMember>(
  'ConversationMember',
  ConversationMemberSchema,
);
export default ConversationMember;
