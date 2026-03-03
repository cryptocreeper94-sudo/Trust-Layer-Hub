import { useState, useEffect, useRef, useCallback } from "react";
import { apiPost, apiGet, getChatToken, setChatToken, getBaseUrl } from "@/lib/api";

interface ChatMessage {
  id: string;
  userId?: string;
  username: string;
  content: string;
  timestamp: string;
  channel: string;
  isMe?: boolean;
  status?: "sending" | "sent" | "delivered";
}

interface ChatChannel {
  id: string;
  name: string;
  description?: string;
}

interface ChatUser {
  id: string;
  username: string;
  displayName?: string;
}

type ConnectionState = "connected" | "connecting" | "reconnecting" | "disconnected";

export function useChat() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentChannel, setCurrentChannel] = useState("general");
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(false);
  const currentChannelRef = useRef(currentChannel);

  currentChannelRef.current = currentChannel;

  const isConnected = connectionState === "connected";

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const loadMessageHistory = useCallback(async (channelId: string) => {
    setIsLoadingHistory(true);
    try {
      const data = await apiGet<{ success: boolean; messages: any[] }>(`/api/chat/messages/${channelId}`, true);
      if (data.success && data.messages) {
        setMessages(data.messages.map((m: any) => ({
          id: m.id?.toString() || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          userId: m.userId,
          username: m.username || m.sender || "Unknown",
          content: m.content || m.text || "",
          timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
          channel: m.channel || channelId,
          isMe: m.isMe || false,
          status: "delivered" as const,
        })));
      }
    } catch {
      // keep existing messages if history load fails
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const persistMessage = useCallback(async (content: string, channelId: string) => {
    try {
      await apiPost("/api/chat/messages", { content, channelId }, true);
    } catch {
      // message was already added locally, just log failure silently
    }
  }, []);

  const fetchChannels = useCallback(async () => {
    try {
      const data = await apiGet<{ success: boolean; channels: ChatChannel[] }>("/api/chat/channels", false);
      if (data.success && data.channels) {
        setChannels(data.channels);
      }
    } catch {
      setChannels([
        { id: "general", name: "General" },
        { id: "trading", name: "Trading" },
        { id: "security", name: "Security Alerts" },
        { id: "help", name: "Help" },
      ]);
    }
  }, []);

  const loginChat = useCallback(async (username: string, password: string) => {
    try {
      const data = await apiPost<{ success: boolean; user: ChatUser; token: string }>(
        "/api/chat/auth/login",
        { username, password },
        false
      );
      if (data.success) {
        await setChatToken(data.token);
        tokenRef.current = data.token;
        setChatUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const registerChat = useCallback(async (username: string, email: string, password: string, displayName: string) => {
    try {
      const data = await apiPost<{ success: boolean; user: ChatUser; token: string }>(
        "/api/chat/auth/register",
        { username, email, password, displayName },
        false
      );
      if (data.success) {
        await setChatToken(data.token);
        tokenRef.current = data.token;
        setChatUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnectRef.current) return;
    clearReconnectTimer();

    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    reconnectAttemptRef.current = attempt + 1;

    setConnectionState("reconnecting");

    reconnectTimerRef.current = setTimeout(() => {
      if (shouldReconnectRef.current) {
        connectWs();
      }
    }, delay);
  }, [clearReconnectTimer]);

  const connectWs = useCallback(async () => {
    const token = tokenRef.current || await getChatToken();
    if (!token) return;
    tokenRef.current = token;

    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionState("connecting");

    const baseUrl = getBaseUrl();
    const wsUrl = baseUrl.replace("https://", "wss://").replace("http://", "ws://") + "/ws/chat";

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "join", token, channel: currentChannelRef.current }));
        setConnectionState("connected");
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "message":
              setMessages(prev => [...prev, {
                id: data.id?.toString() || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                userId: data.userId,
                username: data.username,
                content: data.content,
                timestamp: data.timestamp || new Date().toISOString(),
                channel: data.channel || currentChannelRef.current,
                isMe: false,
                status: "delivered" as const,
              }]);
              break;
            case "history":
              if (data.messages) {
                setMessages(data.messages.map((m: any) => ({
                  id: m.id?.toString() || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  userId: m.userId,
                  username: m.username,
                  content: m.content,
                  timestamp: m.timestamp,
                  channel: m.channel || currentChannelRef.current,
                  isMe: false,
                  status: "delivered" as const,
                })));
              }
              break;
            case "delivered":
              if (data.messageId) {
                setMessages(prev => prev.map(m =>
                  m.id === data.messageId ? { ...m, status: "delivered" as const } : m
                ));
              }
              break;
            case "typing":
              setTypingUsers(prev => {
                if (!prev.includes(data.username)) return [...prev, data.username];
                return prev;
              });
              setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u !== data.username));
              }, 3000);
              break;
            case "presence":
              setOnlineUsers(data.users || []);
              break;
            case "error":
              console.warn("Chat error:", data.message);
              break;
          }
        } catch {}
      };

      ws.onclose = () => {
        setConnectionState("disconnected");
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        setConnectionState("disconnected");
        ws.close();
      };
    } catch {
      setConnectionState("disconnected");
      scheduleReconnect();
    }
  }, [scheduleReconnect]);

  const connect = useCallback(async () => {
    shouldReconnectRef.current = true;
    reconnectAttemptRef.current = 0;
    await connectWs();
  }, [connectWs]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const trimmed = content.trim();
    const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const username = chatUser?.username || "You";
    const channel = currentChannelRef.current;

    setMessages(prev => [...prev, {
      id: msgId,
      username,
      content: trimmed,
      timestamp: new Date().toISOString(),
      channel,
      isMe: true,
      status: "sending" as const,
    }]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        content: trimmed,
        channel,
        messageId: msgId,
      }));
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, status: "sent" as const } : m
      ));
    }

    persistMessage(trimmed, channel);
  }, [chatUser, persistMessage]);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", channel: currentChannelRef.current }));
    }
  }, []);

  const switchChannel = useCallback((channel: string) => {
    setCurrentChannel(channel);
    setMessages([]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "switch_channel", channel }));
    }
    loadMessageHistory(channel);
  }, [loadMessageHistory]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearReconnectTimer();
    reconnectAttemptRef.current = 0;
    wsRef.current?.close();
    wsRef.current = null;
    setConnectionState("disconnected");
  }, [clearReconnectTimer]);

  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      wsRef.current?.close();
    };
  }, [clearReconnectTimer]);

  return {
    isConnected,
    connectionState,
    messages,
    channels,
    typingUsers,
    onlineUsers,
    currentChannel,
    chatUser,
    isLoadingHistory,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    switchChannel,
    loginChat,
    registerChat,
    fetchChannels,
  };
}
