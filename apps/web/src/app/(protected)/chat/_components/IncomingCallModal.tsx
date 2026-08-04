'use client';

import { useState } from 'react';
import { Avatar, Button, Modal, Typography } from 'antd';
import { CloseOutlined, PhoneOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useCallStore } from '@/store/useCallStore';
import { useCallContext } from '@/providers/CallProvider';
import { colorForId, initialOf } from '@/lib/avatar';

const { Title, Text } = Typography;

export default function IncomingCallModal() {
  const call = useCallStore((s) => s.call);
  const { acceptCall, declineCall } = useCallContext();
  const [accepting, setAccepting] = useState(false);

  if (!call) return null;

  const caller = call.initiatorId;
  const isVideo = call.type === 'video';

  const handleAccept = async () => {
    setAccepting(true);
    await acceptCall();
    setAccepting(false);
  };

  return (
    <Modal
      open
      closable={false}
      maskClosable={false}
      footer={null}
      centered
      width={340}
      onCancel={declineCall}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '12px 0',
        }}
      >
        <Avatar
          size={88}
          src={caller.avatar || undefined}
          style={{ backgroundColor: colorForId(caller._id) }}
        >
          {initialOf(caller.username)}
        </Avatar>
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            {caller.username}
          </Title>
          <Text type="secondary">
            {isVideo ? 'Cuộc gọi video đến...' : 'Cuộc gọi thoại đến...'}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
          <Button
            shape="circle"
            size="large"
            danger
            icon={<CloseOutlined />}
            onClick={declineCall}
            disabled={accepting}
          />
          <Button
            shape="circle"
            size="large"
            type="primary"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            icon={isVideo ? <VideoCameraOutlined /> : <PhoneOutlined />}
            loading={accepting}
            onClick={handleAccept}
          />
        </div>
      </div>
    </Modal>
  );
}
