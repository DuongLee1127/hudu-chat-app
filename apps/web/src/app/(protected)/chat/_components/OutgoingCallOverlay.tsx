'use client';

import type { CSSProperties } from 'react';
import { Avatar, Button, Spin, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useGetMe } from '@/hook/useAuth';
import { useCallStore } from '@/store/useCallStore';
import { useCallContext } from '@/providers/CallProvider';
import { colorForId, initialOf } from '@/lib/avatar';

const { Title, Text } = Typography;

export default function OutgoingCallOverlay() {
  const call = useCallStore((s) => s.call);
  const phase = useCallStore((s) => s.phase);
  const { cancelCall } = useCallContext();
  const { data: meData } = useGetMe();
  const currentUserId = meData?.data?._id;

  if (!call) {
    return (
      <div style={overlayStyle}>
        <Spin size="large" />
      </div>
    );
  }

  const isVideo = call.type === 'video';
  const otherParticipants = call.participants.filter((p) => p.userId._id !== currentUserId);
  const callee = otherParticipants[0]?.userId;

  return (
    <div style={overlayStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Avatar
          size={96}
          src={callee?.avatar || undefined}
          style={{ backgroundColor: colorForId(callee?._id || call._id) }}
        >
          {callee ? initialOf(callee.username) : undefined}
        </Avatar>
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#fff' }}>
            {otherParticipants.length > 1 ? 'Cuộc gọi nhóm' : callee?.username || 'Đang kết nối...'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
            {phase === 'connecting'
              ? 'Đang kết nối...'
              : isVideo
                ? 'Đang gọi video...'
                : 'Đang đổ chuông...'}
          </Text>
        </div>
        <Button shape="circle" size="large" danger icon={<CloseOutlined />} onClick={cancelCall} />
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(10, 12, 20, 0.92)',
};
