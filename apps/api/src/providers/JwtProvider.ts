import jwt, { type SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface TokenPayload {
  id: Types.ObjectId;
  email: string;
  username: string;
}

export const generateToken = (
  userInfo: TokenPayload,
  secretSignature: string,
  tokenLife: SignOptions['expiresIn'],
) => {
  try {
    // Hàm sign() của jwt và thuật toán HS256
    return jwt.sign(userInfo, secretSignature, {
      algorithm: 'HS256',
      expiresIn: tokenLife,
    });
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
};

export const verifyToken = async (token: string, secretSignature: string) => {
  try {
    // Hàm verify() của jwt
    return jwt.verify(token, secretSignature);
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
};
