import Report from '@/models/report';
import Message from '@/models/message';
import User from '@/models/user';
import Conversation from '@/models/conversation';
import { sanitizeText } from '@/helpers/sanitize';

const VALID_TARGET_TYPES = ['message', 'user', 'conversation'] as const;

const targetExists = async (
  targetType: 'message' | 'user' | 'conversation',
  targetId: string,
) => {
  switch (targetType) {
    case 'message':
      return Boolean(await Message.exists({ _id: targetId }));
    case 'user':
      return Boolean(await User.exists({ _id: targetId }));
    case 'conversation':
      return Boolean(await Conversation.exists({ _id: targetId }));
    default:
      return false;
  }
};

const populateReport = (query: any) =>
  query
    .populate({ path: 'reporterId', select: '_id username avatar' })
    .populate({ path: 'resolvedBy', select: '_id username avatar' });

const reportService = {
  createReport: async (
    reporterId: string,
    data: { targetType: 'message' | 'user' | 'conversation'; targetId: string; reason: string },
  ) => {
    try {
      const { targetType, targetId } = data;
      const reason = sanitizeText(data.reason);

      if (!targetType || !VALID_TARGET_TYPES.includes(targetType)) {
        throw new Error('Loại nội dung bị báo cáo không hợp lệ!');
      }
      if (!targetId) {
        throw new Error('targetId là bắt buộc!');
      }
      if (!reason?.trim()) {
        throw new Error('Lý do báo cáo không được để trống!');
      }

      const exists = await targetExists(targetType, targetId);
      if (!exists) {
        throw new Error('Không tìm thấy nội dung bị báo cáo!');
      }

      const report = await Report.create({
        reporterId,
        targetType,
        targetId,
        reason: reason.trim(),
      });

      return report;
    } catch (error) {
      throw error;
    }
  },

  listReports: async (options: { status?: string; page?: number; pageSize?: number }) => {
    try {
      const page = Math.max(1, Number(options.page) || 1);
      const pageSize = Math.max(1, Number(options.pageSize) || 20);
      const skip = (page - 1) * pageSize;

      const filter: any = {};
      if (options.status) {
        filter.status = options.status;
      }

      const [items, total] = await Promise.all([
        populateReport(
          Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
        ).exec(),
        Report.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return { items, meta: { total, page, pageSize, totalPages } };
    } catch (error) {
      throw error;
    }
  },

  updateReport: async (
    adminId: string,
    reportId: string,
    data: { status?: 'pending' | 'reviewed' | 'resolved' | 'rejected'; note?: string },
  ) => {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Không tìm thấy báo cáo!');
      }

      if (data.status) {
        report.status = data.status;
        if (data.status === 'resolved' || data.status === 'rejected') {
          report.resolvedBy = adminId as any;
          report.resolvedAt = new Date();
        }
      }
      if (data.note !== undefined) {
        report.note = sanitizeText(data.note);
      }

      await report.save();
      return populateReport(Report.findById(report._id)).exec();
    } catch (error) {
      throw error;
    }
  },
};

export default reportService;
