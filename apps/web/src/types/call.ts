export type CallType = 'audio' | 'video';

export type CallStatus = 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined' | 'cancelled';

export type CallParticipantStatus = 'invited' | 'accepted' | 'declined' | 'left';

export interface CallUser {
  _id: string;
  username: string;
  avatar?: string;
}

export interface CallParticipant {
  userId: CallUser;
  status: CallParticipantStatus;
  joinedAt?: string;
  leftAt?: string;
}

export interface CallDTO {
  _id: string;
  conversationId: string;
  initiatorId: CallUser;
  type: CallType;
  status: CallStatus;
  roomName: string;
  participants: CallParticipant[];
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallTokenResult {
  call: CallDTO;
  token: string;
  serverUrl: string;
}

export interface CallAckResponse<T = CallTokenResult> {
  success: boolean;
  data?: T;
  error?: string;
}
