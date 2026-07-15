import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  name?: string;
  type: 'private' | 'group' | 'self';
  avatar?: string;
  creatorId?: mongoose.Types.ObjectId;
  lastMessageId?: mongoose.Types.ObjectId;
  pinnedMessageIds: mongoose.Types.ObjectId[];
  inviteToken?: string;
  inviteEnabled: boolean;
  lastMessageAt: Date;
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
      enum: ['private', 'group', 'self'],
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
    pinnedMessageIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    inviteToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    inviteEnabled: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;
