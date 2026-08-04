import { create } from 'zustand';
import type { CallDTO } from '@/types/call';

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'in-call';

interface CallState {
  phase: CallPhase;
  call: CallDTO | null;
  token: string | null;
  serverUrl: string | null;
  error: string | null;

  setOutgoing: (call: CallDTO, token?: string | null, serverUrl?: string | null) => void;
  setIncoming: (call: CallDTO) => void;
  setConnecting: () => void;
  setInCall: (call: CallDTO, token: string, serverUrl: string) => void;
  patchCall: (call: CallDTO) => void;
  setError: (message: string) => void;
  reset: () => void;
}

const initialState = {
  phase: 'idle' as CallPhase,
  call: null,
  token: null,
  serverUrl: null,
  error: null,
};

export const useCallStore = create<CallState>()((set, get) => ({
  ...initialState,

  setOutgoing: (call, token = null, serverUrl = null) =>
    set({ phase: 'outgoing', call, token, serverUrl, error: null }),

  setIncoming: (call) => set({ phase: 'incoming', call, token: null, serverUrl: null, error: null }),

  setConnecting: () => set({ phase: 'connecting', error: null }),

  setInCall: (call, token, serverUrl) => set({ phase: 'in-call', call, token, serverUrl, error: null }),

  patchCall: (call) => {
    const current = get().call;
    if (!current || current._id !== call._id) return;
    set({ call });
  },

  setError: (message) => set({ error: message }),

  reset: () => set({ ...initialState }),
}));
