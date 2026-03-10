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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { InfoBubble } from "@/components/InfoBubble";
import { EmptyState } from "@/components/EmptyState";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/lib/auth-context";

type ViewMode = "channels" | "messages";

function ConnectionBadge({ state }: { state: string }) {
  let color = Colors.textMuted;
  let label = "Offline";
  let iconName: "cloud-offline" | "cloud-done" | "sync" = "cloud-offline";
  let bgColors: readonly [string, string] = ["rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)"];

  if (state === "connected") {
    color = Colors.success;
    label = "Connected";
    iconName = "cloud-done";
    bgColors = ["rgba(16,185,129,0.1)", "rgba(16,185,129,0.04)"];
  } else if (state === "connecting") {
    color = Colors.warning;
    label = "Connecting...";
    iconName = "sync";
    bgColors = ["rgba(245,158,11,0.1)", "rgba(245,158,11,0.04)"];
  } else if (state === "reconnecting") {
    color = Colors.warning;
    label = "Reconnecting...";
    iconName = "sync";
    bgColors = ["rgba(245,158,11,0.1)", "rgba(245,158,11,0.04)"];
  }

  return (
    <View style={badgeStyles.wrapper} testID="connection-badge">
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={badgeStyles.container}
      >
        <View style={[badgeStyles.dot, { backgroundColor: color }]} />
        <Ionicons name={iconName} size={12} color={color} />
        <Text style={[badgeStyles.text, { color }]}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrapper: {
    alignSelf: "center" as const,
    borderRadius: 14,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  container: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});

function DeliveryIndicator({ status }: { status?: string }) {
  if (!status) return null;

  if (status === "sending") {
    return <Ionicons name="time-outline" size={12} color={Colors.textMuted} />;
  }
  if (status === "sent") {
    return <Ionicons name="checkmark" size={12} color={Colors.textTertiary} />;
  }
  if (status === "delivered") {
    return <Ionicons name="checkmark-done" size={12} color={Colors.primary} />;
  }
  return null;
}

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
      testID={`channel-${channel.id}`}
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

function MessageBubble({ msg }: { msg: { id: string; username?: string; sender?: string; senderInitials?: string; content?: string; text?: string; timestamp: string; isMe?: boolean; status?: string } }) {
  const isMe = msg.isMe === true;
  const displayName = msg.username || msg.sender || "Unknown";
  const initials = msg.senderInitials || displayName.slice(0, 2).toUpperCase();
  const content = msg.content || msg.text || "";
  const timeStr = msg.timestamp.includes("T")
    ? new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : msg.timestamp;

  return (
    <View style={[styles.messageRow, isMe && styles.messageRowMe]} testID={`message-${msg.id}`}>
      {!isMe && (
        <View style={styles.msgAvatar}>
          <Text style={styles.msgAvatarText}>{initials}</Text>
        </View>
      )}
      <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
        {!isMe && <Text style={styles.msgSender}>{displayName}</Text>}
        <Text style={styles.msgText}>{content}</Text>
        <View style={styles.msgFooter}>
          <Text style={styles.msgTime}>{timeStr}</Text>
          {isMe && <DeliveryIndicator status={msg.status} />}
        </View>
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
  const [localMessages, setLocalMessages] = useState<Array<{ id: string; sender: string; senderInitials: string; text: string; timestamp: string; isMe: boolean }>>([]);

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
    : [];

  const activeChannelData = channelsToShow.find(c => c.id === activeChannel);

  if (viewMode === "messages") {
    return (
      <View style={styles.container}>
        <BackgroundGlow />
        <View style={[styles.msgHeader, { paddingTop: insets.top + webTopInset + 8, maxWidth: isDesktop ? 720 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}>
          <Pressable onPress={handleBack} style={styles.backButton} testID="chat-back-button">
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

        <ConnectionBadge state={chat.connectionState} />

        {chat.isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : displayMessages.length === 0 ? (
          <View style={styles.emptyMessagesContainer}>
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              subtitle="Be the first to start a conversation in this channel"
            />
          </View>
        ) : (
          <FlatList
            data={displayMessages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            contentContainerStyle={[styles.messagesList, { maxWidth: isDesktop ? 720 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}
            showsVerticalScrollIndicator={false}
            testID="messages-list"
          />
        )}

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
              testID="chat-input"
            />
            <Pressable
              onPress={handleSend}
              style={({ pressed }) => [styles.sendButton, pressed && { opacity: 0.7 }]}
              disabled={!inputText.trim()}
              testID="chat-send-button"
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

        <ConnectionBadge state={chat.connectionState} />

        <View style={styles.sectionLabel}>
          <Ionicons name="megaphone" size={14} color={Colors.primary} />
          <Text style={styles.sectionLabelText}>Public Channels</Text>
          <InfoBubble title="Public Channels" message="Open community channels available to all Trust Layer members. Messages are end-to-end encrypted and linked to verified blockchain identities. Join channels to connect with the ecosystem community." size={14} />
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
              <InfoBubble title="Direct Messages" message="Private 1-on-1 conversations with other Trust Layer members. All DMs are end-to-end encrypted. Messages include delivery status indicators so you know when your message has been sent and delivered." size={14} />
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
          <InfoBubble title="Encryption" message="All Signal Chat messages are end-to-end encrypted. Only you and the intended recipients can read your messages. Trust Layer never has access to your message content." size={14} color={Colors.success} />
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
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.1)",
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
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(16,185,129,0.06)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.1)",
    alignSelf: "center" as const,
  },
  encryptionText: {
    fontSize: 11,
    color: Colors.success,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
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
    borderRadius: 18,
    padding: 12,
    maxWidth: "100%" as any,
    borderWidth: 1,
  },
  msgBubbleMe: {
    backgroundColor: "rgba(0,255,255,0.1)",
    borderBottomRightRadius: 4,
    borderColor: "rgba(0,255,255,0.15)",
  },
  msgBubbleOther: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderBottomLeftRadius: 4,
    borderColor: "rgba(255,255,255,0.06)",
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
  msgFooter: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "flex-end" as const,
    gap: 4,
    marginTop: 4,
  },
  msgTime: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(12,18,36,0.9)",
  },
  inputRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    minHeight: 36,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  emptyMessagesContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
});
