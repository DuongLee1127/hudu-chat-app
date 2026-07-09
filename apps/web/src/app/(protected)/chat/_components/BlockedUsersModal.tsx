'use client';

import { Avatar, Button, Empty, List, Modal, Skeleton, Typography, App } from 'antd';
import type { AxiosError } from 'axios';

import { useGetListBlockUser, useUnBlockUser } from '@/hook/useUser';
import type { ApiResponse } from '@/types/api';
import { colorForId, initialOf } from '@/lib/avatar';

const { Text } = Typography;

interface BlockedUsersModalProps {
  open: boolean;
  onClose: () => void;
}

const BlockedUsersModal = ({ open, onClose }: BlockedUsersModalProps) => {
  const { message } = App.useApp();
  const { data, isLoading } = useGetListBlockUser({ page: 1, pageSize: 50 });
  const unblockMutation = useUnBlockUser();

  const blockedUsers = data?.data.items ?? [];

  const handleUnblock = (userId: string) => {
    unblockMutation.mutate(userId, {
      onSuccess: () => message.success('Đã bỏ chặn người dùng!'),
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        message.error(axiosErr.response?.data?.message || 'Bỏ chặn thất bại!');
      },
    });
  };

  return (
    <Modal title="Người dùng đã chặn" open={open} onCancel={onClose} footer={null} width={440}>
      {isLoading && <Skeleton avatar paragraph={{ rows: 1 }} active />}

      {!isLoading && blockedUsers.length === 0 && (
        <Empty description="Bạn chưa chặn người dùng nào" />
      )}

      {!isLoading && blockedUsers.length > 0 && (
        <List
          dataSource={blockedUsers}
          renderItem={(user) => (
            <List.Item
              actions={[
                <Button
                  key="unblock"
                  size="small"
                  loading={unblockMutation.isPending}
                  onClick={() => handleUnblock(user._id)}
                >
                  Bỏ chặn
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={user.avatar || undefined}
                    style={{ backgroundColor: colorForId(user._id) }}
                  >
                    {initialOf(user.username)}
                  </Avatar>
                }
                title={user.username}
                description={<Text type="secondary">{user.email}</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
};

export default BlockedUsersModal;
