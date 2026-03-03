import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Platform,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { fetch } from "expo/fetch";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { getApiUrl } from "@/lib/query-client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function MessageBubble({
  msg,
  onPlayVoice,
  isPlaying,
}: {
  msg: ChatMessage;
  onPlayVoice: (text: string) => void;
  isPlaying: boolean;
}) {
  const isUser = msg.role === "user";
  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color={Colors.primary} />
        </View>
      )}
      <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAI]}>
        <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{msg.content}</Text>
        {msg.isStreaming && (
          <View style={styles.streamingDot}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
        {!isUser && !msg.isStreaming && msg.content.length > 0 && (
          <Pressable
            style={styles.voiceButton}
            onPress={() => onPlayVoice(msg.content)}
            disabled={isPlaying}
          >
            <Ionicons
              name={isPlaying ? "volume-high" : "volume-medium-outline"}
              size={16}
              color={isPlaying ? Colors.primary : Colors.textMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AIAgentScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: genId(),
      role: "assistant",
      content:
        "Welcome to the Trust Layer AI Agent. I can help you navigate our 32-app ecosystem, answer questions about Signal (SIG), Shells, staking, security, and more. How can I assist you today?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const audioRef = useRef<any>(null);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = { id: genId(), role: "user", content: text };
    const assistantMsg: ChatMessage = {
      id: genId(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    const currentMessages = [...messages, userMsg];
    setMessages([...currentMessages, assistantMsg]);
    setInputText("");
    setIsSending(true);

    try {
      const apiMessages = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const baseUrl = getApiUrl().replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.content) {
              fullContent += event.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            }
            if (event.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, isStreaming: false }
                    : m
                )
              );
            }
          } catch {}
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, isStreaming: false, content: fullContent || "I apologize, I couldn't process that request. Please try again." }
            : m
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                isStreaming: false,
                content:
                  "I'm having trouble connecting right now. Please try again in a moment.",
              }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, messages]);

  const handlePlayVoice = useCallback(
    async (text: string) => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const msgId = messages.find(
          (m) => m.role === "assistant" && m.content === text
        )?.id;
        if (!msgId) return;

        setPlayingMsgId(msgId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const baseUrl = getApiUrl().replace(/\/$/, "");
        const ttsText = text.length > 500 ? text.substring(0, 500) + "..." : text;

        const response = await fetch(`${baseUrl}/api/voice/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: ttsText }),
        });

        if (!response.ok) {
          throw new Error("TTS failed");
        }

        const data = await response.json();

        if (Platform.OS === "web") {
          const audioBytes = Uint8Array.from(atob(data.audio), (c) =>
            c.charCodeAt(0)
          );
          const blob = new Blob([audioBytes], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const audio = new (window as any).Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            setPlayingMsgId(null);
            URL.revokeObjectURL(url);
            audioRef.current = null;
          };
          audio.onerror = () => {
            setPlayingMsgId(null);
            URL.revokeObjectURL(url);
            audioRef.current = null;
          };
          await audio.play();
        } else {
          setPlayingMsgId(null);
        }
      } catch (error) {
        console.error("Voice playback error:", error);
        setPlayingMsgId(null);
      }
    },
    [messages]
  );

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopInset + 8,
            maxWidth: isDesktop ? 720 : undefined,
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Trust Layer AI</Text>
            <View style={styles.headerStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerStatusText}>Online</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            msg={item}
            onPlayVoice={handlePlayVoice}
            isPlaying={playingMsgId === item.id}
          />
        )}
        contentContainerStyle={[
          styles.messagesList,
          {
            maxWidth: isDesktop ? 720 : undefined,
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom:
              insets.bottom > 0
                ? insets.bottom
                : Platform.OS === "web"
                  ? 34
                  : 12,
          },
        ]}
      >
        <View
          style={[
            styles.inputRow,
            {
              maxWidth: isDesktop ? 720 : undefined,
              alignSelf: isDesktop ? ("center" as const) : undefined,
              width: isDesktop ? "100%" : undefined,
            },
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="Ask the Trust Layer AI..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isSending}
            multiline
          />
          <Pressable
            onPress={handleSend}
            style={[
              styles.sendButton,
              isSending && { opacity: 0.5 },
            ]}
            disabled={isSending || !inputText.trim()}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? Colors.primary : Colors.textMuted}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingLeft: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  headerStatus: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  headerStatusText: {
    fontSize: 11,
    color: Colors.success,
    fontFamily: "Inter_400Regular",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  msgRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    marginBottom: 16,
    gap: 8,
  },
  msgRowUser: {
    flexDirection: "row-reverse" as const,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  msgBubble: {
    maxWidth: "78%" as any,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleUser: {
    backgroundColor: "rgba(0,255,255,0.15)",
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.2)",
  },
  msgBubbleAI: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  msgText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  msgTextUser: {
    color: Colors.textPrimary,
  },
  streamingDot: {
    marginTop: 4,
  },
  voiceButton: {
    marginTop: 6,
    alignSelf: "flex-start" as const,
    padding: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
});
