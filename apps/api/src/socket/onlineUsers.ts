const userSockets = new Map<string, Set<string>>();

export const addUserSocket = (userId: string, socketId: string) => {
  const sockets = userSockets.get(userId) ?? new Set<string>();
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);
  userSockets.set(userId, sockets);
  return { wasOffline };
};

export const removeUserSocket = (userId: string, socketId: string) => {
  const sockets = userSockets.get(userId);
  if (!sockets) return { isNowOffline: false };

  sockets.delete(socketId);
  if (sockets.size === 0) {
    userSockets.delete(userId);
    return { isNowOffline: true };
  }
  return { isNowOffline: false };
};

export const isUserOnline = (userId: string) => userSockets.has(userId);
