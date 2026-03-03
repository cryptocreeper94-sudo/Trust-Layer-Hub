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

export function useChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentChannel, setCurrentChannel] = useState("general");
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(null);

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

  const connect = useCallback(async () => {
    const token = tokenRef.current || await getChatToken();
    if (!token) return;
    tokenRef.current = token;

    const baseUrl = getBaseUrl();
    const wsUrl = baseUrl.replace("https://", "wss://").replace("http://", "ws://") + "/ws/chat";

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "join", token, channel: currentChannel }));
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "message":
              setMessages(prev => [...prev, {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                userId: data.userId,
                username: data.username,
                content: data.content,
                timestamp: data.timestamp || new Date().toISOString(),
                channel: data.channel || currentChannel,
                isMe: false,
              }]);
              break;
            case "history":
              if (data.messages) {
                setMessages(data.messages.map((m: any) => ({
                  id: m.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  userId: m.userId,
                  username: m.username,
                  content: m.content,
                  timestamp: m.timestamp,
                  channel: m.channel || currentChannel,
                  isMe: false,
                })));
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
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }
  }, [currentChannel]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && content.trim()) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        content: content.trim(),
        channel: currentChannel,
      }));
      const username = chatUser?.username || "You";
      setMessages(prev => [...prev, {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        username,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        channel: currentChannel,
        isMe: true,
      }]);
    }
  }, [currentChannel, chatUser]);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", channel: currentChannel }));
    }
  }, [currentChannel]);

  const switchChannel = useCallback((channel: string) => {
    setCurrentChannel(channel);
    setMessages([]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "switch_channel", channel }));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    isConnected,
    messages,
    channels,
    typingUsers,
    onlineUsers,
    currentChannel,
    chatUser,
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
