# Hudu Chat Mobile (Expo)

Scaffold tối giản cho Phase 4: đăng nhập REST, danh sách hội thoại, gửi tin nhắn text.

## Chạy

```bash
cd apps/mobile
npm install
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:5000/api npm start
```

Đặt `EXPO_PUBLIC_API_URL` trỏ tới API (ví dụ `http://192.168.x.x:5000/api` khi chạy trên thiết bị thật).

## Ghi chú

- Auth hiện gửi Bearer token; nếu API login trả cookie-only, cần chỉnh backend để trả `accessToken` trong JSON.
- Chưa tích hợp Socket.io — parity realtime sẽ làm ở sprint mobile tiếp theo.
