import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useCreateStory } from '@/hooks/useStory';

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreateStoryModal({ visible, onClose }: CreateStoryModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [caption, setCaption] = useState('');

  const createStoryMutation = useCreateStory();

  useEffect(() => {
    if (visible && !selectedImage) {
      handleLaunchGallery();
    }
  }, [visible, selectedImage]);

  const handleLaunchGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || 'story.jpg';
        const fileType = asset.mimeType || 'image/jpeg';

        setSelectedImage({
          uri: asset.uri,
          type: fileType,
          name: fileName,
        });
      }
    } catch (error) {
      console.error('Launch gallery error:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền máy ảnh để chụp tin!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || 'photo.jpg';
        const fileType = asset.mimeType || 'image/jpeg';

        setSelectedImage({
          uri: asset.uri,
          type: fileType,
          name: fileName,
        });
      }
    } catch (error) {
      console.error('Take photo error:', error);
    }
  };

  const handlePublish = async () => {
    if (!selectedImage) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await createStoryMutation.mutateAsync({
        file: selectedImage,
        caption: caption.trim() || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Publish story error:', error);
      Alert.alert('Lỗi', 'Không thể đăng tin lúc này. Vui lòng thử lại!');
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setCaption('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black"
      >
        {selectedImage ? (
          /* Immersive Photo Preview inside Safe Display Area */
          <View className="relative flex-1 bg-black">
            {/* Story Image Preview Container - Padded for Safe Area */}
            <View
              style={{
                paddingTop: Math.max(insets.top, 16) + 52,
                paddingBottom: Math.max(insets.bottom, 16) + 136,
              }}
              className="flex-1 justify-center items-center px-2 w-full h-full bg-black"
            >
              <View className="w-full h-full rounded-2xl overflow-hidden bg-[#111] justify-center items-center">
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Top Bar Floating Controls */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 30,
                paddingTop: Math.max(insets.top, 16),
              }}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'transparent']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <View className="flex-row justify-between items-center px-4 pb-4">
                {/* Back / Retake Button */}
                <Pressable
                  onPress={() => setSelectedImage(null)}
                  className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/20 bg-black/50 active:opacity-80"
                >
                  <Ionicons name="chevron-back" size={20} color="#FFF" />
                  <Text className="text-sm font-semibold text-white">Chọn lại</Text>
                </Pressable>

                {/* Close Modal Button */}
                <Pressable
                  onPress={handleClose}
                  className="justify-center items-center w-10 h-10 rounded-full border border-white/20 bg-black/50 active:opacity-80"
                >
                  <Ionicons name="close" size={22} color="#FFF" />
                </Pressable>
              </View>
            </View>

            {/* Bottom Floating Bar: Caption Input & Share Button */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 30,
                paddingBottom: Math.max(insets.bottom, 16) + 12,
              }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <View className="gap-3 px-4 pt-6">
                {/* Taller Caption Input */}
                <View className="flex-row items-center px-4 py-3 min-h-[54px] rounded-2xl border border-white/25 bg-black/60 shadow-lg backdrop-blur-md">
                  <Ionicons
                    name="text-outline"
                    size={22}
                    color="rgba(255,255,255,0.7)"
                    className="mr-3"
                  />
                  <TextInput
                    placeholder="Thêm mô tả cho tin..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    maxLength={200}
                    className="flex-1 p-0 max-h-24 text-base font-medium text-white"
                  />
                  {caption.length > 0 && (
                    <Pressable onPress={() => setCaption('')} className="p-1 ml-2">
                      <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                    </Pressable>
                  )}
                </View>

                {/* Prominent Share Button */}
                <Pressable
                  onPress={handlePublish}
                  disabled={createStoryMutation.isPending}
                  className="flex-row justify-center items-center gap-2 h-13 bg-[#0084FF] rounded-2xl shadow-lg active:opacity-90 py-3.5"
                >
                  {createStoryMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={18} color="#FFF" />
                      <Text className="text-base font-bold text-white">Chia sẻ lên tin</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          /* Story Creation Method Selector */
          <View className="flex-1 bg-black">
            {/* Header Bar */}
            <View
              style={{ paddingTop: Math.max(insets.top, 16) }}
              className="flex-row justify-between items-center px-4 pb-3 bg-black border-b border-white/10"
            >
              <Pressable onPress={handleClose} className="p-2">
                <Ionicons name="close" size={26} color="#FFF" />
              </Pressable>

              <Text className="text-lg font-bold text-white">Tạo tin mới</Text>

              <View className="w-10" />
            </View>

            {/* Methods Selection Body */}
            <View className="flex-1 justify-center items-center px-6 bg-black">
              <Text className="mb-8 text-xl font-bold text-center text-white">
                Chọn phương thức tạo tin
              </Text>

              <View className="gap-4 w-full max-w-sm">
                {/* Gallery Option */}
                <Pressable
                  onPress={handleLaunchGallery}
                  className="flex-row items-center p-4 bg-[#1E1E1E] rounded-2xl border border-white/10 active:opacity-80"
                >
                  <View className="justify-center items-center mr-4 w-14 h-14 rounded-full bg-[#0084FF]/20">
                    <Ionicons name="images" size={28} color="#0084FF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-white">Chọn ảnh từ thư viện</Text>
                    <Text className="mt-0.5 text-xs text-gray-400">
                      Mở album ảnh trên điện thoại của bạn
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </Pressable>

                {/* Camera Option */}
                <Pressable
                  onPress={handleTakePhoto}
                  className="flex-row items-center p-4 bg-[#1E1E1E] rounded-2xl border border-white/10 active:opacity-80"
                >
                  <View className="justify-center items-center mr-4 w-14 h-14 rounded-full bg-[#10B981]/20">
                    <Ionicons name="camera" size={28} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-white">Chụp ảnh mới</Text>
                    <Text className="mt-0.5 text-xs text-gray-400">
                      Chụp ảnh trực tiếp bằng máy ảnh
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
