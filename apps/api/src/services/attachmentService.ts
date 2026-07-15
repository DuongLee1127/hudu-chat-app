import path from 'path';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { UploadApiResponse } from 'cloudinary';
import cloudinary, { CLOUDINARY_FOLDER } from '@/config/cloudinary';
import Attachment, { IAttachment, AttachmentResourceType } from '@/models/attachment';
import Message from '@/models/message';
import { getMembership } from '@/services/membershipService';
import {
  AUDIO_MIME_TYPES,
  getMaxSizeForMime,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
} from '@/config/upload';

const THUMBNAIL_MAX_DIMENSION = 320;

const assertCanAccess = async (userId: string, attachment: IAttachment) => {
  if (String(attachment.uploaderId) === userId) {
    return;
  }

  if (attachment.messageId) {
    const message = await Message.findById(attachment.messageId);
    if (message && !message.isDeleted) {
      const membership = await getMembership(String(message.conversationId), userId);
      if (membership) {
        return;
      }
    }
  }

  throw new Error('Bạn không có quyền truy cập tệp đính kèm này!');
};

const uploadBufferToCloudinary = (
  file: Express.Multer.File,
  resourceType: AttachmentResourceType,
  publicId: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: CLOUDINARY_FOLDER,
        public_id: publicId,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error instanceof Error ? error : new Error('Tải tệp lên Cloudinary thất bại!'));
          return;
        }
        resolve(result);
      },
    );
    Readable.from(file.buffer).pipe(uploadStream);
  });
};

const attachmentService = {
  uploadFile: async (userId: string, file: Express.Multer.File) => {
    try {
      const isImage = IMAGE_MIME_TYPES.includes(file.mimetype);
      const isMedia = AUDIO_MIME_TYPES.includes(file.mimetype) || VIDEO_MIME_TYPES.includes(file.mimetype);
      const maxSize = getMaxSizeForMime(file.mimetype);

      if (file.size > maxSize) {
        throw new Error(`Dung lượng tệp "${file.originalname}" vượt quá giới hạn cho phép!`);
      }

      const resourceType: AttachmentResourceType = isImage ? 'image' : isMedia ? 'video' : 'raw';
      // Raw (non-image) files keep their extension in the public_id so Cloudinary
      // serves/downloads them with the correct format.
      const publicId = resourceType === 'raw' ? `${uuidv4()}${path.extname(file.originalname)}` : uuidv4();

      const result = await uploadBufferToCloudinary(file, resourceType, publicId);

      const _id = new mongoose.Types.ObjectId();
      const attachment = await Attachment.create({
        _id,
        uploaderId: userId,
        fileName: file.originalname,
        publicId: result.public_id,
        resourceType,
        format: result.format,
        mimeType: file.mimetype,
        size: file.size,
        url: `/api/attachments/${_id}/download`,
      });

      return attachment;
    } catch (error) {
      throw error;
    }
  },

  uploadFiles: async (userId: string, files: Express.Multer.File[]) => {
    const attachments: IAttachment[] = [];
    try {
      for (const file of files) {
        // eslint-disable-next-line no-await-in-loop
        const attachment = await attachmentService.uploadFile(userId, file);
        attachments.push(attachment);
      }
      return attachments;
    } catch (error) {
      // Roll back files already uploaded in this batch so a partial failure doesn't leave orphans
      await Promise.all(attachments.map((a) => attachmentService.deleteAttachment(userId, String(a._id))));
      throw error;
    }
  },

  getAttachmentById: async (userId: string, id: string) => {
    try {
      const attachment = await Attachment.findById(id);
      if (!attachment) {
        throw new Error('Không tìm thấy tệp đính kèm!');
      }

      await assertCanAccess(userId, attachment);
      return attachment;
    } catch (error) {
      throw error;
    }
  },

  listConversationAttachments: async (userId: string, conversationId: string, type?: string) => {
    const membership = await getMembership(conversationId, userId);
    if (!membership) {
      throw new Error('Bạn không có quyền xem tệp đính kèm của hội thoại này!');
    }

    const messageIds = await Message.find({ conversationId, isDeleted: false }).distinct('_id');
    const filter: { messageId: { $in: mongoose.Types.ObjectId[] }; mimeType?: RegExp } = {
      messageId: { $in: messageIds },
    };
    if (type === 'image') {
      filter.mimeType = /^image\//;
    }

    return Attachment.find(filter).sort({ createdAt: -1 });
  },

  buildDownloadUrl: (attachment: IAttachment) => {
    // Cloudinary's fl_attachment transformation can't safely contain arbitrary
    // characters, so pass a sanitized name; it auto-appends the real extension.
    const safeName = path.parse(attachment.fileName).name.replace(/[^a-zA-Z0-9-_]+/g, '_') || 'file';

    return cloudinary.url(attachment.publicId, {
      resource_type: attachment.resourceType,
      secure: true,
      sign_url: true,
      ...(attachment.resourceType === 'raw' ? { flags: `attachment:${safeName}` } : {}),
    });
  },

  buildThumbnailUrl: (attachment: IAttachment) => {
    if (attachment.resourceType !== 'image') {
      throw new Error('Tệp đính kèm không phải là ảnh!');
    }
    return cloudinary.url(attachment.publicId, {
      resource_type: 'image',
      secure: true,
      sign_url: true,
      width: THUMBNAIL_MAX_DIMENSION,
      height: THUMBNAIL_MAX_DIMENSION,
      crop: 'limit',
      fetch_format: 'auto',
      quality: 'auto',
    });
  },

  resolveDownloadUrl: async (userId: string, id: string) => {
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      throw new Error('Không tìm thấy tệp đính kèm!');
    }
    await assertCanAccess(userId, attachment);
    return attachmentService.buildDownloadUrl(attachment);
  },

  resolveDownloadUrlByToken: async (id: string) => {
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      throw new Error('Không tìm thấy tệp đính kèm!');
    }
    return attachmentService.buildDownloadUrl(attachment);
  },

  resolveThumbnailUrl: async (userId: string, id: string) => {
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      throw new Error('Không tìm thấy tệp đính kèm!');
    }
    await assertCanAccess(userId, attachment);
    return attachmentService.buildThumbnailUrl(attachment);
  },

  resolveThumbnailUrlByToken: async (id: string) => {
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      throw new Error('Không tìm thấy tệp đính kèm!');
    }
    return attachmentService.buildThumbnailUrl(attachment);
  },

  deleteAttachment: async (userId: string, id: string) => {
    try {
      const attachment = await Attachment.findById(id);
      if (!attachment) {
        throw new Error('Không tìm thấy tệp đính kèm!');
      }

      if (String(attachment.uploaderId) !== userId) {
        throw new Error('Bạn không có quyền xóa tệp đính kèm này!');
      }

      if (attachment.messageId) {
        const message = await Message.findById(attachment.messageId);
        if (message && !message.isDeleted) {
          throw new Error('Không thể xóa tệp đính kèm đã gắn vào tin nhắn!');
        }
      }

      await Attachment.deleteOne({ _id: attachment._id });
      await cloudinary.uploader
        .destroy(attachment.publicId, { resource_type: attachment.resourceType })
        .catch(() => {});

      return { success: true };
    } catch (error) {
      throw error;
    }
  },
};

export default attachmentService;
