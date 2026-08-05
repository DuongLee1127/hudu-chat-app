'use client';

import { useEffect, useState } from 'react';
import { App, Avatar, Button, Empty, Flex, Input, Modal, Skeleton, Tag, Typography } from 'antd';
import {
  SearchOutlined,
  UserDeleteOutlined,
  UserAddOutlined,
  CopyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import type { AxiosError } from 'axios';

import { notify } from '@/lib/notify';
import { colorForId, initialOf } from '@/lib/avatar';
import { useFriends } from '@/hook/useFriend';
import { useDebouncedValue } from '@/hook/useDebouncedValue';
import { useIsMobile } from '@/hook/useMediaQuery';
import {
  useUpdateConversation,
  useAddMembers,
  useRemoveMember,
  useGenerateInviteCode,
} from '@/hook/useConversations';
import type { ConversationMember } from '@/types/conversation';
import type { ApiResponse } from '@/types/api';

const { Text } = Typography;

interface GroupSettingsModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  conversationName?: string;
  inviteCode?: string;
  members: ConversationMember[];
  currentUserId?: string;
}

const GroupSettingsModal = ({
  open,
  onClose,
  conversationId,
  conversationName,
  inviteCode,
  members,
  currentUserId,
}: GroupSettingsModalProps) => {
  const { modal } = App.useApp();
  const isMobile = useIsMobile();

  const [name, setName] = useState(conversationName || '');
  const [memberQuery, setMemberQuery] = useState('');
  const debouncedQuery = useDebouncedValue(memberQuery, 350);

  useEffect(() => {
    if (open) setName(conversationName || '');
  }, [open, conversationName]);

  const { data: searchData, isLoading: searchLoading } = useFriends({
    q: debouncedQuery,
    page: 1,
    pageSize: 30,
  });

  const memberIds = new Set(members.map((m) => m.userId._id));
  const searchResults = (searchData?.data.items ?? []).filter((u) => !memberIds.has(u._id));

  const currentMembership = members.find((m) => m.userId._id === currentUserId);
  const isAdmin = currentMembership?.role === 'admin';

  const updateMutation = useUpdateConversation(conversationId);
  const addMembersMutation = useAddMembers(conversationId);
  const removeMemberMutation = useRemoveMember(conversationId);
  const generateInviteCodeMutation = useGenerateInviteCode(conversationId);

  const inviteLink =
    inviteCode && typeof window !== 'undefined' ? `${window.location.origin}/join/${inviteCode}` : '';

  const handleApiError = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<ApiResponse<null>>;
    notify.error(axiosErr.response?.data?.message || fallback);
  };

  const handleSaveName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === conversationName) return;
    updateMutation.mutate(
      { name: trimmed },
      {
        onSuccess: () => notify.success('Đã cập nhật tên nhóm!'),
        onError: (err) => handleApiError(err, 'Cập nhật tên nhóm thất bại!'),
      },
    );
  };

  const handleAddMember = (userId: string) => {
    addMembersMutation.mutate([userId], {
      onSuccess: () => {
        notify.success('Đã thêm thành viên!');
        setMemberQuery('');
      },
      onError: (err) => handleApiError(err, 'Thêm thành viên thất bại!'),
    });
  };

  const handleGenerateInviteCode = () => {
    generateInviteCodeMutation.mutate(undefined, {
      onSuccess: () => notify.success('Đã tạo mã mời mới!'),
      onError: (err) => handleApiError(err, 'Tạo mã mời thất bại!'),
    });
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    notify.success('Đã sao chép liên kết mời!');
  };

  const handleRemoveMember = (member: ConversationMember) => {
    modal.confirm({
      title: 'Xóa thành viên',
      content: `Bạn có chắc chắn muốn xóa "${member.userId.username}" khỏi nhóm?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => {
        removeMemberMutation.mutate(member.userId._id, {
          onSuccess: () => notify.success('Đã xóa thành viên!'),
          onError: (err) => handleApiError(err, 'Xóa thành viên thất bại!'),
        });
      },
    });
  };

  return (
    <Modal
      title="Quản lý nhóm"
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '92%' : 480}
    >
      <div style={{ marginBottom: 20 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Tên nhóm
        </Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Input
            value={name}
            disabled={!isAdmin}
            onChange={(e) => setName(e.target.value)}
            onPressEnter={handleSaveName}
          />
          {isAdmin && (
            <Button
              type="primary"
              loading={updateMutation.isPending}
              disabled={!name.trim() || name.trim() === conversationName}
              onClick={handleSaveName}
            >
              Lưu
            </Button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Thành viên ({members.length})
        </Text>
        <div style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto' }}>
          {members.map((member) => (
            <Flex key={member._id} align="center" gap={10} style={{ padding: '6px 4px' }}>
              <Avatar
                size={36}
                src={member.userId.avatar || undefined}
                style={{ backgroundColor: colorForId(member.userId._id) }}
              >
                {initialOf(member.userId.username)}
              </Avatar>
              <Flex vertical flex={1} style={{ minWidth: 0 }}>
                <Text ellipsis>
                  {member.userId.username}
                  {member.userId._id === currentUserId && ' (Bạn)'}
                </Text>
                {member.role === 'admin' && <Tag color="blue">Quản trị viên</Tag>}
              </Flex>
              {isAdmin && member.userId._id !== currentUserId && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<UserDeleteOutlined />}
                  loading={
                    removeMemberMutation.isPending &&
                    removeMemberMutation.variables === member.userId._id
                  }
                  onClick={() => handleRemoveMember(member)}
                />
              )}
            </Flex>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Mời qua QR / liên kết
          </Text>
          <Flex vertical align="center" gap={10} style={{ marginTop: 8 }}>
            {inviteCode ? (
              <>
                <div style={{ padding: 8, background: '#fff', borderRadius: 8 }}>
                  <QRCodeSVG value={inviteLink} size={160} />
                </div>
                <Flex gap={8} style={{ width: '100%' }}>
                  <Input value={inviteLink} readOnly />
                  <Button icon={<CopyOutlined />} onClick={handleCopyInviteLink} />
                  <Button
                    icon={<ReloadOutlined />}
                    loading={generateInviteCodeMutation.isPending}
                    onClick={handleGenerateInviteCode}
                  />
                </Flex>
              </>
            ) : (
              <Button
                loading={generateInviteCodeMutation.isPending}
                onClick={handleGenerateInviteCode}
              >
                Tạo mã mời
              </Button>
            )}
          </Flex>
        </div>
      )}

      {isAdmin && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Thêm thành viên
          </Text>
          <Input
            prefix={<SearchOutlined style={{ color: '#9a9ab0' }} />}
            placeholder="Tìm kiếm người dùng..."
            variant="filled"
            allowClear
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
            style={{ marginTop: 4, marginBottom: 8 }}
          />
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {searchLoading && <Skeleton avatar paragraph={{ rows: 1 }} active />}
            {!searchLoading && debouncedQuery && searchResults.length === 0 && (
              <Empty
                description="Không tìm thấy bạn bè nào phù hợp"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
            {!searchLoading &&
              searchResults.map((user) => (
                <div
                  key={user._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 4px',
                  }}
                >
                  <Avatar
                    size={32}
                    src={user.avatar || undefined}
                    style={{ backgroundColor: colorForId(user._id) }}
                  >
                    {initialOf(user.username)}
                  </Avatar>
                  <Text style={{ flex: 1 }}>{user.username}</Text>
                  <Button
                    type="text"
                    icon={<UserAddOutlined />}
                    loading={
                      addMembersMutation.isPending && addMembersMutation.variables?.[0] === user._id
                    }
                    onClick={() => handleAddMember(user._id)}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default GroupSettingsModal;
