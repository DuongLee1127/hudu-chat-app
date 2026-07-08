import type { NotificationArgsProps, ModalFuncProps } from 'antd';
import type { message, notification, Modal } from 'antd';

export let messageApi: ReturnType<typeof message.useMessage>[0];

export const setMessageApi = (api: ReturnType<typeof message.useMessage>[0]) => {
  messageApi = api;
};

import { createElement, type ReactNode } from 'react';
import { Progress } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export const msg = {
  success: (content: string) => messageApi?.success(content),
  error: (content: string) => messageApi?.error(content),
  info: (content: string) => messageApi?.info(content),
  warning: (content: string) => messageApi?.warning(content),
  loading: (content: string, key = 'global', percent?: number) => {
    let node: ReactNode = content;
    if (percent !== undefined) {
      node = createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' } },
        createElement('span', { style: { fontWeight: 500 } }, content),
        createElement(Progress, {
          percent,
          size: 'small',
          status: percent >= 100 ? 'success' : 'active',
          showInfo: true,
        }),
      );
    }
    return messageApi?.open({ type: 'loading', content: node, key, duration: 0 });
  },
  updateSuccess: (content: string, key = 'global') =>
    messageApi?.open({ type: 'success', content, key, duration: 2 }),
  updateError: (content: string, key = 'global') =>
    messageApi?.open({ type: 'error', content, key, duration: 2 }),
  destroy: (key?: string) => messageApi?.destroy(key),
  simulateProgress: (key = 'upload-progress', prefix = 'Đang xử lý', maxPercent = 85, ms = 400) => {
    let percent = 0;
    msg.loading(prefix, key, 0);
    const interval = setInterval(() => {
      if (percent < maxPercent) {
        percent += Math.floor(Math.random() * 15) + 5;
        if (percent > maxPercent) percent = maxPercent;
        msg.loading(prefix, key, percent);
      }
    }, ms);
    return () => clearInterval(interval);
  },
};

export let notificationApi: ReturnType<typeof notification.useNotification>[0];

export const setNotificationApi = (api: ReturnType<typeof notification.useNotification>[0]) => {
  notificationApi = api;
};

type NotifyOptions = Omit<NotificationArgsProps, 'message'> & {
  message?: NotificationArgsProps['message'];
};

export const notify = {
  success: (message: string, options?: NotifyOptions) =>
    notificationApi?.success({ title: message, ...options, placement: 'topRight', duration: 2 }),

  error: (message: string, options?: NotifyOptions) =>
    notificationApi?.error({ title: message, duration: 2, ...options, placement: 'topRight' }),

  info: (message: string, options?: NotifyOptions) =>
    notificationApi?.info({ title: message, ...options, placement: 'topRight', duration: 2 }),

  warning: (message: string, options?: NotifyOptions) =>
    notificationApi?.warning({ title: message, ...options, placement: 'topRight', duration: 2 }),

  open: (args: NotificationArgsProps) =>
    notificationApi?.open({ ...args, placement: 'topRight', duration: 2 }),

  destroy: (key?: string) => notificationApi?.destroy(key),

  loading: (message: string, key = 'global', percent?: number) => {
    let node: ReactNode = undefined;
    if (percent !== undefined) {
      node = createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '220px',
            marginTop: '8px',
          },
        },
        createElement(Progress, {
          percent,
          size: 'small',
          status: percent >= 100 ? 'success' : 'active',
          showInfo: true,
        }),
      );
    }
    return notificationApi?.open({
      key,
      message: message,
      description: node,
      icon:
        percent !== undefined && percent >= 100
          ? undefined
          : createElement(LoadingOutlined, { style: { color: 'var(--color-primary)' } }),
      duration: 0,
      placement: 'topRight',
    });
  },

  simulateProgress: (key = 'upload-progress', prefix = 'Đang xử lý', maxPercent = 85, ms = 400) => {
    let percent = 0;
    notify.loading(prefix, key, 0);
    const interval = setInterval(() => {
      if (percent < maxPercent) {
        percent += Math.floor(Math.random() * 15) + 5;
        if (percent > maxPercent) percent = maxPercent;
        notify.loading(prefix, key, percent);
      }
    }, ms);
    return () => clearInterval(interval);
  },
};
