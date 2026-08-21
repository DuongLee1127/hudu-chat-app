import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio' | 'system';
  attachmentIds: mongoose.Types.ObjectId[];
  replyToMessageId?: mongoose.Types.ObjectId;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  pinnedAt?: Date;
  pinnedById?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'video', 'audio', 'system'],
      default: 'text',
    },
    attachmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
      },
    ],
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
    },
    pinnedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

// Optimize listing/pagination queries scoped to a conversation
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, isPinned: 1 });
// Full-text search over message content
MessageSchema.index({ content: 'text' });

const Message = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
