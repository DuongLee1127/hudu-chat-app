import { Server, Socket } from 'socket.io';
import callService from '@/services/callService';
import { logger } from '@/helpers/logger';

export const registerCallHandlers = (io: Server, socket: Socket) => {
  const getUserId = () => String(socket.data.user.id);

  socket.on(
    'call:invite',
    async (payload: { conversationId: string; type: 'audio' | 'video' }, ack?: (res: any) => void) => {
      try {
        const result = await callService.initiateCall(io, getUserId(), payload.conversationId, payload.type);
        ack?.({ success: true, data: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể thực hiện cuộc gọi!';
        logger.error('socket call:invite failed', error);
        ack?.({ success: false, error: message });
        socket.emit('call:error', { message });
      }
    },
  );

  socket.on('call:accept', async (payload: { callId: string }, ack?: (res: any) => void) => {
    try {
      const result = await callService.acceptCall(io, getUserId(), payload.callId);
      ack?.({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể chấp nhận cuộc gọi!';
      ack?.({ success: false, error: message });
      socket.emit('call:error', { callId: payload.callId, message });
    }
  });

  socket.on('call:decline', async (payload: { callId: string }, ack?: (res: any) => void) => {
    try {
      const result = await callService.declineCall(io, getUserId(), payload.callId);
      ack?.({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể từ chối cuộc gọi!';
      ack?.({ success: false, error: message });
    }
  });

  socket.on('call:cancel', async (payload: { callId: string }, ack?: (res: any) => void) => {
    try {
      const result = await callService.cancelCall(io, getUserId(), payload.callId);
      ack?.({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể hủy cuộc gọi!';
      ack?.({ success: false, error: message });
    }
  });

  socket.on('call:leave', async (payload: { callId: string }, ack?: (res: any) => void) => {
    try {
      const result = await callService.leaveCall(io, getUserId(), payload.callId);
      ack?.({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể rời cuộc gọi!';
      ack?.({ success: false, error: message });
    }
  });

  socket.on('call:join', async (payload: { conversationId: string }, ack?: (res: any) => void) => {
    try {
      const result = await callService.joinOngoingCall(io, getUserId(), payload.conversationId);
      ack?.({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tham gia cuộc gọi!';
      ack?.({ success: false, error: message });
      socket.emit('call:error', { message });
    }
  });
};
