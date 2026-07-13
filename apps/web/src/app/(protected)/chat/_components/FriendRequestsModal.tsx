'use client';

import { Avatar, Button, Empty, Flex, Modal, Skeleton, Typography } from 'antd';
import type { AxiosError } from 'axios';

import {
  useIncomingFriendRequests,
  useOutgoingFriendRequests,
  useAcceptFriendRequest,
  useCancelFriendRequest,
} from '@/hook/useFriend';
import { notify } from '@/lib/notify';
import { colorForId, initialOf } from '@/lib/avatar';
import { useIsMobile } from '@/hook/useMediaQuery';
import type { FriendRequestItem } from '@/types/user';
import type { ApiResponse } from '@/types/api';

const { Text, Title } = Typography;

interface FriendRequestsModalProps {
  open: boolean;
  onClose: () => void;
}

const FriendRequestsModal = ({ open, onClose }: FriendRequestsModalProps) => {
  const isMobile = useIsMobile();

  const { data: incomingData, isLoading: incomingLoading } = useIncomingFriendRequests();
  const { data: outgoingData, isLoading: outgoingLoading } = useOutgoingFriendRequests();

  const incomingRequests = incomingData?.data ?? [];
  const outgoingRequests = outgoingData?.data ?? [];

  const acceptMutation = useAcceptFriendRequest();
  const cancelMutation = useCancelFriendRequest();

  const handleError = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<ApiResponse<null>>;
    notify.error(axiosErr.response?.data?.message || fallback);
  };

  const handleAccept = (userId: string) => {
    acceptMutation.mutate(userId, {
      onSuccess: () => notify.success('Đã chấp nhận lời mời kết bạn!'),
      onError: (err) => handleError(err, 'Chấp nhận lời mời thất bại!'),
    });
  };

  const handleReject = (userId: string) => {
    cancelMutation.mutate(userId, {
      onSuccess: () => notify.success('Đã từ chối lời mời kết bạn!'),
      onError: (err) => handleError(err, 'Từ chối lời mời thất bại!'),
    });
  };

  const handleCancelOutgoing = (userId: string) => {
    cancelMutation.mutate(userId, {
      onSuccess: () => notify.success('Đã hủy lời mời kết bạn!'),
      onError: (err) => handleError(err, 'Hủy lời mời thất bại!'),
    });
  };

  const renderRow = (request: FriendRequestItem, actions: React.ReactNode) => (
    <Flex key={request._id} align="center" gap={10} style={{ padding: '8px 4px' }}>
      <Avatar
        src={request.user.avatar || undefined}
        style={{ backgroundColor: colorForId(request.user._id) }}
      >
        {initialOf(request.user.username)}
      </Avatar>
      <Flex vertical flex={1} style={{ minWidth: 0 }}>
        <Text strong ellipsis>
          {request.user.username}
        </Text>
        <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
          {request.user.email}
        </Text>
      </Flex>
      {actions}
    </Flex>
  );

  return (
    <Modal
      title="Lời mời kết bạn"
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '92%' : 480}
    >
      <Title level={5} style={{ marginTop: 0 }}>
        Đã nhận
      </Title>
      {incomingLoading && <Skeleton avatar paragraph={{ rows: 1 }} active />}
      {!incomingLoading && incomingRequests.length === 0 && (
        <Empty description="Không có lời mời nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      {!incomingLoading &&
        incomingRequests.map((request) =>
          renderRow(
            request,
            <Flex gap={8}>
              <Button
                type="primary"
                size="small"
                loading={acceptMutation.isPending}
                onClick={() => handleAccept(request.user._id)}
              >
                Chấp nhận
              </Button>
              <Button
                size="small"
                loading={cancelMutation.isPending}
                onClick={() => handleReject(request.user._id)}
              >
                Từ chối
              </Button>
            </Flex>,
          ),
        )}

      <Title level={5}>Đã gửi</Title>
      {outgoingLoading && <Skeleton avatar paragraph={{ rows: 1 }} active />}
      {!outgoingLoading && outgoingRequests.length === 0 && (
        <Empty description="Bạn chưa gửi lời mời nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      {!outgoingLoading &&
        outgoingRequests.map((request) =>
          renderRow(
            request,
            <Button
              size="small"
              loading={cancelMutation.isPending}
              onClick={() => handleCancelOutgoing(request.user._id)}
            >
              Hủy
            </Button>,
          ),
        )}
    </Modal>
  );
};

export default FriendRequestsModal;
