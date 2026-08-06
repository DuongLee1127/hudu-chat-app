'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, Modal, Popover, Skeleton, Typography } from 'antd';
import { CloseOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

import { useUserStories, useDeleteStory, useStoryViewers } from '@/hook/useStories';
import { colorForId, initialOf } from '@/lib/avatar';
import { notify } from '@/lib/notify';

const { Text } = Typography;

const STORY_DURATION_MS = 5000;

interface StoryViewerModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentUserId?: string;
}

const StoryViewerModal = ({ open, onClose, userId, currentUserId }: StoryViewerModalProps) => {
  const [index, setIndex] = useState(0);
  const queryClient = useQueryClient();
  const { data, isLoading } = useUserStories(open ? userId : '');
  const deleteStoryMutation = useDeleteStory();

  const stories = useMemo(() => data?.data.stories ?? [], [data]);
  const activeStory = stories[index];
  const isOwn = currentUserId === userId;

  useEffect(() => {
    // Viewing marks the story as watched server-side (see storyService.getStoriesByUser),
    // so the "unviewed" ring on StoryBar needs a refetch to reflect it without a page reload.
    if (data && !isOwn) {
      queryClient.invalidateQueries({ queryKey: ['stories', 'feed'] });
    }
  }, [data, isOwn, queryClient]);

  const { data: viewersData } = useStoryViewers(activeStory?._id ?? '', isOwn && open);
  const viewers = viewersData?.data.viewers ?? [];

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, userId]);

  useEffect(() => {
    if (!open || stories.length === 0) return;
    const timer = setTimeout(() => {
      if (index < stories.length - 1) {
        setIndex((i) => i + 1);
      } else {
        onClose();
      }
    }, STORY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [open, index, stories.length, onClose]);

  const handleDelete = () => {
    if (!activeStory) return;
    deleteStoryMutation.mutate(activeStory._id, {
      onSuccess: () => {
        notify.success('Đã xoá story!');
        if (stories.length <= 1) onClose();
        else setIndex((i) => Math.max(0, i - 1));
      },
      onError: () => notify.error('Xoá story thất bại!'),
    });
  };

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => (index < stories.length - 1 ? setIndex((i) => i + 1) : onClose());

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={400}
      styles={{ body: { padding: 0, background: '#000', borderRadius: 12, overflow: 'hidden' } }}
    >
      <div style={{ position: 'relative', height: 640, background: '#000' }}>
        <div style={{ display: 'flex', gap: 4, padding: '8px 8px 0' }}>
          {stories.map((s, i) => (
            <div
              key={s._id}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i < index ? '#fff' : 'rgba(255,255,255,0.35)',
                overflow: 'hidden',
              }}
            >
              {i === index && (
                <div
                  style={{
                    height: '100%',
                    width: '100%',
                    background: '#fff',
                    animation: `story-progress ${STORY_DURATION_MS}ms linear forwards`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <style>{`@keyframes story-progress { from { width: 0% } to { width: 100% } }`}</style>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={32} style={{ backgroundColor: colorForId(userId) }}>
              {initialOf(userId)}
            </Avatar>
            <Text style={{ color: '#fff', fontSize: 13 }}>
              {activeStory?.caption ? activeStory.caption : ' '}
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isOwn && activeStory && (
              <>
                <Popover
                  trigger="click"
                  content={
                    <div style={{ maxWidth: 220 }}>
                      {viewers.length === 0 && <Text type="secondary">Chưa có lượt xem</Text>}
                      {viewers.map((v) => (
                        <div
                          key={v._id}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}
                        >
                          <Avatar size={24} src={v.avatar || undefined}>
                            {initialOf(v.username)}
                          </Avatar>
                          <Text style={{ fontSize: 13 }}>{v.username}</Text>
                        </div>
                      ))}
                    </div>
                  }
                >
                  <button type="button" style={iconButtonStyle}>
                    <EyeOutlined /> {activeStory.viewerIds.length}
                  </button>
                </Popover>
                <button type="button" style={iconButtonStyle} onClick={handleDelete}>
                  <DeleteOutlined />
                </button>
              </>
            )}
            <button type="button" style={iconButtonStyle} onClick={onClose}>
              <CloseOutlined />
            </button>
          </div>
        </div>

        {isLoading && (
          <div style={{ padding: 24 }}>
            <Skeleton.Image active style={{ width: '100%', height: 500 }} />
          </div>
        )}

        {!isLoading && activeStory && (
          <div
            style={{
              position: 'relative',
              height: 560,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeStory.attachmentId.url}
              alt="story"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
            <div
              onClick={goPrev}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%', cursor: 'pointer' }}
            />
            <div
              onClick={goNext}
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

const iconButtonStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)',
  border: 'none',
  color: '#fff',
  borderRadius: 16,
  padding: '4px 10px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 13,
};

export default StoryViewerModal;
