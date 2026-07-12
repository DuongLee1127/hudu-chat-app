import mongoose, { Schema, Document } from 'mongoose';
import { signAttachmentToken } from '@/providers/AttachmentTokenProvider';

export type AttachmentResourceType = 'image' | 'raw';

export interface IAttachment extends Document {
  uploaderId: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId | null;
  fileName: string;
  publicId: string;
  resourceType: AttachmentResourceType;
  format?: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

const AttachmentSchema: Schema = new Schema(
  {
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['image', 'raw'],
      required: true,
    },
    format: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// url/thumbnailUrl are re-signed on every serialization so the links stay short-lived;
// they point back at our own protected route, which then redirects to the actual
// Cloudinary delivery URL after re-checking conversation membership.
AttachmentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const id = String(ret._id);
    const token = signAttachmentToken(id, 'original');
    ret.url = `/api/attachments/${id}/download?token=${token}`;

    if (ret.resourceType === 'image') {
      const thumbToken = signAttachmentToken(id, 'thumbnail');
      ret.thumbnailUrl = `/api/attachments/${id}/thumbnail?token=${thumbToken}`;
    }

    delete ret.publicId;
    return ret;
  },
});

const Attachment = mongoose.model<IAttachment>('Attachment', AttachmentSchema);
export default Attachment;
