import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  name?: string;
  type: 'private' | 'group';
  avatar?: string;
  creatorId?: mongoose.Types.ObjectId;
  lastMessageId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['private', 'group'],
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  },
);

const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;
