import { AccessToken, RoomServiceClient, type VideoGrant } from 'livekit-server-sdk';
import { logger } from '@/helpers/logger';

const getCredentials = () => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !url) {
    throw new Error('LiveKit chưa được cấu hình!');
  }
  return { apiKey, apiSecret, url };
};

const livekitService = {
  getLiveKitServerUrl: () => getCredentials().url,

  createParticipantToken: async ({
    roomName,
    userId,
    username,
  }: {
    roomName: string;
    userId: string;
    username: string;
  }) => {
    const { apiKey, apiSecret } = getCredentials();
    const at = new AccessToken(apiKey, apiSecret, { identity: userId, name: username });
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    };
    at.addGrant(grant);
    return at.toJwt();
  },

  deleteLiveKitRoom: async (roomName: string) => {
    try {
      const { apiKey, apiSecret, url } = getCredentials();
      const client = new RoomServiceClient(url.replace('wss://', 'https://').replace('ws://', 'http://'), apiKey, apiSecret);
      await client.deleteRoom(roomName);
    } catch (error) {
      logger.error('livekitService.deleteLiveKitRoom failed', error);
    }
  },
};

export default livekitService;
