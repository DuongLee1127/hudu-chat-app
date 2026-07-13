'use client';

import { Avatar, Button, Empty, Flex, Modal, Skeleton, Typography } from 'antd';
import type { AxiosError } from 'axios';

import { useGetListBlockUser, useUnBlockUser } from '@/hook/useUser';
import { colorForId, initialOf } from '@/lib/avatar';
import { useIsMobile } from '@/hook/useMediaQuery';
import { notify } from '@/lib/notify';
import type { ApiResponse } from '@/types/api';

const { Text } = Typography;

interface BlockedUsersModalProps {
  open: boolean;
  onClose: () => void;
}

const BlockedUsersModal = ({ open, onClose }: BlockedUsersModalProps) => {
  const isMobile = useIsMobile();
  const { data, isLoading } = useGetListBlockUser({ page: 1, pageSize: 50 });
  const unblockMutation = useUnBlockUser();

  const blockedUsers = data?.data.items ?? [];

  const handleUnblock = (userId: string) => {
    unblockMutation.mutate(userId, {
      onSuccess: () => notify.success('Đã bỏ chặn người dùng!'),
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        notify.error(axiosErr.response?.data?.message || 'Bỏ chặn thất bại!');
      },
    });
  };

  return (
    <Modal
      title="Người dùng đã chặn"
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '92%' : 440}
    >
      {isLoading && <Skeleton avatar paragraph={{ rows: 1 }} active />}

      {!isLoading && blockedUsers.length === 0 && (
        <Empty description="Bạn chưa chặn người dùng nào" />
      )}

      {!isLoading &&
        blockedUsers.map((user) => (
          <Flex key={user._id} align="center" gap={10} style={{ padding: '8px 4px' }}>
            <Avatar
              src={user.avatar || undefined}
              style={{ backgroundColor: colorForId(user._id) }}
            >
              {initialOf(user.username)}
            </Avatar>
            <Flex vertical flex={1} style={{ minWidth: 0 }}>
              <Text strong ellipsis>
                {user.username}
              </Text>
              <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                {user.email}
              </Text>
            </Flex>
            <Button
              size="small"
              loading={unblockMutation.isPending}
              onClick={() => handleUnblock(user._id)}
            >
              Bỏ chặn
            </Button>
          </Flex>
        ))}
    </Modal>
  );
};

export default BlockedUsersModal;
