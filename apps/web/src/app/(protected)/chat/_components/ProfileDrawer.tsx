'use client';

import { useEffect, useState } from 'react';
import { Avatar, Button, Drawer, Form, Input, Switch, Tabs, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import type { AxiosError } from 'axios';

import { notify } from '@/lib/notify';
import { useUpdateProfile, useChangePassword } from '@/hook/useUser';
import { colorForId, initialOf } from '@/lib/avatar';
import { useIsMobile } from '@/hook/useMediaQuery';
import {
  isPushSupported,
  getCurrentPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push';
import type { User, UpdateProfilePayload, ChangePasswordPayload } from '@/types/user';
import type { ApiResponse } from '@/types/api';

const { Text } = Typography;

const { TextArea } = Input;

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  currentUser?: User;
}

const ProfileDrawer = ({ open, onClose, currentUser }: ProfileDrawerProps) => {
  const isMobile = useIsMobile();
  const [profileForm] = Form.useForm<UpdateProfilePayload>();
  const [passwordForm] = Form.useForm<ChangePasswordPayload & { confirmPassword: string }>();

  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (currentUser && open) {
      profileForm.setFieldsValue({
        username: currentUser.username,
        avatar: currentUser.avatar || '',
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser, open, profileForm]);

  useEffect(() => {
    if (!open) return;
    getCurrentPushSubscription().then((subscription) => setPushEnabled(!!subscription));
  }, [open]);

  const handleTogglePush = async (checked: boolean) => {
    setPushLoading(true);
    try {
      if (checked) {
        await subscribeToPush();
        notify.success('Đã bật thông báo đẩy!');
      } else {
        await unsubscribeFromPush();
        notify.success('Đã tắt thông báo đẩy!');
      }
      setPushEnabled(checked);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Không thể thay đổi thông báo đẩy!');
    } finally {
      setPushLoading(false);
    }
  };

  const handleUpdateProfile = (values: UpdateProfilePayload) => {
    updateProfileMutation.mutate(values, {
      onSuccess: () => notify.success('Cập nhật hồ sơ thành công!'),
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        notify.error(axiosErr.response?.data?.message || 'Cập nhật hồ sơ thất bại!');
      },
    });
  };

  const handleChangePassword = (values: ChangePasswordPayload & { confirmPassword: string }) => {
    changePasswordMutation.mutate(
      { oldPassword: values.oldPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          notify.success('Đổi mật khẩu thành công!');
          passwordForm.resetFields();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Đổi mật khẩu thất bại!');
        },
      },
    );
  };

  return (
    <Drawer title="Hồ sơ cá nhân" open={open} onClose={onClose} size={isMobile ? '100%' : 420}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar
          size={80}
          src={currentUser?.avatar || undefined}
          style={{ backgroundColor: currentUser ? colorForId(currentUser._id) : '#5b5bf6' }}
        >
          {currentUser ? initialOf(currentUser.username) : undefined}
        </Avatar>
      </div>

      <Tabs
        items={[
          {
            key: 'info',
            label: 'Thông tin',
            children: (
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleUpdateProfile}
                requiredMark={false}
              >
                <Form.Item
                  name="username"
                  label="Tên hiển thị"
                  rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Tên hiển thị" />
                </Form.Item>
                <Form.Item name="avatar" label="Đường dẫn ảnh đại diện">
                  <Input placeholder="https://..." />
                </Form.Item>
                <Form.Item name="bio" label="Giới thiệu bản thân">
                  <TextArea rows={3} maxLength={200} showCount placeholder="Vài dòng về bạn..." />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={updateProfileMutation.isPending}
                  >
                    Lưu thay đổi
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'password',
            label: 'Mật khẩu',
            children: (
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleChangePassword}
                requiredMark={false}
              >
                <Form.Item
                  name="oldPassword"
                  label="Mật khẩu hiện tại"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>
                <Form.Item
                  name="newPassword"
                  label="Mật khẩu mới"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                    { min: 8, message: 'Mật khẩu mới phải có ít nhất 8 ký tự!' },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu mới"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={changePasswordMutation.isPending}
                  >
                    Đổi mật khẩu
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'notifications',
            label: 'Thông báo',
            children: (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div>Thông báo đẩy</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Nhận thông báo tin nhắn mới khi không mở ứng dụng
                  </Text>
                </div>
                <Switch
                  checked={pushEnabled}
                  loading={pushLoading}
                  disabled={!isPushSupported()}
                  onChange={handleTogglePush}
                />
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default ProfileDrawer;
