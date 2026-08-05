'use client';

import { useState } from 'react';
import { App, Avatar, Button, Input, Select, Table, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { AxiosError } from 'axios';

import { useAdminUsers, useUpdateUserStatus } from '@/hook/useAdmin';
import { useDebouncedValue } from '@/hook/useDebouncedValue';
import { colorForId, initialOf } from '@/lib/avatar';
import { notify } from '@/lib/notify';
import type { AdminUser } from '@/types/admin';
import type { ApiResponse } from '@/types/api';

const { Title } = Typography;

const PAGE_SIZE = 20;

const AdminUsersPage = () => {
  const { modal } = App.useApp();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'active' | 'locked' | undefined>(undefined);
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query, 350);

  const { data, isLoading } = useAdminUsers({
    q: debouncedQuery || undefined,
    status,
    page,
    pageSize: PAGE_SIZE,
  });
  const updateStatusMutation = useUpdateUserStatus();

  const items = data?.data.items ?? [];
  const meta = data?.data.meta;

  const handleApiError = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<ApiResponse<null>>;
    notify.error(axiosErr.response?.data?.message || fallback);
  };

  const handleLock = (user: AdminUser) => {
    let reason = '';
    modal.confirm({
      title: `Khóa tài khoản "${user.username}"`,
      content: (
        <Input.TextArea
          placeholder="Lý do khóa (tùy chọn)"
          onChange={(e) => {
            reason = e.target.value;
          }}
        />
      ),
      okText: 'Khóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () =>
        updateStatusMutation.mutate(
          { id: user._id, payload: { status: 'locked', reason } },
          {
            onSuccess: () => notify.success('Đã khóa tài khoản!'),
            onError: (err) => handleApiError(err, 'Khóa tài khoản thất bại!'),
          },
        ),
    });
  };

  const handleUnlock = (user: AdminUser) => {
    updateStatusMutation.mutate(
      { id: user._id, payload: { status: 'active' } },
      {
        onSuccess: () => notify.success('Đã mở khóa tài khoản!'),
        onError: (err) => handleApiError(err, 'Mở khóa tài khoản thất bại!'),
      },
    );
  };

  return (
    <div>
      <Title level={4}>Người dùng</Title>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên hoặc email..."
          allowClear
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 280 }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: 'active', label: 'Hoạt động' },
            { value: 'locked', label: 'Đã khóa' },
          ]}
          style={{ width: 160 }}
        />
      </div>

      <Table<AdminUser>
        rowKey="_id"
        loading={isLoading}
        dataSource={items}
        pagination={{
          current: meta?.page,
          pageSize: meta?.pageSize,
          total: meta?.total,
          onChange: setPage,
        }}
        columns={[
          {
            title: 'Người dùng',
            key: 'user',
            render: (_, user) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar
                  src={user.avatar || undefined}
                  style={{ backgroundColor: colorForId(user._id) }}
                >
                  {initialOf(user.username)}
                </Avatar>
                <div>
                  <div>{user.username}</div>
                  <div style={{ fontSize: 12, color: '#8c8ca0' }}>{user.email}</div>
                </div>
              </div>
            ),
          },
          {
            title: 'Vai trò',
            dataIndex: 'role',
            width: 100,
            render: (role: string) =>
              role === 'admin' ? <Tag color="blue">Admin</Tag> : <Tag>Người dùng</Tag>,
          },
          {
            title: 'Trạng thái',
            dataIndex: 'accountStatus',
            width: 120,
            render: (accountStatus: string) =>
              accountStatus === 'locked' ? (
                <Tag color="red">Đã khóa</Tag>
              ) : (
                <Tag color="green">Hoạt động</Tag>
              ),
          },
          {
            title: '',
            key: 'action',
            width: 120,
            render: (_, user) =>
              user.accountStatus === 'locked' ? (
                <Button size="small" loading={updateStatusMutation.isPending} onClick={() => handleUnlock(user)}>
                  Mở khóa
                </Button>
              ) : (
                <Button
                  size="small"
                  danger
                  loading={updateStatusMutation.isPending}
                  onClick={() => handleLock(user)}
                >
                  Khóa
                </Button>
              ),
          },
        ]}
      />
    </div>
  );
};

export default AdminUsersPage;
