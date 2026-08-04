'use client';

import { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '@/providers/SocketProvider';
import { useGetMe } from '@/hook/useAuth';
import { useCallStore } from '@/store/useCallStore';
import { msg } from '@/lib/notify';
import type { CallAckResponse, CallDTO, CallTokenResult, CallType } from '@/types/call';
import IncomingCallModal from '@/app/(protected)/chat/_components/IncomingCallModal';
import OutgoingCallOverlay from '@/app/(protected)/chat/_components/OutgoingCallOverlay';
import InCallView from '@/app/(protected)/chat/_components/InCallView';

interface CallContextValue {
  startCall: (conversationId: string, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  cancelCall: () => void;
  leaveCall: () => void;
  joinOngoingCall: (conversationId: string) => Promise<void>;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCallContext() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCallContext phải được dùng bên trong CallProvider');
  }
  return ctx;
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const { data: meData } = useGetMe();
  const currentUserId = meData?.data?._id;

  const phase = useCallStore((s) => s.phase);
  const call = useCallStore((s) => s.call);
  const setOutgoing = useCallStore((s) => s.setOutgoing);
  const setIncoming = useCallStore((s) => s.setIncoming);
  const setConnecting = useCallStore((s) => s.setConnecting);
  const setInCall = useCallStore((s) => s.setInCall);
  const patchCall = useCallStore((s) => s.patchCall);
  const setError = useCallStore((s) => s.setError);
  const reset = useCallStore((s) => s.reset);

  useEffect(() => {
    const onIncoming = ({ call }: { call: CallDTO }) => {
      if (useCallStore.getState().phase !== 'idle') return;
      setIncoming(call);
    };
    const onOutgoing = ({ call }: { call: CallDTO }) => {
      if (useCallStore.getState().phase === 'idle') {
        setOutgoing(call);
      }
    };
    const onAccepted = ({ call }: { call: CallDTO }) => {
      const state = useCallStore.getState();
      if (!state.call || state.call._id !== call._id) return;
      // The caller (or any tab already holding a token) transitions into the
      // room as soon as someone else accepts -- they never went through their
      // own call:accept/call:join ack, so nothing else moves them forward.
      if (state.phase !== 'in-call' && state.token && state.serverUrl) {
        setInCall(call, state.token, state.serverUrl);
      } else {
        patchCall(call);
      }
    };
    const onDeclined = ({ call }: { call: CallDTO }) => patchCall(call);
    const onEnded = ({ conversationId }: { conversationId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['calls', 'active', conversationId] });
      reset();
    };
    const onCallError = ({ message }: { message: string }) => {
      setError(message);
      msg.error(message);
    };

    socket.on('call:incoming', onIncoming);
    socket.on('call:outgoing', onOutgoing);
    socket.on('call:accepted', onAccepted);
    socket.on('call:declined', onDeclined);
    socket.on('call:ended', onEnded);
    socket.on('call:error', onCallError);

    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:outgoing', onOutgoing);
      socket.off('call:accepted', onAccepted);
      socket.off('call:declined', onDeclined);
      socket.off('call:ended', onEnded);
      socket.off('call:error', onCallError);
    };
  }, [socket, queryClient, setIncoming, setOutgoing, setInCall, patchCall, reset, setError]);

  const emitWithAck = <T,>(event: string, payload: unknown) =>
    new Promise<CallAckResponse<T>>((resolve) => {
      socket.emit(event, payload, (res: CallAckResponse<T>) => resolve(res));
    });

  const startCall = async (conversationId: string, type: CallType) => {
    setConnecting();
    const res = await emitWithAck<CallTokenResult>('call:invite', { conversationId, type });
    if (!res.success || !res.data) {
      msg.error(res.error || 'Không thể thực hiện cuộc gọi!');
      reset();
      return;
    }

    const { call: resultCall, token, serverUrl } = res.data;
    const selfParticipant = resultCall.participants.find((p) => p.userId._id === currentUserId);
    if (resultCall.status === 'ongoing' && selfParticipant?.status === 'accepted') {
      setInCall(resultCall, token, serverUrl);
    } else {
      setOutgoing(resultCall, token, serverUrl);
    }
  };

  const acceptCall = async () => {
    if (!call) return;
    const res = await emitWithAck<CallTokenResult>('call:accept', { callId: call._id });
    if (!res.success || !res.data) {
      msg.error(res.error || 'Không thể chấp nhận cuộc gọi!');
      reset();
      return;
    }
    setInCall(res.data.call, res.data.token, res.data.serverUrl);
  };

  const declineCall = () => {
    if (!call) return;
    socket.emit('call:decline', { callId: call._id });
    reset();
  };

  const cancelCall = () => {
    if (!call) return;
    socket.emit('call:cancel', { callId: call._id });
    reset();
  };

  const leaveCall = () => {
    if (!call) return;
    socket.emit('call:leave', { callId: call._id });
    reset();
  };

  const joinOngoingCall = async (conversationId: string) => {
    const res = await emitWithAck<CallTokenResult>('call:join', { conversationId });
    if (!res.success || !res.data) {
      msg.error(res.error || 'Không thể tham gia cuộc gọi!');
      reset();
      return;
    }
    setInCall(res.data.call, res.data.token, res.data.serverUrl);
  };

  const value: CallContextValue = {
    startCall,
    acceptCall,
    declineCall,
    cancelCall,
    leaveCall,
    joinOngoingCall,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      {phase === 'incoming' && <IncomingCallModal />}
      {(phase === 'outgoing' || phase === 'connecting') && <OutgoingCallOverlay />}
      {phase === 'in-call' && <InCallView />}
    </CallContext.Provider>
  );
}
