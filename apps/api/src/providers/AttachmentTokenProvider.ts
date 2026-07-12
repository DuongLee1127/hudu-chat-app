import jwt from 'jsonwebtoken';

const ATTACHMENT_TOKEN_TTL_SECONDS = 15 * 60; // 15 phút

interface AttachmentTokenPayload {
  attachmentId: string;
  variant: 'original' | 'thumbnail';
}

const getSecret = () => {
  const secret = process.env.JWT_ACCESS_TOKEN;
  if (!secret) {
    throw new Error('JWT environment variables are not defined!');
  }
  return secret;
};

export const signAttachmentToken = (
  attachmentId: string,
  variant: AttachmentTokenPayload['variant'] = 'original',
) => {
  return jwt.sign({ attachmentId, variant } as AttachmentTokenPayload, getSecret(), {
    algorithm: 'HS256',
    expiresIn: ATTACHMENT_TOKEN_TTL_SECONDS,
  });
};

export const verifyAttachmentToken = (
  token: string,
  attachmentId: string,
  variant: AttachmentTokenPayload['variant'] = 'original',
): boolean => {
  try {
    const decoded = jwt.verify(token, getSecret()) as AttachmentTokenPayload;
    return decoded.attachmentId === attachmentId && decoded.variant === variant;
  } catch {
    return false;
  }
};
