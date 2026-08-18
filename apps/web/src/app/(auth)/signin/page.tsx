'use client';

import { Form, Input, Button, Card, Typography, Divider, Flex } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { AxiosError } from 'axios';

import { notify } from '@/lib/notify';
import { useLogin } from '@/hook/useAuth';
import type { LoginPayload } from '@/types/auth';
import type { ApiResponse } from '@/types/api';

const SignInPage = () => {
  const router = useRouter();
  const loginMutation = useLogin();

  // Xử lý đăng nhập
  const handleLogin = (values: LoginPayload) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        notify.success('Đăng nhập thành công!');
        router.push('/chat');
        router.refresh();
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        notify.error(axiosErr.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
      },
    });
  };

  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      {/* Brand panel */}
      <div className="hidden flex-col flex-1 justify-center text-white md:flex md:p-16 auth-brand-panel">
        <div className="relative z-1 max-w-110">
          <Flex
            align="center"
            gap={10}
            className="mb-7! w-fit! rounded-full! bg-white/15! px-4! py-2!"
          >
            <Image src="/hudo.svg" alt="Halo Chat" width={32} height={32} />
            <Typography.Text strong className="text-white!">
              HaloChat
            </Typography.Text>
          </Flex>
          <Typography.Title
            level={1}
            style={{ color: '#fff', fontSize: 38, lineHeight: 1.25, marginBottom: 12 }}
          >
            Trò chuyện liền mạch,
            <br />
            kết nối không giới hạn.
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
            Nhắn tin, chia sẻ và giữ liên lạc với bạn bè, đồng nghiệp mọi lúc mọi nơi cùng Halo
            Chat.
          </Typography.Text>
        </div>

        <Flex justify="center" className="mt-8! relative z-1">
          <Image
            src="/image/chat-illustration.svg"
            alt="Minh họa trò chuyện Halo Chat"
            width={520}
            height={500}
            style={{ width: '100%', maxWidth: 420, height: 'auto' }}
            priority
          />
        </Flex>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#f4f5fb] p-4 md:p-6">
        <div className="auth-glow-blob top-[8%] right-[8%] h-90 w-90" />

        <Card
          variant="outlined"
          className="relative! z-1 w-full max-w-110 rounded-[20px]! shadow-[0_20px_48px_rgba(37,24,97,0.12)]!"
        >
          <div className="mb-7 text-center">
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
              Chào mừng trở lại
            </Typography.Title>
            <Typography.Text type="secondary">
              Đăng nhập để tiếp tục cuộc trò chuyện của bạn
            </Typography.Text>
          </div>

          <Form
            name="signin"
            onFinish={handleLogin}
            size="large"
            layout="vertical"
            autoComplete="off"
          >
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
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loginMutation.isPending}
                block
                className="auth-cta-button"
                style={{ height: 46, fontWeight: 600 }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '16px 0' }} />

          <div className="text-center">
            <Typography.Text type="secondary">Chưa có tài khoản? </Typography.Text>
            <Link href="/signup">Đăng ký ngay</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignInPage;
