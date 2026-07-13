'use client';

import { useMemo, useState } from 'react';
import { App, Avatar, Button, Empty, Flex, Input, Modal, Skeleton, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { AxiosError } from 'axios';
import { colorForId, initialOf } from '@/lib/avatar';
import { useSearchUsers } from '@/hook/useUser';
import {
  useFriends,
  useIncomingFriendRequests,
  useOutgoingFriendRequests,
  useSendFriendRequest,
  useCancelFriendRequest,
  useAcceptFriendRequest,
} from '@/hook/useFriend';
import { useDebouncedValue } from '@/hook/useDebouncedValue';
import { useIsMobile } from '@/hook/useMediaQuery';
import { notify } from '@/lib/notify';
import type { ApiResponse } from '@/types/api';

const { Text } = Typography;

interface AddFriendModalProps {
  open: boolean;
  onClose: () => void;
}

const AddFriendModal = ({ open, onClose }: AddFriendModalProps) => {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);

  const { data: searchData, isLoading } = useSearchUsers({
    q: debouncedQuery,
    page: 1,
    pageSize: 30,
  });
  const results = searchData?.data.items ?? [];

  const { data: friendsData } = useFriends({ pageSize: 200 });
  const { data: incomingData } = useIncomingFriendRequests();
  const { data: outgoingData } = useOutgoingFriendRequests();

  const friendIds = useMemo(
    () => new Set((friendsData?.data.items ?? []).map((u) => u._id)),
    [friendsData],
  );
  const incomingIds = useMemo(
    () => new Set((incomingData?.data ?? []).map((r) => r.user._id)),
    [incomingData],
  );
  const outgoingIds = useMemo(
    () => new Set((outgoingData?.data ?? []).map((r) => r.user._id)),
    [outgoingData],
  );

  const sendMutation = useSendFriendRequest();
  const cancelMutation = useCancelFriendRequest();
  const acceptMutation = useAcceptFriendRequest();

  const handleError = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<ApiResponse<null>>;
    notify.error(axiosErr.response?.data?.message || fallback);
  };

  const handleSend = (userId: string) => {
    sendMutation.mutate(userId, {
      onSuccess: () => notify.success('Đã gửi lời mời kết bạn!'),
      onError: (err) => handleError(err, 'Gửi lời mời kết bạn thất bại!'),
    });
  };

  const handleCancel = (userId: string) => {
    cancelMutation.mutate(userId, {
      onSuccess: () => notify.success('Đã hủy lời mời kết bạn!'),
      onError: (err) => handleError(err, 'Hủy lời mời thất bại!'),
    });
  };

  const handleAccept = (userId: string) => {
    acceptMutation.mutate(userId, {
      onSuccess: () => notify.success('Đã chấp nhận lời mời kết bạn!'),
      onError: (err) => handleError(err, 'Chấp nhận lời mời thất bại!'),
    });
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal
      title="Thêm bạn"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={isMobile ? '92%' : 480}
    >
      <Input
        prefix={<SearchOutlined style={{ color: '#9a9ab0' }} />}
        placeholder="Tìm kiếm theo tên hoặc email..."
        variant="filled"
        allowClear
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {isLoading && (
          <>
            <Skeleton avatar paragraph={{ rows: 1 }} active />
            <Skeleton avatar paragraph={{ rows: 1 }} active style={{ marginTop: 12 }} />
          </>
        )}

        {!isLoading && results.length === 0 && (
          <Empty description="Không tìm thấy người dùng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}

        {!isLoading &&
          results.map((user) => (
            <div key={user._id} style={{ padding: '8px 4px' }}>
              <Flex align="center" gap={10}>
                <Avatar
                  size={40}
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

                {friendIds.has(user._id) && <Tag>Bạn bè</Tag>}

                {!friendIds.has(user._id) && outgoingIds.has(user._id) && (
                  <Button
                    size="small"
                    loading={cancelMutation.isPending}
                    onClick={() => handleCancel(user._id)}
                  >
                    Hủy lời mời
                  </Button>
                )}

                {!friendIds.has(user._id) && incomingIds.has(user._id) && (
                  <Button
                    type="primary"
                    size="small"
                    loading={acceptMutation.isPending}
                    onClick={() => handleAccept(user._id)}
                  >
                    Chấp nhận
                  </Button>
                )}

                {!friendIds.has(user._id) &&
                  !outgoingIds.has(user._id) &&
                  !incomingIds.has(user._id) && (
                    <Button
                      size="small"
                      loading={sendMutation.isPending}
                      onClick={() => handleSend(user._id)}
                    >
                      Kết bạn
                    </Button>
                  )}
              </Flex>
            </div>
          ))}
      </div>
    </Modal>
  );
};

export default AddFriendModal;
