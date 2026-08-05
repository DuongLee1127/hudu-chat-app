import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  attachmentId: mongoose.Types.ObjectId;
  caption?: string;
  viewerIds: mongoose.Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
}

const StorySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attachmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Attachment',
      required: true,
    },
    caption: {
      type: String,
      maxlength: 200,
      default: '',
    },
    viewerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Mongo automatically deletes the document once expiresAt passes — no cleanup job needed.
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model<IStory>('Story', StorySchema);
export default Story;
