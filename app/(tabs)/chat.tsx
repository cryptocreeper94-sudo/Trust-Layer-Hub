import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/lib/auth-context";
import { MOCK_CHANNELS, MOCK_MESSAGES } from "@/constants/mock-data";

type ViewMode = "channels" | "messages";

function ChannelItem({
  channel,
  onPress,
}: {
  channel: { id: string; name: string; lastMessage?: string; lastMessageTime?: string; unread?: number; isPublic?: boolean };
  onPress: () => void;
}) {
  const isPublic = channel.isPublic !== false;
  return (
    <Pressable
      style={({ pressed }) => [styles.channelItem, pressed && { opacity: 0.7 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={styles.channelIcon}>
        <Ionicons
          name={isPublic ? "megaphone" : "person"}
          size={18}
          color={isPublic ? Colors.primary : Colors.secondary}
        />
      </View>
      <View style={styles.channelInfo}>
        <Text style={styles.channelName}>{isPublic ? "#" : ""}{channel.name}</Text>
        {channel.lastMessage && (
          <Text style={styles.channelLastMsg} numberOfLines={1}>{channel.lastMessage}</Text>
        )}
      </View>
      <View style={styles.channelMeta}>
        {channel.lastMessageTime && <Text style={styles.channelTime}>{channel.lastMessageTime}</Text>}
        {(channel.unread || 0) > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{channel.unread}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function MessageBubble({ msg }: { msg: { id: string; username?: string; sender?: string; senderInitials?: string; content?: string; text?: string; timestamp: string; isMe?: boolean } }) {
  const isMe = msg.isMe === true;
  const displayName = msg.username || msg.sender || "Unknown";
  const initials = msg.senderInitials || displayName.slice(0, 2).toUpperCase();
  const content = msg.content || msg.text || "";
  const timeStr = msg.timestamp.includes("T")
    ? new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : msg.timestamp;

  return (
    <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
      {!isMe && (
        <View style={styles.msgAvatar}>
          <Text style={styles.msgAvatarText}>{initials}</Text>
        </View>
      )}
      <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
        {!isMe && <Text style={styles.msgSender}>{displayName}</Text>}
        <Text style={styles.msgText}>{content}</Text>
        <Text style={styles.msgTime}>{timeStr}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { isAuthenticated } = useAuth();
  const chat = useChat();
  const [viewMode, setViewMode] = useState<ViewMode>("channels");
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [localMessages, setLocalMessages] = useState(MOCK_MESSAGES);

  const isLiveChat = chat.isConnected;
  const displayMessages = isLiveChat ? chat.messages : localMessages;

  useEffect(() => {
    chat.fetchChannels();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const tryConnect = async () => {
        try {
          await chat.connect();
        } catch {}
      };
      tryConnect();
    }
    return () => {
      chat.disconnect();
    };
  }, [isAuthenticated]);

  const handleOpenChannel = (channelId: string) => {
    setActiveChannel(channelId);
    setViewMode("messages");
    if (isLiveChat) {
      chat.switchChannel(channelId);
    }
  };

  const handleBack = () => {
    setViewMode("channels");
    setActiveChannel(null);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isLiveChat) {
      chat.sendMessage(inputText);
    } else {
      const newMsg = {
        id: "m" + Date.now(),
        sender: "You",
        senderInitials: "ME",
        text: inputText.trim(),
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        isMe: true,
      };
      setLocalMessages(prev => [...prev, newMsg]);
    }
    setInputText("");
  };

  const channelsToShow = chat.channels.length > 0
    ? chat.channels.map(c => ({
        id: c.id,
        name: c.name,
        lastMessage: c.description || "",
        lastMessageTime: "",
        unread: 0,
        isPublic: true,
      }))
    : MOCK_CHANNELS;

  const activeChannelData = channelsToShow.find(c => c.id === activeChannel);

  if (viewMode === "messages") {
    return (
      <View style={styles.container}>
        <BackgroundGlow />
        <View style={[styles.msgHeader, { paddingTop: insets.top + webTopInset + 8, maxWidth: isDesktop ? 720 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.msgHeaderInfo}>
            <Text style={styles.msgHeaderName}>
              {activeChannelData?.isPublic !== false ? "#" : ""}{activeChannelData?.name || activeChannel}
            </Text>
            <View style={[styles.onlineDot, { backgroundColor: isLiveChat ? Colors.success : Colors.warning }]} />
          </View>
          <View style={{ width: 44 }} />
        </View>

        <FlatList
          data={displayMessages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={[styles.messagesList, { maxWidth: isDesktop ? 720 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}
          showsVerticalScrollIndicator={false}
        />

        {chat.typingUsers.length > 0 && (
          <View style={styles.typingBar}>
            <Text style={styles.typingText}>
              {chat.typingUsers.join(", ")} {chat.typingUsers.length === 1 ? "is" : "are"} typing...
            </Text>
          </View>
        )}

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === "web" ? 34 : 12) }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                if (isLiveChat) chat.sendTyping();
              }}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              style={({ pressed }) => [styles.sendButton, pressed && { opacity: 0.7 }]}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? Colors.primary : Colors.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: 100,
            maxWidth: isDesktop ? 720 : undefined,
            alignSelf: isDesktop ? "center" as const : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <GradientText text="Signal Chat" style={styles.screenTitle} />
        <Text style={styles.subtitle}>Encrypted messaging with blockchain-verified identities</Text>

        {isLiveChat && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.liveIndicatorText}>Connected</Text>
          </View>
        )}

        <View style={styles.sectionLabel}>
          <Ionicons name="megaphone" size={14} color={Colors.primary} />
          <Text style={styles.sectionLabelText}>Public Channels</Text>
        </View>
        <GlassCard>
          {channelsToShow.filter(c => c.isPublic !== false).map((ch, i, arr) => (
            <React.Fragment key={ch.id}>
              <ChannelItem channel={ch} onPress={() => handleOpenChannel(ch.id)} />
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </GlassCard>

        {channelsToShow.some(c => c.isPublic === false) && (
          <>
            <View style={styles.sectionLabel}>
              <Ionicons name="person" size={14} color={Colors.secondary} />
              <Text style={styles.sectionLabelText}>Direct Messages</Text>
            </View>
            <GlassCard>
              {channelsToShow.filter(c => c.isPublic === false).map((ch, i, arr) => (
                <React.Fragment key={ch.id}>
                  <ChannelItem channel={ch} onPress={() => handleOpenChannel(ch.id)} />
                  {i < arr.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </GlassCard>
          </>
        )}

        <View style={styles.encryptionNote}>
          <Ionicons name="lock-closed" size={14} color={Colors.success} />
          <Text style={styles.encryptionText}>End-to-end encrypted</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveIndicatorText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: "Inter_500Medium",
  },
  sectionLabel: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 4,
  },
  sectionLabelText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  channelItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 6,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  channelLastMsg: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  channelMeta: {
    alignItems: "flex-end" as const,
    gap: 4,
  },
  channelTime: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  unreadText: {
    fontSize: 11,
    color: Colors.background,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  encryptionNote: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    marginTop: 8,
  },
  encryptionText: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: "Inter_500Medium",
  },
  msgHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
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
  msgHeaderInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  msgHeaderName: {
    fontSize: 17,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    gap: 8,
    maxWidth: "80%" as any,
  },
  messageRowMe: {
    alignSelf: "flex-end" as const,
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,255,255,0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  msgAvatarText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  msgBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: "100%" as any,
  },
  msgBubbleMe: {
    backgroundColor: "rgba(0,255,255,0.12)",
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderBottomLeftRadius: 4,
  },
  msgSender: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  msgText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    textAlign: "right" as const,
  },
  typingBar: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic" as const,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  inputRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
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
    minHeight: 36,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
});
