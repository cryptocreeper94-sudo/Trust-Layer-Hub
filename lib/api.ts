import { fetch } from "expo/fetch";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "tl_session_token";
const CHAT_TOKEN_KEY = "tl_chat_token";

export function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `https://${domain}`;
  }
  return "http://localhost:5000";
}

async function getStore() {
  if (Platform.OS === "web") {
    return {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      deleteItem: (key: string) => AsyncStorage.removeItem(key),
    };
  }
  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    deleteItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
}

export async function getSessionToken(): Promise<string | null> {
  const store = await getStore();
  return store.getItem(TOKEN_KEY);
}

export async function setSessionToken(token: string): Promise<void> {
  const store = await getStore();
  await store.setItem(TOKEN_KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  const store = await getStore();
  await store.deleteItem(TOKEN_KEY);
}

export async function getChatToken(): Promise<string | null> {
  const store = await getStore();
  return store.getItem(CHAT_TOKEN_KEY);
}

export async function setChatToken(token: string): Promise<void> {
  const store = await getStore();
  await store.setItem(CHAT_TOKEN_KEY, token);
}

export async function clearChatToken(): Promise<void> {
  const store = await getStore();
  await store.deleteItem(CHAT_TOKEN_KEY);
}

export async function apiGet<T>(path: string, requireAuth = true): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = new URL(path, baseUrl);
  const headers: Record<string, string> = {};

  if (requireAuth) {
    const token = await getSessionToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
}

export async function apiPost<T>(path: string, body?: unknown, requireAuth = true): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = new URL(path, baseUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    const token = await getSessionToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
}

export async function exchangeToken(): Promise<string | null> {
  try {
    const sessionToken = await getSessionToken();
    if (!sessionToken) return null;
    const data = await apiPost<{ ecosystemToken: string }>(
      "/api/auth/exchange-token",
      { hubSessionToken: sessionToken },
      false
    );
    return data.ecosystemToken;
  } catch {
    return null;
  }
}

export function buildAppLaunchUrl(appUrl: string, token: string | null): string {
  if (!appUrl || !token) return appUrl;
  const sep = appUrl.includes("?") ? "&" : "?";
  return `${appUrl}${sep}auth_token=${token}`;
}
