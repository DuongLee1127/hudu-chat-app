'use client';

import { useEffect } from 'react';
import { Avatar, Button, Drawer, Form, Input, Tabs, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import type { AxiosError } from 'axios';

import { useUpdateProfile, useChangePassword } from '@/hook/useUser';
import type { User, UpdateProfilePayload, ChangePasswordPayload } from '@/types/user';
import type { ApiResponse } from '@/types/api';
import { colorForId, initialOf } from '@/lib/avatar';
import { useIsMobile } from '@/hook/useMediaQuery';

const { TextArea } = Input;

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  currentUser?: User;
}

const ProfileDrawer = ({ open, onClose, currentUser }: ProfileDrawerProps) => {
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const [profileForm] = Form.useForm<UpdateProfilePayload>();
  const [passwordForm] = Form.useForm<ChangePasswordPayload & { confirmPassword: string }>();

  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  useEffect(() => {
    if (currentUser && open) {
      profileForm.setFieldsValue({
        username: currentUser.username,
        avatar: currentUser.avatar || '',
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser, open, profileForm]);

  const handleUpdateProfile = (values: UpdateProfilePayload) => {
    updateProfileMutation.mutate(values, {
      onSuccess: () => message.success('Cập nhật hồ sơ thành công!'),
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        message.error(axiosErr.response?.data?.message || 'Cập nhật hồ sơ thất bại!');
      },
    });
  };

  const handleChangePassword = (values: ChangePasswordPayload & { confirmPassword: string }) => {
    changePasswordMutation.mutate(
      { oldPassword: values.oldPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          message.success('Đổi mật khẩu thành công!');
          passwordForm.resetFields();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          message.error(axiosErr.response?.data?.message || 'Đổi mật khẩu thất bại!');
        },
      },
    );
  };

  return (
    <Drawer title="Hồ sơ cá nhân" open={open} onClose={onClose} width={isMobile ? '100%' : 420}>
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
        ]}
      />
    </Drawer>
  );
};

export default ProfileDrawer;
