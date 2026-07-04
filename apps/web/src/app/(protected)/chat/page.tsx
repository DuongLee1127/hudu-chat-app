'use client';

import { useState } from 'react';
import { Layout, Avatar, Input, Typography, Button, Badge, theme, Flex } from 'antd';
import {
  SendOutlined,
  SearchOutlined,
  MoreOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  UserOutlined,
  SmileOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

const ChatPage = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [message, setMessage] = useState('');

  const contacts = [
    {
      id: 1,
      name: 'Admin Hudu',
      lastMsg: 'Chào mừng bạn đến với Hudu Chat!',
      time: '10:30',
      online: true,
      unread: 2,
    },
    {
      id: 2,
      name: 'Frontend Dev',
      lastMsg: 'Đã cập nhật giao diện mới nhé',
      time: '09:15',
      online: true,
      unread: 0,
    },
    {
      id: 3,
      name: 'Backend Master',
      lastMsg: 'API đã sẵn sàng để tích hợp',
      time: 'Hôm qua',
      online: false,
      unread: 0,
    },
    {
      id: 4,
      name: 'Designer',
      lastMsg: 'Gửi mình bản mẫu thiết kế',
      time: '2 ngày trước',
      online: false,
      unread: 0,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'Admin Hudu',
      text: 'Chào mừng bạn đến với Hudu Chat!',
      time: '10:30',
      mine: false,
    },
    { id: 2, sender: 'You', text: 'Cảm ơn admin, giao diện đẹp quá!', time: '10:31', mine: true },
    {
      id: 3,
      sender: 'Admin Hudu',
      text: 'Cảm ơn bạn. Đây là bản mockup dùng Ant Design đấy.',
      time: '10:32',
      mine: false,
    },
    {
      id: 4,
      sender: 'You',
      text: 'Tuyệt vời. Mong chờ được tích hợp Socket.io.',
      time: '10:33',
      mine: true,
    },
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar - Danh sách hội thoại */}
      <Sider width={320} style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size="large" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div style={{ flex: 1 }}>
            <Title level={5} style={{ margin: 0 }}>
              My Account
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Online
            </Text>
          </div>
          <Button type="text" icon={<MoreOutlined />} />
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm hội thoại..." variant="filled" />
        </div>

        <Flex vertical>
          {contacts.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: item.id === 1 ? '#e6f7ff' : 'transparent',
                transition: 'all 0.3s',
              }}
              className="chat-list-item"
            >
              <Flex gap={12} align="flex-start">
                <Badge dot={item.online} color="green" offset={[-2, 32]}>
                  <Avatar size={48}>{item.name[0]}</Avatar>
                </Badge>

                <Flex vertical flex={1}>
                  <Flex justify="space-between">
                    <Text strong>{item.name}</Text>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.time}
                    </Text>
                  </Flex>

                  <Flex justify="space-between">
                    <Text ellipsis type="secondary" style={{ maxWidth: 160 }}>
                      {item.lastMsg}
                    </Text>

                    {item.unread > 0 && <Badge count={item.unread} size="small" />}
                  </Flex>
                </Flex>
              </Flex>
            </div>
          ))}
        </Flex>
      </Sider>

      {/* Main Content - Cửa sổ chat */}
      <Content style={{ display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
        {/* Chat Header */}
        <Header
          style={{
            background: colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            height: '72px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar size={40}>A</Avatar>
            <Flex vertical>
              <Title level={5} style={{ margin: 0 }}>
                Admin Hudu
              </Title>
              <Text type="success" style={{ fontSize: '12px' }}>
                ● Đang hoạt động
              </Text>
            </Flex>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button icon={<PhoneOutlined />} type="text" />
            <Button icon={<VideoCameraOutlined />} type="text" />
            <Button icon={<MoreOutlined />} type="text" />
          </div>
        </Header>

        {/* Messages Space */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.mine ? 'flex-end' : 'flex-start',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '10px 16px',
                  borderRadius: msg.mine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  background: msg.mine ? '#1890ff' : '#fff',
                  color: msg.mine ? '#fff' : 'rgba(0, 0, 0, 0.88)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                {msg.text}
              </div>
              <Text type="secondary" style={{ fontSize: '11px', marginTop: '4px' }}>
                {msg.time}
              </Text>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: '20px 24px',
            background: colorBgContainer,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button icon={<PaperClipOutlined />} type="text" size="large" />
            <Input
              placeholder="Nhập tin nhắn..."
              size="large"
              variant="borderless"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPressEnter={() => {
                if (message.trim()) {
                  console.log('Send message:', message);
                  setMessage('');
                }
              }}
              style={{ background: '#f5f5f5', borderRadius: '20px' }}
              suffix={<SmileOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="large"
              shape="circle"
              disabled={!message.trim()}
            />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default ChatPage;
