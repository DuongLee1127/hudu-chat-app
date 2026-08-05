'use client';

import { Card, Col, Row, Skeleton, Statistic, Typography } from 'antd';
import { MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';

import { useAdminMetrics } from '@/hook/useAdmin';

const { Title } = Typography;

const AdminOverviewPage = () => {
  const { data, isLoading } = useAdminMetrics();
  const metrics = data?.data;

  const cards = [
    { title: 'Người dùng', icon: <UserOutlined />, stats: metrics?.users },
    { title: 'Tin nhắn', icon: <MessageOutlined />, stats: metrics?.messages },
    { title: 'Hội thoại', icon: <TeamOutlined />, stats: metrics?.conversations },
  ];

  return (
    <div>
      <Title level={4}>Tổng quan</Title>
      <Row gutter={16}>
        {cards.map((card) => (
          <Col span={8} key={card.title}>
            <Card>
              {isLoading ? (
                <Skeleton active paragraph={{ rows: 1 }} />
              ) : (
                <>
                  <Statistic title={card.title} value={card.stats?.total ?? 0} prefix={card.icon} />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#8c8ca0' }}>
                    +{card.stats?.new ?? 0} gần đây
                  </div>
                </>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AdminOverviewPage;
