import mongoose, { Schema, Document } from 'mongoose';

export interface IFriend extends Document {
  requesterId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted';
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema: Schema = new Schema(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate requests in the same direction
FriendSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const Friend = mongoose.model<IFriend>('Friend', FriendSchema);
export default Friend;
