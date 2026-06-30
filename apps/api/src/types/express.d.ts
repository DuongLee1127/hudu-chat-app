import { TokenPayload } from '@/providers/JwtProvider';
// "Từ giờ trở đi, interface Request của Express sẽ có thêm thuộc tính user."

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
