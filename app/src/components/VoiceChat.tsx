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
  const flatListRef = useRef<FlatList>(null);

  const { isRecording, isSpeaking, startRecording, stopRecording, speak } =
    useVoiceInput();

  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback(() => {
    pulseAnimation.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulseAnimation.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnimation.current?.stop();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsLoading(true);

      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        const response = await sendChatMessage(text.trim(), history);

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        speak(response);
      } catch (err) {
        console.warn('[VoiceChat] send:', err);
      } finally {
        setIsLoading(false);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    },
    [messages, speak]
  );

  const handleRecordStart = useCallback(async () => {
    try {
      await startRecording();
      startPulse();
    } catch {
      // permission denied or unavailable
    }
  }, [startRecording, startPulse]);

  const handleRecordStop = useCallback(async () => {
    stopPulse();
    // Audio recorded — in production, send to Whisper API for transcription
    // For MVP: prompt the user to type or use the keyboard voice input
    await stopRecording();
    setInputText((prev) =>
      prev.length ? prev : '（音声を録音しました。テキスト入力でも送信できます）'
    );
  }, [stopRecording, stopPulse]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AIアシスタント</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.bubbleText}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            ご質問はありますか？{'\n'}カメラの状況や防犯についてお気軽にどうぞ。
          </Text>
        }
      />

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#6366f1" />
          <Text style={styles.loadingText}>回答を生成中...</Text>
        </View>
      )}

      {isSpeaking && (
        <Text style={styles.speakingText}>🔊 音声で回答中...</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="メッセージを入力..."
          placeholderTextColor="#666"
          multiline
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(inputText)}
        />

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            onPressIn={handleRecordStart}
            onPressOut={handleRecordStop}
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
          >
            <Text style={styles.micIcon}>🎤</Text>
          </Pressable>
        </Animated.View>

        <Pressable
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
          style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: '#888' },
  messageList: { flex: 1 },
  messageContent: { padding: 16, gap: 12 },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f1f1f',
  },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  emptyText: {
    color: '#555',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 24,
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  loadingText: { color: '#888', fontSize: 13 },
  speakingText: { color: '#6366f1', fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f1f1f',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: '#ef4444' },
  micIcon: { fontSize: 20 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#333' },
  sendIcon: { fontSize: 16, color: '#fff' },
});
