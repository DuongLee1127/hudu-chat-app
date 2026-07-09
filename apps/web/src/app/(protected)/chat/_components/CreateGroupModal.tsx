'use client';

import { useState } from 'react';
import { Avatar, Checkbox, Empty, Flex, Input, Modal, Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { colorForId, initialOf } from '@/lib/avatar';

const { Text } = Typography;

/**
 * MOCK UI ONLY — danh sách liên hệ tĩnh, chưa nối API POST /api/conversations/group.
 */
const MOCK_CONTACTS = [
  { _id: 'mock-user-1', username: 'Nguyễn Văn A', avatar: '' },
  { _id: 'mock-user-2', username: 'Trần Thị B', avatar: '' },
  { _id: 'mock-user-3', username: 'Lê Văn C', avatar: '' },
  { _id: 'mock-user-4', username: 'Phạm Thị D', avatar: '' },
];

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateGroupModal = ({ open, onClose }: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedIds([]);
    onClose();
  };

  return (
    <Modal
      title="Tạo nhóm chat"
      open={open}
      onCancel={handleClose}
      onOk={handleClose}
      okText="Tạo nhóm"
      cancelText="Hủy"
      okButtonProps={{ disabled: !groupName.trim() || selectedIds.length === 0 }}
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
          <div style={{ marginTop: 8, maxHeight: 260, overflowY: 'auto' }}>
            {MOCK_CONTACTS.length === 0 ? (
              <Empty description="Không có liên hệ nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              MOCK_CONTACTS.map((contact) => (
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
              ))
            )}
          </div>
        </div>
      </Flex>
    </Modal>
  );
};

export default CreateGroupModal;
