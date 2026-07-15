/* Simulate the browser path exactly: cookie auth (no auth.token), polling+websocket. */
import { io } from 'socket.io-client';

const API = 'http://localhost:5000/api';
const SOCKET = 'http://localhost:5000';
const suffix = Date.now();
const log = (...args) => console.log('[cookie-test]', ...args);

async function registerAndLogin(name) {
  const email = `${name}.${suffix}@test.local`;
  const password = 'Password123!';
  let res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `${name}${suffix}`, email, password }),
  });
  if (!res.ok) throw new Error(`register failed: ${res.status}`);

  res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const json = await res.json();
  const setCookies = res.headers.getSetCookie();
  const cookieHeader = setCookies.map((c) => c.split(';')[0]).join('; ');
  if (!cookieHeader.includes('accessToken')) throw new Error('no accessToken cookie in login response');
  return { id: json.data.id, cookie: cookieHeader, token: json.data.accessToken, name };
}

function connectWithCookie(user) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      timeout: 10000,
      extraHeaders: { Cookie: user.cookie },
    });
    const timer = setTimeout(() => reject(new Error(`${user.name}: connect timeout`)), 12000);
    socket.on('connect', () => {
      clearTimeout(timer);
      log(`${user.name} connected via COOKIE auth (id=${socket.id})`);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(new Error(`${user.name}: connect_error: ${err.message}`));
    });
  });
}

async function main() {
  log('1. Register + login (cookie) for two users...');
  const a = await registerAndLogin('carol');
  const b = await registerAndLogin('dave');

  log('2. Create direct conversation...');
  const res = await fetch(`${API}/conversations/direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: a.cookie },
    body: JSON.stringify({ targetUserId: b.id }),
  });
  const conv = await res.json();
  if (!res.ok) throw new Error(`create conversation failed: ${JSON.stringify(conv)}`);
  const conversationId = String(conv.data.conversation._id);
  log(`   conversationId=${conversationId}`);

  log('3. Connect both sockets using ONLY cookies (like the browser)...');
  const sa = await connectWithCookie(a);
  const sb = await connectWithCookie(b);

  log('4. A sends via socket; B (not joined to room) must receive...');
  const received = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('TIMEOUT: B did not receive message:created')), 8000);
    sb.once('message:created', (p) => { clearTimeout(t); resolve(p); });
  });
  const ack = await new Promise((resolve) =>
    sa.emit('message:send', { conversationId, content: 'cookie-auth realtime works' }, resolve),
  );
  if (!ack?.success) throw new Error(`send ack failed: ${JSON.stringify(ack)}`);
  const msg = await received;
  log(`   PASS: B received "${msg.message.content}"`);

  sa.disconnect();
  sb.disconnect();
  log('COOKIE-AUTH REALTIME TEST PASSED');
  process.exit(0);
}

main().catch((err) => {
  console.error('[cookie-test] FAILED:', err.message);
  process.exit(1);
});
