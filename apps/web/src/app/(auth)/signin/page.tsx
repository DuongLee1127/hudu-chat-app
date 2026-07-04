'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, Typography, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, GithubOutlined } from '@ant-design/icons';
import Link from 'next/link';
import axiosClient from '@/api/axiosClient';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: Record<string, string>) => {
    try {
      setLoading(true);
      const res = await axiosClient.post('/api/auth/login', {
        email: values.email,
        password: values.password,
      });

      if (res.data?.status === 'success') {
        message.success('Đăng nhập thành công!');
        window.location.href = '/chat';
      } else {
        message.error(res.data?.message || 'Đăng nhập thất bại!');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      message.error(
        axiosError.response?.data?.message ||
          'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card style={{ width: 400, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Hudu Chat
          </Title>
          <Text type="secondary">Đăng nhập để kết nối với bạn bè</Text>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Email/Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập Email hoặc Tên đăng nhập!' }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="admin@hudu.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Ghi nhớ tôi</Checkbox>
              </Form.Item>
              <Link href="/forgot-password" style={{ fontSize: '14px' }}>
                Quên mật khẩu?
              </Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', borderRadius: '6px' }}
            >
              Đăng nhập
            </Button>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              Chưa có tài khoản? <Link href="/register">Đăng ký ngay!</Link>
            </div>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Hoặc đăng nhập với
          </Text>
        </Divider>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Button icon={<GoogleOutlined />} shape="circle" />
          <Button icon={<GithubOutlined />} shape="circle" />
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
