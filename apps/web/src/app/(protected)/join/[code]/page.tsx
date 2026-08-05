'use client';

import { useParams, useRouter } from 'next/navigation';
import { Avatar, Button, Flex, Result, Skeleton, Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import type { AxiosError } from 'axios';

import { useInvitePreview, useJoinByInviteCode } from '@/hook/useConversations';
import { colorForId, initialOf } from '@/lib/avatar';
import { notify } from '@/lib/notify';
import { useChatStore } from '@/store/useChatStore';
import type { ApiResponse } from '@/types/api';

const { Title, Text } = Typography;

const JoinByInvitePage = () => {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code;
  const setSelectedConversationId = useChatStore((s) => s.setSelectedConversationId);

  const { data, isLoading, isError } = useInvitePreview(code);
  const joinMutation = useJoinByInviteCode();

  const preview = data?.data;

  const handleJoin = () => {
    joinMutation.mutate(code, {
      onSuccess: (res) => {
        notify.success('Đã tham gia nhóm!');
        setSelectedConversationId(res.data.conversation._id);
        router.push('/chat');
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        notify.error(axiosErr.response?.data?.message || 'Tham gia nhóm thất bại!');
      },
    });
  };

  return (
    <Flex align="center" justify="center" style={{ height: '100vh', padding: 16 }}>
      {isLoading && <Skeleton active avatar paragraph={{ rows: 2 }} style={{ maxWidth: 360 }} />}

      {!isLoading && (isError || !preview) && (
        <Result
          status="404"
          title="Mã mời không hợp lệ"
          subTitle="Liên kết mời đã hết hạn hoặc không tồn tại."
          extra={<Button onClick={() => router.push('/chat')}>Về trang chat</Button>}
        />
      )}

      {!isLoading && preview && (
        <Flex vertical align="center" gap={16} style={{ maxWidth: 360, textAlign: 'center' }}>
          <Avatar
            size={72}
            src={preview.avatar || undefined}
            icon={!preview.avatar && !preview.name ? <TeamOutlined /> : undefined}
            style={{ backgroundColor: colorForId(preview._id) }}
          >
            {preview.name ? initialOf(preview.name) : undefined}
          </Avatar>
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>
              {preview.name || 'Nhóm chat'}
            </Title>
            <Text type="secondary">{preview.memberCount} thành viên</Text>
          </div>
          <Button type="primary" size="large" loading={joinMutation.isPending} onClick={handleJoin}>
            Tham gia nhóm
          </Button>
        </Flex>
      )}
    </Flex>
  );
};

export default JoinByInvitePage;
