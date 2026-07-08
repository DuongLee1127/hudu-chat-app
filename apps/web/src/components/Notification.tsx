import { memo, useEffect } from 'react';
import { message, notification } from 'antd';
import { setMessageApi, setNotificationApi } from '@/lib/notify';

/**
 * Notification – Provider khởi tạo antd message / notification / modal API.
 * Phải được mount một lần duy nhất trong App root (trước ConfigProvider).
 *
 * @example
 * // Trong App.tsx hoặc main layout:
 * <Notification />
 *
 * // Dùng ở bất kỳ đâu:
 * import { notify } from '@/utils/notify';
 * notify.success('Lưu thành công!');
 */
const Notification = () => {
  const [messageApiInstance, messageHolder] = message.useMessage();
  const [notificationApiInstance, notificationHolder] = notification.useNotification();

  useEffect(() => {
    setMessageApi(messageApiInstance);
  }, [messageApiInstance]);

  useEffect(() => {
    setNotificationApi(notificationApiInstance);
  }, [notificationApiInstance]);

  return (
    <>
      {messageHolder}
      {notificationHolder}
    </>
  );
};

export default memo(Notification);
