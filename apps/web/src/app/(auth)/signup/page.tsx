'use client';

import { Form, Input, Button, Card, Typography, Divider, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { AxiosError } from 'axios';

import { notify } from '@/lib/notify';
import { useRegister } from '@/hook/useAuth';
import type { RegisterPayload } from '@/types/auth';
import type { ApiResponse } from '@/types/api';

interface SignUpFormValues extends RegisterPayload {
  confirm: string;
  agreement: boolean;
}

const SignUpPage = () => {
  const router = useRouter();
  const registerMutation = useRegister();

  // Xử lý đăng ký
  const handleRegister = (values: SignUpFormValues) => {
    registerMutation.mutate(
      { username: values.username, email: values.email, password: values.password },
      {
        onSuccess: () => {
          notify.success('Đăng ký tài khoản thành công! Hãy đăng nhập để bắt đầu.');
          router.push('/signin');
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(
            axiosErr.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại!',
          );
        },
      },
    );
  };

  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      {/* Brand panel */}
      <div className="hidden flex-col flex-1 justify-center text-white auth-brand-panel md:flex md:p-16">
        <div style={{ maxWidth: 420, position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.15)',
              padding: '8px 16px',
              borderRadius: 999,
              marginBottom: 32,
            }}
          >
            <Image src="/hudo.svg" alt="Halo Chat" width={32} height={32} />
            <Typography.Text strong style={{ color: '#fff' }}>
              Halo Chat
            </Typography.Text>
          </div>
          <Typography.Title level={1} style={{ color: '#fff', fontSize: 40, lineHeight: 1.25 }}>
            Tham gia cộng đồng Halo Chat ngay hôm nay.
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
            Tạo tài khoản miễn phí để bắt đầu trò chuyện với bạn bè và đồng nghiệp của bạn.
          </Typography.Text>
        </div>

        <div
          style={{
            marginTop: 32,
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Image
            src="/image/chat-illustration.svg"
            alt="Minh họa trò chuyện Halo Chat"
            width={520}
            height={500}
            style={{ width: '100%', maxWidth: 420, height: 'auto' }}
            priority
          />
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#f4f5fb] p-4 md:p-6">
        <div
          className="auth-glow-blob"
          style={{ width: 360, height: 360, top: '8%', right: '8%' }}
        />
        <Card
          variant="outlined"
          className="relative w-full z-1 max-w-110 md:w-105"
          style={{
            borderRadius: 20,
            boxShadow: '0 20px 48px rgba(37, 24, 97, 0.12)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #6f6bff 0%, #8c5bf6 55%, #b357e0 100%)',
                boxShadow: '0 10px 20px rgba(108, 82, 240, 0.35)',
              }}
            >
              <Image src="/image/hudo.png" alt="Halo Chat" width={32} height={32} />
            </div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Tạo tài khoản
            </Typography.Title>
            <Typography.Text type="secondary">Chỉ mất chưa đầy một phút</Typography.Text>
          </div>

          <Form
            name="signup"
            onFinish={handleRegister}
            size="large"
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              label="Tên hiển thị"
              rules={[
                { required: true, message: 'Vui lòng nhập tên hiển thị!' },
                { min: 3, message: 'Tên hiển thị phải có ít nhất 3 ký tự!' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="nguyenvana" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="ban@example.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="Xác nhận mật khẩu"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
            </Form.Item>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(new Error('Bạn cần đồng ý với điều khoản sử dụng')),
                },
              ]}
            >
              <Checkbox>Tôi đồng ý với điều khoản sử dụng của Halo Chat</Checkbox>
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={registerMutation.isPending}
                block
                className="auth-cta-button"
                style={{ height: 46, fontWeight: 600 }}
              >
                Đăng ký
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <Typography.Text type="secondary">Đã có tài khoản? </Typography.Text>
            <Link href="/signin">Đăng nhập</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;
