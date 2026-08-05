'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Flex, Menu, Spin } from 'antd';
import { DashboardOutlined, FlagOutlined, TeamOutlined } from '@ant-design/icons';

import { useGetMe } from '@/hook/useAuth';

const NAV_ITEMS = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Tổng quan' },
  { key: '/admin/users', icon: <TeamOutlined />, label: 'Người dùng' },
  { key: '/admin/reports', icon: <FlagOutlined />, label: 'Báo cáo' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading } = useGetMe();
  const currentUser = data?.data;

  useEffect(() => {
    if (!isLoading && currentUser && currentUser.role !== 'admin') {
      router.replace('/chat');
    }
  }, [isLoading, currentUser, router]);

  if (isLoading || !currentUser || currentUser.role !== 'admin') {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <Flex style={{ height: '100vh' }}>
      <div style={{ width: 220, borderRight: '1px solid #eef0f7', background: '#fff' }}>
        <div style={{ padding: '20px 16px', fontWeight: 600, fontSize: 16 }}>Quản trị hệ thống</div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={NAV_ITEMS}
          onClick={({ key }) => router.push(key)}
          style={{ border: 'none' }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f4f5fb' }}>{children}</div>
    </Flex>
  );
}
