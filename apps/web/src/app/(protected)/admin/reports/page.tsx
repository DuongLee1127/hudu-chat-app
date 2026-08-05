'use client';

import { useState } from 'react';
import { Select, Table, Tag, Typography } from 'antd';
import type { AxiosError } from 'axios';

import { useAdminReports, useUpdateReport } from '@/hook/useAdmin';
import { notify } from '@/lib/notify';
import type { ReportItem } from '@/types/admin';
import type { ApiResponse } from '@/types/api';

const { Title } = Typography;

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'reviewed', label: 'Đã xem xét' },
  { value: 'resolved', label: 'Đã giải quyết' },
  { value: 'rejected', label: 'Từ chối' },
];

const STATUS_COLOR: Record<ReportItem['status'], string> = {
  pending: 'orange',
  reviewed: 'blue',
  resolved: 'green',
  rejected: 'red',
};

const AdminReportsPage = () => {
  const [status, setStatus] = useState<ReportItem['status'] | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminReports({ status, page, pageSize: PAGE_SIZE });
  const updateReportMutation = useUpdateReport();

  const items = data?.data.items ?? [];
  const meta = data?.data.meta;

  const handleChangeStatus = (report: ReportItem, newStatus: ReportItem['status']) => {
    updateReportMutation.mutate(
      { id: report._id, payload: { status: newStatus } },
      {
        onSuccess: () => notify.success('Đã cập nhật báo cáo!'),
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Cập nhật báo cáo thất bại!');
        },
      },
    );
  };

  return (
    <div>
      <Title level={4}>Báo cáo</Title>
      <div style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Trạng thái"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          style={{ width: 180 }}
        />
      </div>

      <Table<ReportItem>
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
            title: 'Người báo cáo',
            key: 'reporter',
            render: (_, report) => report.reporterId?.username,
          },
          { title: 'Loại', dataIndex: 'targetType', width: 110 },
          { title: 'Lý do', dataIndex: 'reason' },
          {
            title: 'Trạng thái',
            key: 'status',
            width: 160,
            render: (_, report) => <Tag color={STATUS_COLOR[report.status]}>{report.status}</Tag>,
          },
          {
            title: 'Hành động',
            key: 'action',
            width: 180,
            render: (_, report) => (
              <Select
                size="small"
                value={report.status}
                loading={updateReportMutation.isPending}
                onChange={(value) => handleChangeStatus(report, value)}
                options={STATUS_OPTIONS}
                style={{ width: 150 }}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default AdminReportsPage;
