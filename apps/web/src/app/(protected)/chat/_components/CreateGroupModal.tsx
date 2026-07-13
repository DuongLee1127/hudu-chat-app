'use client';

import { useState } from 'react';
import { Avatar, Checkbox, Empty, Flex, Input, Modal, Skeleton, Typography } from 'antd';
import { TeamOutlined, SearchOutlined } from '@ant-design/icons';
import type { AxiosError } from 'axios';

import { notify } from '@/lib/notify';
import { colorForId, initialOf } from '@/lib/avatar';
import { useFriends } from '@/hook/useFriend';
import { useCreateGroupConversation } from '@/hook/useConversations';
import { useDebouncedValue } from '@/hook/useDebouncedValue';
import { useIsMobile } from '@/hook/useMediaQuery';
import type { ApiResponse } from '@/types/api';

const { Text } = Typography;

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (conversationId: string) => void;
}

const CreateGroupModal = ({ open, onClose, onCreated }: CreateGroupModalProps) => {
  const isMobile = useIsMobile();
  const [groupName, setGroupName] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const debouncedQuery = useDebouncedValue(memberQuery, 350);
  const { data, isLoading } = useFriends({ q: debouncedQuery, page: 1, pageSize: 30 });
  const contacts = data?.data.items ?? [];

  const createGroupMutation = useCreateGroupConversation();

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const resetState = () => {
    setGroupName('');
    setMemberQuery('');
    setSelectedIds([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCreate = () => {
    createGroupMutation.mutate(
      { name: groupName.trim(), memberIds: selectedIds },
      {
        onSuccess: (res) => {
          notify.success('Đã tạo nhóm chat!');
          onCreated?.(res.data.conversation._id);
          resetState();
          onClose();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Tạo nhóm chat thất bại!');
        },
      },
    );
  };

  return (
    <Modal
      title="Tạo nhóm chat"
      open={open}
      onCancel={handleClose}
      onOk={handleCreate}
      okText="Tạo nhóm"
      cancelText="Hủy"
      confirmLoading={createGroupMutation.isPending}
      okButtonProps={{ disabled: !groupName.trim() || selectedIds.length === 0 }}
      width={isMobile ? '92%' : 520}
    >
      <Flex vertical gap={16}>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tên nhóm
          </Text>
          <Input
            prefix={<TeamOutlined style={{ color: '#9a9ab0' }} />}
            placeholder="Nhập tên nhóm..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Chọn thành viên
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
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {isLoading && (
              <>
                <Skeleton avatar paragraph={{ rows: 1 }} active />
                <Skeleton avatar paragraph={{ rows: 1 }} active style={{ marginTop: 12 }} />
              </>
            )}

            {!isLoading && contacts.length === 0 && (
              <Empty
                description={
                  memberQuery ? 'Không tìm thấy bạn bè nào phù hợp' : 'Bạn chưa có bạn bè nào'
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}

            {!isLoading &&
              contacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => toggleMember(contact._id)}
                  className={`px-2.5 py-2 mb-1 rounded-[10px] cursor-pointer ${selectedIds.includes(contact._id) ? 'bg-[#eef0ff]' : 'bg-transparent'}`}
                >
                  <Flex align="center" gap={10}>
                    <Checkbox checked={selectedIds.includes(contact._id)} />
                    <Avatar
                      size={36}
                      src={contact.avatar || undefined}
                      style={{ backgroundColor: colorForId(contact._id) }}
                    >
                      {initialOf(contact.username)}
                    </Avatar>
                    <Text>{contact.username}</Text>
                  </Flex>
                </div>
              ))}
          </div>
        </div>
      </Flex>
    </Modal>
  );
};

export default CreateGroupModal;
