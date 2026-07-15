/* Temporary end-to-end realtime test: 2 users, 2 sockets, A sends, B must receive. */
import { io } from 'socket.io-client';

const API = 'http://localhost:5000/api';
const SOCKET = 'http://localhost:5000';
const suffix = Date.now();

const log = (...args) => console.log('[test]', ...args);

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(`${path} failed (${res.status}): ${json.message || JSON.stringify(json)}`);
  }
  return json;
}

async function createUser(name) {
  const email = `${name}.${suffix}@test.local`;
  const password = 'Password123!';
  await api('/auth/register', {
    method: 'POST',
    body: { username: `${name}${suffix}`, email, password },
  });
  const login = await api('/auth/login', { method: 'POST', body: { email, password } });
  return { id: login.data.id, token: login.data.accessToken, name };
}

function connectSocket(user) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET, {
      auth: { token: user.token },
      transports: ['polling', 'websocket'],
      timeout: 10000,
    });
    const timer = setTimeout(() => reject(new Error(`${user.name}: socket connect timeout`)), 12000);
    socket.on('connect', () => {
      clearTimeout(timer);
      log(`${user.name} socket connected (id=${socket.id})`);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(new Error(`${user.name}: connect_error: ${err.message}`));
    });
  });
}

const waitForEvent = (socket, event, ms, label) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`TIMEOUT waiting for ${label}`)), ms);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

async function main() {
  log('1. Creating users A and B...');
  const userA = await createUser('alice');
  const userB = await createUser('bob');
  log(`   A=${userA.id}  B=${userB.id}`);

  log('2. Creating direct conversation A<->B...');
  const conv = await api('/conversations/direct', {
    method: 'POST',
    token: userA.token,
    body: { targetUserId: userB.id },
  });
  const conversationId = String(conv.data.conversation._id);
  log(`   conversationId=${conversationId}`);

  log('3. Connecting sockets...');
  const socketA = await connectSocket(userA);
  const socketB = await connectSocket(userB);

  // Test case 1: B has the conversation OPEN (joined room)
  log('4. B joins conversation room...');
  const joinAck = await new Promise((resolve) =>
    socketB.emit('conversation:join', { conversationId }, resolve),
  );
  log(`   join ack: ${JSON.stringify(joinAck)}`);

  log('5. A sends message via socket, B must receive message:created...');
  const received1 = waitForEvent(socketB, 'message:created', 8000, 'B receiving message (room joined)');
  const ack1 = await new Promise((resolve) =>
    socketA.emit('message:send', { conversationId, content: 'hello realtime #1' }, resolve),
  );
  if (!ack1?.success) throw new Error(`send ack failed: ${JSON.stringify(ack1)}`);
  const msg1 = await received1;
  log(`   PASS: B received "${msg1.message.content}"`);

  // Test case 2: B is connected but NOT in the room (user-room fan-out)
  log('6. B leaves room; A sends again — B must still receive via user room...');
  socketB.emit('conversation:leave', { conversationId });
  await new Promise((r) => setTimeout(r, 500));
  const received2 = waitForEvent(socketB, 'message:created', 8000, 'B receiving message (room NOT joined)');
  const ack2 = await new Promise((resolve) =>
    socketA.emit('message:send', { conversationId, content: 'hello realtime #2' }, resolve),
  );
  if (!ack2?.success) throw new Error(`send ack failed: ${JSON.stringify(ack2)}`);
  const msg2 = await received2;
  log(`   PASS: B received "${msg2.message.content}" without being in the room`);

  // Test case 3: REST send (fallback path) also broadcasts
  log('7. A sends via REST API — B must receive...');
  const received3 = waitForEvent(socketB, 'message:created', 8000, 'B receiving REST-sent message');
  await api(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    token: userA.token,
    body: { content: 'hello realtime #3 (REST)' },
  });
  const msg3 = await received3;
  log(`   PASS: B received "${msg3.message.content}" (REST path)`);

  socketA.disconnect();
  socketB.disconnect();
  log('ALL REALTIME TESTS PASSED');
  process.exit(0);
}

main().catch((err) => {
  console.error('[test] FAILED:', err.message);
  process.exit(1);
});
