/**
 * Firebase Client Config — Trust Layer Hub
 * =========================================
 * Initializes Firebase Auth for Google SSO on native (Android/iOS).
 * Uses expo-auth-session for web fallback.
 *
 * Env vars required:
 *   EXPO_PUBLIC_FIREBASE_API_KEY
 *   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   EXPO_PUBLIC_FIREBASE_PROJECT_ID
 *   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   EXPO_PUBLIC_FIREBASE_APP_ID
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID   (for Google Sign-In)
 *
 * DarkWave Studios LLC — Copyright 2026
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  Auth,
} from "firebase/auth";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "trust-layer-hub",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

let app: FirebaseApp;
let auth: Auth;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.warn("[Firebase] Init skipped (missing config):", (err as Error).message);
  app = null as any;
  auth = null as any;
}

export { app, auth, GoogleAuthProvider, signInWithCredential, signInWithPopup };

/**
 * Google Sign-In flow for native (Android/iOS)
 * Uses expo-auth-session + Google's OAuth endpoints
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

/**
 * Verify a Firebase ID token on the server side.
 * POST /api/auth/firebase/verify  { idToken }
 * Returns { user, sessionToken } on success.
 */
export async function verifyFirebaseTokenOnServer(
  idToken: string,
  apiBase: string
): Promise<{ user: any; sessionToken: string } | null> {
  try {
    const res = await fetch(`${apiBase}/api/auth/firebase/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
