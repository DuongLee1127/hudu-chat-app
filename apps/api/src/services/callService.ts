import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import Call, { ICall } from '@/models/call';
import Conversation from '@/models/conversation';
import ConversationMember from '@/models/conversation_member';
import User from '@/models/user';
import { assertMember } from '@/services/membershipService';
import messageService from '@/services/messageService';
import notificationService from '@/services/notificationService';
import livekitService from '@/services/livekitService';
import { isRateLimited } from '@/socket/rateLimit';
import { isUserOnline } from '@/socket/onlineUsers';
import { logger } from '@/helpers/logger';

const ACTIVE_STATUSES: ICall['status'][] = ['ringing', 'ongoing'];
const INVITE_WINDOW_MS = 60 * 1000;
const INVITE_MAX = 6;

type FinalStatus = 'ended' | 'missed' | 'declined' | 'cancelled';

const populateCall = (query: any) =>
  query
    .populate({ path: 'initiatorId', select: '_id username avatar' })
    .populate({ path: 'participants.userId', select: '_id username avatar' });

const getCallRooms = (call: ICall) =>
  call.participants.map((p) => `user:${String(p.userId)}`);

const formatDuration = (seconds: number) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

const buildSystemMessageContent = (
  call: ICall,
  isGroup: boolean,
  status: FinalStatus,
  opts: { durationSec?: number; declinedByUsername?: string } = {},
): string => {
  const kind = call.type === 'video' ? 'video' : 'thoại';
  const groupSuffix = isGroup ? ' nhóm' : '';

  if (status === 'ended') {
    const startPart = call.startedAt ? `Bắt đầu ${formatTime(call.startedAt)} · ` : '';
    return `Cuộc gọi ${kind}${groupSuffix} đã kết thúc · ${startPart}${formatDuration(opts.durationSec ?? 0)}`;
  }
  if (status === 'declined' && !isGroup && opts.declinedByUsername) {
    return `${opts.declinedByUsername} đã từ chối cuộc gọi ${kind}`;
  }
  return `Cuộc gọi ${kind}${groupSuffix} nhỡ`;
};

const callService = {
  initiateCall: async (
    io: Server,
    userId: string,
    conversationId: string,
    type: 'audio' | 'video',
  ) => {
    await assertMember(conversationId, userId);

    const user = await User.findById(userId).select('accountStatus username');
    if (user?.accountStatus === 'locked') {
      throw new Error('Tài khoản của bạn đã bị khóa, không thể thực hiện cuộc gọi!');
    }

    const activeElsewhere = await Call.findOne({
      status: { $in: ACTIVE_STATUSES },
      conversationId: { $ne: conversationId },
      participants: { $elemMatch: { userId, status: 'accepted' } },
    });
    if (activeElsewhere) {
      throw new Error('Bạn đang trong một cuộc gọi khác. Vui lòng kết thúc cuộc gọi hiện tại trước!');
    }

    const existing = await Call.findOne({ conversationId, status: { $in: ACTIVE_STATUSES } });
    if (existing) {
      return callService.joinCall(io, userId, existing);
    }

    if (isRateLimited(`call:invite:${userId}`, INVITE_WINDOW_MS, INVITE_MAX)) {
      throw new Error('Bạn đang gọi quá nhanh. Vui lòng thử lại sau!');
    }

    const memberDocs = await ConversationMember.find({ conversationId }).select('userId');
    const memberIds = memberDocs.map((m) => String(m.userId));

    const participants = memberIds.map((id) => ({
      userId: new mongoose.Types.ObjectId(id),
      status: (id === userId ? 'accepted' : 'invited') as 'accepted' | 'invited',
      joinedAt: id === userId ? new Date() : undefined,
    }));

    let call: ICall;
    try {
      call = await Call.create({
        conversationId,
        initiatorId: userId,
        type,
        status: 'ringing',
        participants,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        // Lost the race to create: another request (double-click, or the
        // other side calling at the same instant) already created the
        // active call for this conversation -- join that one instead of
        // ending up with two separate Call documents / duplicate "call
        // ended" messages.
        const concurrent = await Call.findOne({ conversationId, status: { $in: ACTIVE_STATUSES } });
        if (concurrent) {
          return callService.joinCall(io, userId, concurrent);
        }
      }
      throw error;
    }

    const token = await livekitService.createParticipantToken({
      roomName: call.roomName,
      userId,
      username: user?.username || 'Người dùng',
    });
    const serverUrl = livekitService.getLiveKitServerUrl();

    const populated = await populateCall(Call.findById(call._id)).exec();
    io.to(getCallRooms(call)).emit('call:incoming', { call: populated });
    io.to(`user:${userId}`).emit('call:outgoing', { call: populated });

    return { call: populated, token, serverUrl };
  },

  joinCall: async (io: Server, userId: string, call: ICall) => {
    const now = new Date();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const hasParticipant = call.participants.some((p) => String(p.userId) === userId);

    // Per-field atomic updates instead of load -> mutate -> save: two people
    // accepting a group call within the same instant would otherwise both
    // read status:'ringing' before either write lands, and whichever save
    // wins last silently overwrites startedAt with a later timestamp,
    // shortening every duration computed from it afterwards.
    if (hasParticipant) {
      await Call.updateOne(
        { _id: call._id, 'participants.userId': userObjectId },
        { $set: { 'participants.$.status': 'accepted', 'participants.$.joinedAt': now } },
      );
    } else {
      await Call.updateOne(
        { _id: call._id },
        { $push: { participants: { userId: userObjectId, status: 'accepted', joinedAt: now } } },
      );
    }

    // Only the request that actually finds status:'ringing' flips it -- a
    // concurrent second acceptance no-ops here and keeps the first writer's
    // startedAt.
    await Call.updateOne(
      { _id: call._id, status: 'ringing' },
      { $set: { status: 'ongoing', startedAt: now } },
    );

    const refreshed = await Call.findById(call._id);
    if (!refreshed) throw new Error('Không tìm thấy cuộc gọi!');

    const user = await User.findById(userId).select('username');
    const token = await livekitService.createParticipantToken({
      roomName: refreshed.roomName,
      userId,
      username: user?.username || 'Người dùng',
    });
    const serverUrl = livekitService.getLiveKitServerUrl();

    const populated = await populateCall(Call.findById(refreshed._id)).exec();
    io.to(getCallRooms(refreshed)).emit('call:accepted', {
      callId: String(refreshed._id),
      userId,
      call: populated,
    });

    return { call: populated, token, serverUrl };
  },

  acceptCall: async (io: Server, userId: string, callId: string) => {
    const call = await Call.findById(callId);
    if (!call) throw new Error('Không tìm thấy cuộc gọi!');
    await assertMember(String(call.conversationId), userId);
    if (!ACTIVE_STATUSES.includes(call.status)) {
      throw new Error('Cuộc gọi này không còn hiệu lực!');
    }
    return callService.joinCall(io, userId, call);
  },

  joinOngoingCall: async (io: Server, userId: string, conversationId: string) => {
    await assertMember(conversationId, userId);
    const call = await Call.findOne({ conversationId, status: { $in: ACTIVE_STATUSES } });
    if (!call) throw new Error('Không tìm thấy cuộc gọi!');
    return callService.joinCall(io, userId, call);
  },

  declineCall: async (io: Server, userId: string, callId: string) => {
    const call = await Call.findById(callId);
    if (!call) throw new Error('Không tìm thấy cuộc gọi!');
    await assertMember(String(call.conversationId), userId);
    if (!ACTIVE_STATUSES.includes(call.status)) {
      throw new Error('Cuộc gọi này không còn hiệu lực!');
    }

    const participant = call.participants.find((p) => String(p.userId) === userId);
    if (participant) {
      participant.status = 'declined';
    }
    await call.save();

    const conversation = await Conversation.findById(call.conversationId).select('type');
    const isGroup = conversation?.type === 'group';

    if (!isGroup) {
      const decliner = await User.findById(userId).select('username');
      await callService.finalizeCall(io, call, 'declined', {
        declinedByUsername: decliner?.username || 'Người dùng',
      });
    } else {
      const populated = await populateCall(Call.findById(call._id)).exec();
      io.to(getCallRooms(call)).emit('call:declined', {
        callId: String(call._id),
        userId,
        call: populated,
      });
    }

    const finalCall = await populateCall(Call.findById(call._id)).exec();
    return { call: finalCall };
  },

  cancelCall: async (io: Server, userId: string, callId: string) => {
    const call = await Call.findById(callId);
    if (!call) throw new Error('Không tìm thấy cuộc gọi!');
    if (String(call.initiatorId) !== userId) {
      throw new Error('Chỉ người gọi mới có thể hủy cuộc gọi!');
    }
    if (call.status !== 'ringing') {
      throw new Error('Cuộc gọi này không còn hiệu lực!');
    }
    const anyoneAccepted = call.participants.some(
      (p) => String(p.userId) !== userId && p.status === 'accepted',
    );
    if (anyoneAccepted) {
      throw new Error(
        'Không thể hủy cuộc gọi vì đã có người tham gia. Hãy rời khỏi cuộc gọi thay vì hủy.',
      );
    }

    await callService.finalizeCall(io, call, 'cancelled');
    const finalCall = await populateCall(Call.findById(call._id)).exec();
    return { call: finalCall };
  },

  leaveCall: async (io: Server, userId: string, callId: string) => {
    const call = await Call.findById(callId);
    if (!call) throw new Error('Không tìm thấy cuộc gọi!');
    const participant = call.participants.find((p) => String(p.userId) === userId);
    if (!participant || participant.status !== 'accepted') {
      throw new Error('Bạn chưa tham gia cuộc gọi này!');
    }

    participant.status = 'left';
    participant.leftAt = new Date();
    await call.save();

    io.to(getCallRooms(call)).emit('call:participant-left', {
      callId: String(call._id),
      userId,
      leftAt: participant.leftAt.toISOString(),
    });

    const remainingAccepted = call.participants.filter((p) => p.status === 'accepted').length;
    if (remainingAccepted < 2) {
      await callService.finalizeCall(io, call, 'ended');
    }

    const finalCall = await populateCall(Call.findById(call._id)).exec();
    return { call: finalCall };
  },

  getActiveCallForConversation: async (userId: string, conversationId: string) => {
    await assertMember(conversationId, userId);
    const call = await Call.findOne({ conversationId, status: { $in: ACTIVE_STATUSES } });
    if (!call) return { call: null };
    const populated = await populateCall(Call.findById(call._id)).exec();
    return { call: populated };
  },

  handleUserDisconnect: async (io: Server, socket: Socket) => {
    try {
      const userId = String(socket.data.user.id);
      if (await isUserOnline(userId)) return;

      const calls = await Call.find({
        status: { $in: ACTIVE_STATUSES },
        'participants.userId': userId,
      });

      for (const call of calls) {
        if (call.status === 'ringing' && String(call.initiatorId) === userId) {
          const anyoneAccepted = call.participants.some(
            (p) => String(p.userId) !== userId && p.status === 'accepted',
          );
          if (!anyoneAccepted) {
            await callService.finalizeCall(io, call, 'cancelled');
            continue;
          }
        }

        const participant = call.participants.find((p) => String(p.userId) === userId);
        if (!participant || participant.status !== 'accepted') continue;

        participant.status = 'left';
        participant.leftAt = new Date();
        await call.save();

        io.to(getCallRooms(call)).emit('call:participant-left', {
          callId: String(call._id),
          userId,
          leftAt: participant.leftAt.toISOString(),
        });

        const remainingAccepted = call.participants.filter((p) => p.status === 'accepted').length;
        if (remainingAccepted < 2) {
          await callService.finalizeCall(io, call, 'ended');
        }
      }
    } catch (error) {
      logger.error('callService.handleUserDisconnect failed', error);
    }
  },

  finalizeCall: async (
    io: Server,
    call: ICall,
    status: FinalStatus,
    opts: { declinedByUsername?: string } = {},
  ) => {
    // Atomically claim the transition: if two requests race to finalize the
    // same call (e.g. both sides hanging up at once, or a stale call:leave
    // arriving after call:ended already fired), only the one that actually
    // flips status away from an active state proceeds -- the other gets back
    // null and no-ops. A read-then-write guard can't catch true-concurrent
    // races since both would read the still-active status before either
    // write lands, which is what let duplicate/mistimed "call ended"
    // messages slip through.
    const updated = await Call.findOneAndUpdate(
      { _id: call._id, status: { $in: ACTIVE_STATUSES } },
      { $set: { status, endedAt: new Date() } },
      { new: true },
    );
    if (!updated) return;

    await livekitService.deleteLiveKitRoom(updated.roomName);

    const durationSec = updated.startedAt
      ? Math.max(0, Math.round((updated.endedAt!.getTime() - updated.startedAt.getTime()) / 1000))
      : undefined;

    io.to(getCallRooms(updated)).emit('call:ended', {
      callId: String(updated._id),
      conversationId: String(updated.conversationId),
      status,
      durationSec,
      endedAt: updated.endedAt!.toISOString(),
    });

    const conversation = await Conversation.findById(updated.conversationId).select('type');
    const isGroup = conversation?.type === 'group';

    const shouldLog =
      status === 'ended' ||
      (status === 'cancelled' && (!isGroup || !updated.startedAt)) ||
      (status === 'declined' && !isGroup);

    if (shouldLog) {
      const content = buildSystemMessageContent(updated, isGroup, status, {
        durationSec,
        declinedByUsername: opts.declinedByUsername,
      });
      const message = await messageService.createSystemMessage(
        String(updated.conversationId),
        String(updated.initiatorId),
        content,
      );
      io.to(`conversation:${updated.conversationId}`).emit('message:created', { message });
      await notificationService.notifyNewMessage(
        io,
        message,
        String(updated.conversationId),
        String(updated.initiatorId),
      );
    }
  },
};

export default callService;
