'use client';

import { useState } from 'react';
import { Avatar, Badge, Typography } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';

import { useStoryFeed } from '@/hook/useStories';
import { colorForId, initialOf } from '@/lib/avatar';
import type { User } from '@/types/user';
import CreateStoryModal from './CreateStoryModal';
import StoryViewerModal from './StoryViewerModal';

const { Text } = Typography;

interface StoryBarProps {
  currentUser?: User;
}

const StoryBar = ({ currentUser }: StoryBarProps) => {
  const { data } = useStoryFeed();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const feed = data?.data.feed ?? [];
  const ownGroup = feed.find((g) => g.userId === currentUser?._id);
  const friendGroups = feed.filter((g) => g.userId !== currentUser?._id);

  return (
    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '12px 16px 4px' }}>
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
        onClick={() => (ownGroup ? setViewingUserId(currentUser!._id) : setCreateOpen(true))}
      >
        <Badge
          count={
            <div
              onClick={(e) => {
                e.stopPropagation();
                setCreateOpen(true);
              }}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#5b5bf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                border: '2px solid #fff',
                cursor: 'pointer',
              }}
            >
              <PlusOutlined style={{ fontSize: 10 }} />
            </div>
          }
          offset={[-4, 40]}
        >
          <Avatar
            size={52}
            icon={<UserOutlined />}
            src={currentUser?.avatar || undefined}
            style={{
              backgroundColor: colorForId(currentUser?._id || 'me'),
              border: ownGroup?.hasUnviewed ? '2px solid #5b5bf6' : '2px solid transparent',
            }}
          >
            {currentUser ? initialOf(currentUser.username) : undefined}
          </Avatar>
        </Badge>
        <Text style={{ fontSize: 11 }}>Story của bạn</Text>
      </div>

      {friendGroups.map((group) => (
        <div
          key={group.userId}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
          onClick={() => setViewingUserId(group.userId)}
        >
          <Avatar
            size={52}
            src={group.user.avatar || undefined}
            style={{
              backgroundColor: colorForId(group.userId),
              border: group.hasUnviewed ? '2px solid #5b5bf6' : '2px solid #d9d9e3',
            }}
          >
            {initialOf(group.user.username)}
          </Avatar>
          <Text style={{ fontSize: 11, maxWidth: 60 }} ellipsis>
            {group.user.username}
          </Text>
        </div>
      ))}

      <CreateStoryModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <StoryViewerModal
        open={!!viewingUserId}
        onClose={() => setViewingUserId(null)}
        userId={viewingUserId || ''}
        currentUserId={currentUser?._id}
      />
    </div>
  );
};

export default StoryBar;
