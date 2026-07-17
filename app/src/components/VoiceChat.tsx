import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { sendChatMessage } from '../services/api';
import { useVoiceInput } from '../hooks/useVoiceInput';
import type { ChatMessage } from '../types';

interface Props {
  onClose: () => void;
}

export function VoiceChat({ onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { isRecording, isSpeaking, startRecording, stopRecording, speak } = useVoiceInput();

  const startPulse = useCallback(() => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, [pulseAnim]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsLoading(true);

      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        const response = await sendChatMessage(trimmed, history);

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        await speak(response);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: '申し訳ありません。通信エラーが発生しました。',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [messages, speak]
  );

  const handleRecordStart = useCallback(async () => {
    try {
      await startRecording();
      startPulse();
    } catch {
      // microphone denied
    }
  }, [startRecording, startPulse]);

  const handleRecordStop = useCallback(async () => {
    stopPulse();
    await stopRecording();
  }, [stopRecording, stopPulse]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e1b4b', '#141414']} style={styles.header}>
        <View style={styles.assistantInfo}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>AIアシスタント</Text>
            <Text style={styles.headerSub}>
              {isSpeaking ? '🔊 音声で回答中...' : isLoading ? '考え中...' : 'MIRAI.MAMORU'}
            </Text>
          </View>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.role === 'user' ? styles.userRow : styles.assistantRow,
            ]}
          >
            {item.role === 'assistant' && (
              <View style={styles.assistantAvatar}>
                <Text style={styles.assistantAvatarEmoji}>🤖</Text>
              </View>
            )}
            <View
              style={[
                styles.bubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.role === 'user' ? styles.userText : styles.assistantText,
                ]}
              >
                {item.content}
              </Text>
              <Text
                style={[
                  styles.bubbleTime,
                  item.role === 'user' ? styles.userTime : styles.assistantTime,
                ]}
              >
                {formatTime(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>AIアシスタントです</Text>
            <Text style={styles.emptyDesc}>
              カメラの設定、防犯アドバイス、{'\n'}異常内容の詳細など、何でもお聞きください。
            </Text>
          </View>
        }
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.typingRow}>
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color="#818cf8" />
            <Text style={styles.typingText}>回答を生成中...</Text>
          </View>
        </View>
      )}

      {/* Input area */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="メッセージを入力..."
          placeholderTextColor="#4b5563"
          multiline
          maxLength={500}
        />

        <View style={styles.inputActions}>
          {/* Mic button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              onPressIn={handleRecordStart}
              onPressOut={handleRecordStop}
              style={[styles.micBtn, isRecording && styles.micBtnRecording]}
            >
              <Text style={styles.micIcon}>🎤</Text>
            </Pressable>
          </Animated.View>

          {/* Send button */}
          <Pressable
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  assistantInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f122',
    borderWidth: 2,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#818cf8', marginTop: 1 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff11',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: '#9ca3af' },

  // Messages
  messageList: { flex: 1 },
  messageContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 8,
  },
  messageRow: { flexDirection: 'row', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  assistantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e1b4b',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  assistantAvatarEmoji: { fontSize: 14 },
  bubble: {
    maxWidth: '76%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1f1f1f',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  assistantText: { color: '#e5e7eb' },
  bubbleTime: { fontSize: 10 },
  userTime: { color: '#c7d2fe', alignSelf: 'flex-end' },
  assistantTime: { color: '#6b7280' },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyDesc: { fontSize: 13, color: '#374151', textAlign: 'center', lineHeight: 20 },

  // Typing
  typingRow: { paddingHorizontal: 16, paddingBottom: 4 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1f1f1f',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingText: { fontSize: 13, color: '#818cf8' },

  // Input
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: 28,
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderTopColor: '#1f1f1f',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    color: '#f9fafb',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 20,
  },
  inputActions: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  micBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  micBtnRecording: {
    backgroundColor: '#ef444422',
    borderColor: '#ef4444',
  },
  micIcon: { fontSize: 20 },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#1f2937' },
  sendIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
});
