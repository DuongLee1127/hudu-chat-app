import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

type ConversationItem = {
  _id: string;
  name?: string;
  type: string;
  otherMember?: { username?: string };
  lastMessageAt?: string;
};

type MessageItem = {
  _id: string;
  content: string;
  senderId?: { username?: string } | string;
};

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<MessageItem>>(null);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const login = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Đăng nhập thất bại');
      const accessToken = json.data?.accessToken || json.data?.token;
      if (!accessToken) throw new Error('Không nhận được access token');
      setToken(accessToken);
      await loadConversations(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (accessToken = token) => {
    if (!accessToken) return;
    const res = await fetch(`${API_URL}/conversations?page=1&pageSize=50`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không tải được hội thoại');
    setConversations(json.data?.items || []);
  };

  const openConversation = async (id: string) => {
    setSelectedId(id);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/conversations/${id}/messages?limit=40`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Không tải được tin nhắn');
      setMessages(json.data?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedId || !draft.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: draft.trim(), type: 'text' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gửi thất bại');
      setDraft('');
      await openConversation(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Hudu Chat Mobile</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (selectedId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <TouchableOpacity onPress={() => setSelectedId(null)}>
          <Text style={styles.back}>← Quay lại</Text>
        </TouchableOpacity>
        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.messageBubble}>
              <Text style={styles.messageMeta}>
                {typeof item.senderId === 'object' ? item.senderId?.username : 'User'}
              </Text>
              <Text>{item.content}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => {
            listRef.current?.scrollToEnd({ animated: false });
          }}
          ref={listRef}
        />
        <View style={styles.composer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Nhập tin nhắn"
            value={draft}
            onChangeText={setDraft}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.buttonText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Hội thoại</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => loadConversations()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.conversationItem} onPress={() => openConversation(item._id)}>
            <Text style={styles.conversationTitle}>
              {item.type === 'group' || item.type === 'self'
                ? item.name || 'Hội thoại'
                : item.otherMember?.username || 'Người dùng'}
            </Text>
            <Text style={styles.conversationMeta}>{item.type}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5fb', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#5b5bf6' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7f5',
  },
  button: {
    backgroundColor: '#5b5bf6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#d4380d', marginBottom: 12 },
  conversationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  conversationTitle: { fontSize: 16, fontWeight: '600' },
  conversationMeta: { color: '#888', marginTop: 4, textTransform: 'capitalize' },
  back: { color: '#5b5bf6', marginBottom: 12, fontWeight: '600' },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  messageMeta: { fontSize: 12, color: '#888', marginBottom: 4 },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  sendButton: {
    backgroundColor: '#5b5bf6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
