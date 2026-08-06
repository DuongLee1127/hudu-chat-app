'use client';

import { useState } from 'react';
import { Button, Drawer, Empty, Image, Skeleton, Tabs, Typography } from 'antd';
import { FileOutlined } from '@ant-design/icons';

import { useConversationAttachments } from '@/hook/useAttachments';
import { useIsMobile } from '@/hook/useMediaQuery';
import type { AttachmentMediaType, MessageAttachment } from '@/types/message';

const { Text } = Typography;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface MediaCenterDrawerProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}

const MediaGrid = ({
  conversationId,
  type,
}: {
  conversationId: string;
  type: AttachmentMediaType;
}) => {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useConversationAttachments(conversationId, type);

  const items: MessageAttachment[] = data?.pages.flatMap((page) => page.data.items) ?? [];

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (items.length === 0) {
    return <Empty description="Chưa có nội dung nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  if (type === 'file') {
    return (
      <div>
        {items.map((attachment) => (
          <a
            key={attachment._id}
            href={attachment.url}
            download={attachment.fileName}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 4px',
              color: 'inherit',
            }}
          >
            <FileOutlined style={{ fontSize: 20, flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text ellipsis style={{ display: 'block' }}>
                {attachment.fileName}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatFileSize(attachment.size)}
              </Text>
            </div>
          </a>
        ))}
        {hasNextPage && (
          <Button block loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
            Tải thêm
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <Image.PreviewGroup>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {items.map((attachment) => (
            <Image
              key={attachment._id}
              src={attachment.thumbnailUrl || attachment.url}
              preview={{ src: attachment.url }}
              alt={attachment.fileName}
              style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }}
            />
          ))}
        </div>
      </Image.PreviewGroup>
      {hasNextPage && (
        <Button
          block
          style={{ marginTop: 12 }}
          loading={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          Tải thêm
        </Button>
      )}
    </div>
  );
};

const MediaCenterDrawer = ({ open, onClose, conversationId }: MediaCenterDrawerProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<AttachmentMediaType>('image');

  return (
    <Drawer title="Kho lưu trữ" open={open} onClose={onClose} size={isMobile ? '92%' : 400}>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as AttachmentMediaType)}
        items={[
          { key: 'image', label: 'Ảnh' },
          { key: 'video', label: 'Video' },
          { key: 'file', label: 'Tệp' },
        ]}
      />
      {open && <MediaGrid key={activeTab} conversationId={conversationId} type={activeTab} />}
    </Drawer>
  );
};

export default MediaCenterDrawer;
