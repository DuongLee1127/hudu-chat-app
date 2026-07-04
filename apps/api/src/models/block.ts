import mongoose, { Schema, Document } from 'mongoose';

export interface IBlock extends Document {
  userId: mongoose.Types.ObjectId;
  blockedUserId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BlockSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blockedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Prevent duplicate blocks
BlockSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

const Block = mongoose.model<IBlock>('Block', BlockSchema);
export default Block;
