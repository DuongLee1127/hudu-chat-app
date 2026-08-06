import { pushService } from '@/services/push.service';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export const isPushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

export const getCurrentPushSubscription = async () => {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  return (await registration?.pushManager.getSubscription()) ?? null;
};

export const subscribeToPush = async () => {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) {
    throw new Error('Trình duyệt không hỗ trợ thông báo đẩy!');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Bạn cần cấp quyền thông báo để bật tính năng này!');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');

  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  } catch {
    // The browser failed to reach its push service (Google FCM for Chrome/Edge,
    // Mozilla autopush for Firefox) — almost always a network/firewall/VPN block
    // or a privacy-focused browser (Brave) disabling Google push services, not
    // something this app can fix client-side.
    throw new Error(
      'Trình duyệt không thể kết nối tới dịch vụ thông báo đẩy. Hãy kiểm tra mạng/VPN, tắt tiện ích chặn quảng cáo, hoặc (nếu dùng Brave) bật "Use Google services for push messaging" trong cài đặt trình duyệt, rồi thử lại.',
    );
  }

  const json = subscription.toJSON();
  await pushService.subscribe({
    endpoint: json.endpoint!,
    keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
  });

  return subscription;
};

export const unsubscribeFromPush = async () => {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return;

  await pushService.unsubscribe(subscription.endpoint);
  await subscription.unsubscribe();
};
