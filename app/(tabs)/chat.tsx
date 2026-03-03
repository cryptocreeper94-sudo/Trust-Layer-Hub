import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { MOCK_CHANNELS, MOCK_MESSAGES } from "@/constants/mock-data";

type ViewMode = "channels" | "messages";

function ChannelItem({
  channel,
  onPress,
}: {
  channel: typeof MOCK_CHANNELS[0];
  onPress: () => void;
}) {
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
          name={channel.isPublic ? "megaphone" : "person"}
          size={18}
          color={channel.isPublic ? Colors.primary : Colors.secondary}
        />
      </View>
      <View style={styles.channelInfo}>
        <Text style={styles.channelName}>{channel.isPublic ? "#" : ""}{channel.name}</Text>
        <Text style={styles.channelLastMsg} numberOfLines={1}>{channel.lastMessage}</Text>
      </View>
      <View style={styles.channelMeta}>
        <Text style={styles.channelTime}>{channel.lastMessageTime}</Text>
        {channel.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{channel.unread}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function MessageBubble({ msg }: { msg: typeof MOCK_MESSAGES[0] }) {
  return (
    <View style={[styles.messageRow, msg.isMe && styles.messageRowMe]}>
      {!msg.isMe && (
        <View style={styles.msgAvatar}>
          <Text style={styles.msgAvatarText}>{msg.senderInitials}</Text>
        </View>
      )}
      <View style={[styles.msgBubble, msg.isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
        {!msg.isMe && <Text style={styles.msgSender}>{msg.sender}</Text>}
        <Text style={styles.msgText}>{msg.text}</Text>
        <Text style={styles.msgTime}>{msg.timestamp}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [viewMode, setViewMode] = useState<ViewMode>("channels");
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const handleOpenChannel = (channelId: string) => {
    setActiveChannel(channelId);
    setViewMode("messages");
  };

  const handleBack = () => {
    setViewMode("channels");
    setActiveChannel(null);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg = {
      id: "m" + Date.now(),
      sender: "You",
      senderInitials: "SV",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");
  };

  const activeChannelData = MOCK_CHANNELS.find(c => c.id === activeChannel);

  if (viewMode === "messages") {
    return (
      <View style={styles.container}>
        <BackgroundGlow />
        <View style={[styles.msgHeader, { paddingTop: insets.top + webTopInset + 8 }]}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.msgHeaderInfo}>
            <Text style={styles.msgHeaderName}>
              {activeChannelData?.isPublic ? "#" : ""}{activeChannelData?.name}
            </Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={{ width: 44 }} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === "web" ? 34 : 12) }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
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
          { paddingTop: insets.top + webTopInset + 16, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <GradientText text="Signal Chat" style={styles.screenTitle} />
        <Text style={styles.subtitle}>Encrypted messaging with blockchain-verified identities</Text>

        <View style={styles.sectionLabel}>
          <Ionicons name="megaphone" size={14} color={Colors.primary} />
          <Text style={styles.sectionLabelText}>Public Channels</Text>
        </View>
        <GlassCard>
          {MOCK_CHANNELS.filter(c => c.isPublic).map((ch, i, arr) => (
            <React.Fragment key={ch.id}>
              <ChannelItem channel={ch} onPress={() => handleOpenChannel(ch.id)} />
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </GlassCard>

        <View style={styles.sectionLabel}>
          <Ionicons name="person" size={14} color={Colors.secondary} />
          <Text style={styles.sectionLabelText}>Direct Messages</Text>
        </View>
        <GlassCard>
          {MOCK_CHANNELS.filter(c => !c.isPublic).map((ch, i, arr) => (
            <React.Fragment key={ch.id}>
              <ChannelItem channel={ch} onPress={() => handleOpenChannel(ch.id)} />
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </GlassCard>

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
    backgroundColor: Colors.success,
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
