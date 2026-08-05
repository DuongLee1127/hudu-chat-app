'use client';

import { useState } from 'react';
import { Button, Input, Modal, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import type { AxiosError } from 'axios';

import { useCreateStory } from '@/hook/useStories';
import { notify } from '@/lib/notify';
import type { ApiResponse } from '@/types/api';

const { TextArea } = Input;

interface CreateStoryModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateStoryModal = ({ open, onClose }: CreateStoryModalProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [caption, setCaption] = useState('');

  const createStoryMutation = useCreateStory();

  const handleChange: UploadProps['onChange'] = ({ fileList: newList }) => {
    setFileList(newList.slice(-1));
  };

  const handleClose = () => {
    setFileList([]);
    setCaption('');
    onClose();
  };

  const handleSubmit = () => {
    const file = fileList[0]?.originFileObj;
    if (!file) {
      notify.error('Vui lòng chọn một ảnh!');
      return;
    }

    createStoryMutation.mutate(
      { file, caption: caption.trim() || undefined },
      {
        onSuccess: () => {
          notify.success('Đã đăng story!');
          handleClose();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Đăng story thất bại!');
        },
      },
    );
  };

  return (
    <Modal
      title="Đăng story"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={360}
    >
      <Upload
        listType="picture-card"
        fileList={fileList}
        beforeUpload={() => false}
        onChange={handleChange}
        maxCount={1}
        accept="image/png,image/jpeg,image/webp,image/gif"
      >
        {fileList.length === 0 && (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Chọn ảnh</div>
          </div>
        )}
      </Upload>

      <TextArea
        placeholder="Thêm chú thích (tuỳ chọn)..."
        maxLength={200}
        showCount
        rows={2}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ marginTop: 12 }}
      />

      <Button
        type="primary"
        block
        style={{ marginTop: 16 }}
        loading={createStoryMutation.isPending}
        onClick={handleSubmit}
      >
        Đăng story
      </Button>
    </Modal>
  );
};

export default CreateStoryModal;
