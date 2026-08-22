import React, { useEffect } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MessageBubbleLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloatingContextMenuProps {
  visible: boolean;
  message: any;
  layout: MessageBubbleLayout | null;
  currentUserId: string;
  onClose: () => void;
  onReply: (message: any) => void;
  onTogglePin: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onDeleteForMe: (messageId: string) => void;
}

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 220,
  mass: 0.7,
};

const DISMISS_SPRING_CONFIG = {
  damping: 24,
  stiffness: 280,
  mass: 0.6,
};

export const FloatingMessageContextMenu: React.FC<FloatingContextMenuProps> = ({
  visible,
  message,
  layout,
  currentUserId,
  onClose,
  onReply,
  onTogglePin,
  onDeleteForEveryone,
  onDeleteForMe,
}) => {
  // Shared Animation Values (called unconditionally at top level)
  const progress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && message && layout) {
      progress.value = withSpring(1, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible, message, layout, progress, backdropOpacity]);

  // Reanimated Styles (called unconditionally at top level)
  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const isMe = message?.senderId?._id === currentUserId || message?.senderId === currentUserId;
  const layoutY = layout?.y ?? 0;

  const targetY = Math.max(120, Math.min(layoutY, SCREEN_HEIGHT - 380));
  const deltaY = targetY - layoutY;

  const messageAnimStyle = useAnimatedStyle(() => {
    const scale = 1 + progress.value * 0.04;
    const translateY = deltaY * progress.value;

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const emojiAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }, { translateY: (1 - progress.value) * 16 }],
  }));

  const menuAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: 0.85 + progress.value * 0.15 },
      { translateY: (1 - progress.value) * -16 },
    ],
  }));

  if (!visible || !message || !layout) return null;

  const triggerClose = (action?: () => void) => {
    backdropOpacity.value = withTiming(0, { duration: 160 });
    progress.value = withSpring(0, DISMISS_SPRING_CONFIG, (finished) => {
      if (finished) {
        runOnJS(onClose)();
        if (action) {
          runOnJS(action)();
        }
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => triggerClose()}>
      <View style={StyleSheet.absoluteFillObject}>
        {/* Fullscreen Blur Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFillObject, backdropAnimStyle]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => triggerClose()}>
            {Platform.OS === 'ios' || Platform.OS === 'android' ? (
              <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFillObject} />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    // @ts-ignore
                    backdropFilter: 'blur(16px)',
                  },
                ]}
              />
            )}
          </Pressable>
        </Animated.View>

        {/* Floating Message Container */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {/* 1. EMOJI PILL (Floating above message) */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: layout.y - 56,
                left: isMe ? undefined : layout.x,
                right: isMe ? SCREEN_WIDTH - (layout.x + layout.width) : undefined,
                zIndex: 100,
              },
              messageAnimStyle,
              emojiAnimStyle,
            ]}
          >
            <View
              className="flex-row justify-between items-center px-3.5 py-2 bg-white rounded-full shadow-2xl"
              style={{ elevation: 10, width: 230 }}
            >
              {['❤️', '👍', '😂', '😮', '😢', '🙏'].map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    triggerClose();
                  }}
                  className="active:scale-125"
                >
                  <Text className="text-xl">{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* 2. FLOATING MESSAGE CLONE (Lifted exact message bubble) */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: layout.y,
                left: layout.x,
                width: layout.width,
                height: layout.height,
                zIndex: 90,
              },
              messageAnimStyle,
            ]}
          >
            <View
              className={`rounded-2xl px-3.5 py-2 ${
                isMe ? 'rounded-br-xs bg-[#6f6bff]' : 'rounded-bl-xs bg-white'
              }`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 12,
              }}
            >
              <Text
                className={`text-[16px] leading-6 font-normal ${
                  message.isDeleted
                    ? isMe
                      ? 'italic text-white/75'
                      : 'italic text-gray-400'
                    : isMe
                      ? 'text-white'
                      : 'text-gray-900'
                }`}
              >
                {message.isDeleted ? 'Tin nhắn đã được thu hồi' : message.content}
              </Text>
            </View>
          </Animated.View>

          {/* 3. ACTION MENU CARD (Floating below message) */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: layout.y + layout.height + 12,
                left: isMe ? undefined : layout.x,
                right: isMe ? SCREEN_WIDTH - (layout.x + layout.width) : undefined,
                width: 250,
                zIndex: 80,
              },
              messageAnimStyle,
              menuAnimStyle,
            ]}
          >
            <View
              className="overflow-hidden bg-white rounded-2xl shadow-2xl"
              style={{ elevation: 14 }}
            >
              <View className="py-0.5">
                {/* Trả lời */}
                <Pressable
                  onPress={() => triggerClose(() => onReply(message))}
                  className="flex-row items-center px-4 py-2.5 active:bg-gray-100"
                >
                  <Ionicons name="arrow-undo-outline" size={18} color="#374151" />
                  <Text className="ml-3 text-[14px] font-normal text-gray-800">Trả lời</Text>
                </Pressable>

                <View className="h-[1px] bg-gray-100 ml-11" />

                {/* Sao chép */}
                <Pressable
                  onPress={() =>
                    triggerClose(() => {
                      Clipboard.setString(message.content || '');
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
                        () => {},
                      );
                    })
                  }
                  className="flex-row items-center px-4 py-2.5 active:bg-gray-100"
                >
                  <Ionicons name="copy-outline" size={18} color="#374151" />
                  <Text className="ml-3 text-[14px] font-normal text-gray-800">Sao chép</Text>
                </Pressable>

                <View className="h-[1px] bg-gray-100 ml-11" />

                {/* Chuyển tiếp */}
                <Pressable
                  onPress={() =>
                    triggerClose(() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    })
                  }
                  className="flex-row items-center px-4 py-2.5 active:bg-gray-100"
                >
                  <Ionicons name="share-outline" size={18} color="#374151" />
                  <Text className="ml-3 text-[14px] font-normal text-gray-800">Chuyển tiếp</Text>
                </Pressable>

                {/* Own message only: Thu hồi */}
                {isMe && (
                  <>
                    <View className="h-[1px] bg-gray-100 ml-11" />
                    <Pressable
                      onPress={() => triggerClose(() => onDeleteForEveryone(message._id))}
                      className="flex-row items-center px-4 py-2.5 active:bg-gray-100"
                    >
                      <Ionicons name="refresh-outline" size={18} color="#374151" />
                      <Text className="ml-3 text-[14px] font-normal text-gray-800">Thu hồi</Text>
                    </Pressable>
                  </>
                )}

                {/* Ghim / Bỏ ghim */}
                <View className="h-[1px] bg-gray-100 ml-11" />
                <Pressable
                  onPress={() => triggerClose(() => onTogglePin(message._id))}
                  className="flex-row items-center px-4 py-2.5 active:bg-gray-100"
                >
                  <Ionicons name="pin-outline" size={18} color="#374151" />
                  <Text className="ml-3 text-[14px] font-normal text-gray-800">
                    {message.isPinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
                  </Text>
                </Pressable>

                {/* Delete for me: Xóa cho tôi */}
                <View className="h-[1px] bg-gray-100 ml-11" />
                <Pressable
                  onPress={() => triggerClose(() => onDeleteForMe(message._id))}
                  className="flex-row items-center px-4 py-2.5 active:bg-gray-100"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text className="ml-3 text-[14px] font-normal text-red-500">Xóa cho tôi</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};
