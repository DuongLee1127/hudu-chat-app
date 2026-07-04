'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, Checkbox, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  GoogleOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import axiosClient from '@/api/axiosClient';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: Record<string, string>) => {
    try {
      setLoading(true);
      const res = await axiosClient.post('/api/auth/register', {
        username: values.username,
        email: values.email,
        password: values.password,
      });

      if (res.data?.status === 'success') {
        message.success('Đăng ký tài khoản thành công!');
        window.location.href = '/login';
      } else {
        message.error(res.data?.message || 'Đăng ký tài khoản thất bại!');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      message.error(
        axiosError.response?.data?.message || 'Đăng ký tài khoản thất bại. Vui lòng kiểm tra lại!',
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
      <Card style={{ width: 450, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Tạo tài khoản
          </Title>
          <Text type="secondary">Tham gia cộng đồng Hudu Chat ngay hôm nay</Text>
        </div>

        <Form name="register" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item
            name="username"
            label="Tên hiển thị"
            rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nguyen Van A" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
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
            <Checkbox>
              Tôi đồng ý với <Link href="/terms">điều khoản sử dụng</Link>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', borderRadius: '6px' }}
            >
              Đăng ký
            </Button>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
            </div>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Hoặc đăng ký với
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

export default RegisterPage;
