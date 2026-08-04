import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ICallParticipant {
  userId: mongoose.Types.ObjectId;
  status: 'invited' | 'accepted' | 'declined' | 'left';
  joinedAt?: Date;
  leftAt?: Date;
}

export interface ICall extends Document {
  conversationId: mongoose.Types.ObjectId;
  initiatorId: mongoose.Types.ObjectId;
  type: 'audio' | 'video';
  status: 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined' | 'cancelled';
  roomName: string;
  participants: ICallParticipant[];
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CallParticipantSchema = new Schema<ICallParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined', 'left'],
      default: 'invited',
    },
    joinedAt: {
      type: Date,
    },
    leftAt: {
      type: Date,
    },
  },
  { _id: false },
);

const CallSchema: Schema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    initiatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['audio', 'video'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ringing', 'ongoing', 'ended', 'missed', 'declined', 'cancelled'],
      default: 'ringing',
    },
    roomName: {
      type: String,
      required: true,
      unique: true,
      default: () => `call_${uuidv4()}`,
    },
    participants: {
      type: [CallParticipantSchema],
      default: [],
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

CallSchema.index({ conversationId: 1, status: 1 });
CallSchema.index({ 'participants.userId': 1, status: 1 });
// Enforce "at most one active call per conversation" at the DB level so two
// near-simultaneous call:invite (double-click, or both sides calling each
// other at once) can't each pass the "no active call yet" check and create
// two separate Call documents for the same conversation.
CallSchema.index(
  { conversationId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['ringing', 'ongoing'] } } },
);

const Call = mongoose.model<ICall>('Call', CallSchema);
export default Call;
