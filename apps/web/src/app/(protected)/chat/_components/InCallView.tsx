'use client';

import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { useCallStore } from '@/store/useCallStore';
import { useCallContext } from '@/providers/CallProvider';

export default function InCallView() {
  const call = useCallStore((s) => s.call);
  const token = useCallStore((s) => s.token);
  const serverUrl = useCallStore((s) => s.serverUrl);
  const { leaveCall } = useCallContext();

  if (!call || !token || !serverUrl) return null;

  return (
    <div
      data-lk-theme="default"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000' }}
    >
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        video={call.type === 'video'}
        audio
        style={{ height: '100%' }}
        onDisconnected={leaveCall}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
