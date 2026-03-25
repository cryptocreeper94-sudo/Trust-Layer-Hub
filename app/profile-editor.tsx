/**
 * Profile Editor — Edit Your Trust Layer Identity
 * 
 * Premium Expo screen for:
 * - Avatar upload (camera/gallery via expo-image-picker)
 * - Display name
 * - Bio (280 char limit)
 * - Username (with availability check)
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import Colors from "@/constants/colors";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://trusthub.tlid.io";
const MAX_BIO = 280;

function getToken(): string | null {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem("sessionToken");
    }
  } catch {}
  return null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const topInset = insets.top + webTopInset;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  // Username availability
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [originalUsername, setOriginalUsername] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Load current profile
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        setDisplayName(u.displayName || u.firstName || "");
        setUsername(u.username || "");
        setOriginalUsername(u.username || "");
        setBio(u.bio || "");
        setAvatarUrl(u.avatarUrl || null);
        setEmail(u.email || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
    setLoading(false);
  }

  // Debounced username availability check
  useEffect(() => {
    if (!username || username === originalUsername) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/profile/username-available?username=${encodeURIComponent(username)}`
        );
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch {
        setUsernameAvailable(null);
      }
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, originalUsername]);

  // Avatar picker
  const pickAvatar = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Grant photo library access to upload an avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]?.base64) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType || "image/jpeg";
      const dataUri = `data:${mimeType};base64,${asset.base64}`;

      setUploadingAvatar(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const token = getToken();
      const res = await fetch(`${API_BASE}/api/profile/avatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: dataUri }),
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatarUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const err = await res.json();
        Alert.alert("Upload failed", err.error || "Please try again.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to upload avatar.");
    }
    setUploadingAvatar(false);
  }, []);

  // Remove avatar
  const removeAvatar = useCallback(async () => {
    const token = getToken();
    try {
      await fetch(`${API_BASE}/api/profile/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvatarUrl(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, []);

  // Save profile
  const saveProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const body: Record<string, string> = {};
      if (displayName) body.displayName = displayName;
      if (bio !== undefined) body.bio = bio;
      if (username && username !== originalUsername) body.username = username;

      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        setOriginalUsername(u.username);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Saved", "Your profile has been updated.");
      } else {
        const err = await res.json();
        Alert.alert("Error", err.error || "Failed to save profile.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save.");
    }
    setSaving(false);
  }, [displayName, bio, username, originalUsername]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <BackgroundGlow />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundGlow />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable onPress={saveProfile} disabled={saving} hitSlop={12}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveBtn}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Section ── */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickAvatar} style={styles.avatarTouchable}>
            <View style={styles.avatarOuter}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientRing}
              />
              <View style={styles.avatarRing}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {getInitials(displayName || username || "TL")}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Camera overlay */}
            <View style={styles.cameraOverlay}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </Pressable>

          {avatarUrl && (
            <Pressable onPress={removeAvatar} style={styles.removeAvatarBtn}>
              <Text style={styles.removeAvatarText}>Remove Photo</Text>
            </Pressable>
          )}

          <Text style={styles.avatarHint}>Tap to upload a photo</Text>
        </View>

        {/* ── Form Fields ── */}
        <GlassCard style={styles.formCard}>
          {/* Display Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How you want to be known"
              placeholderTextColor={Colors.textMuted}
              maxLength={50}
              autoCapitalize="words"
            />
            <Text style={styles.fieldHint}>
              This is shown across the ecosystem
            </Text>
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.usernameRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={username}
                onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                placeholder="your_username"
                placeholderTextColor={Colors.textMuted}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {checkingUsername && (
                <ActivityIndicator size="small" color={Colors.primary} style={styles.usernameStatus} />
              )}
              {usernameAvailable === true && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={styles.usernameStatus} />
              )}
              {usernameAvailable === false && (
                <Ionicons name="close-circle" size={20} color={Colors.error} style={styles.usernameStatus} />
              )}
            </View>
            <Text style={styles.fieldHint}>
              {username}.tlid · {usernameAvailable === false ? "Username taken" : "Your Trust Layer ID"}
            </Text>
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <View style={styles.bioHeader}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <Text style={[styles.bioCount, bio.length > MAX_BIO ? styles.bioCountOver : null]}>
                {bio.length}/{MAX_BIO}
              </Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the ecosystem about yourself..."
              placeholderTextColor={Colors.textMuted}
              maxLength={MAX_BIO}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </GlassCard>

        {/* ── Read-only Info ── */}
        <GlassCard style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyText}>{email}</Text>
              <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
            </View>
            <Text style={styles.fieldHint}>
              Managed at dwtl.io · Cannot be changed here
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Trust Layer ID</Text>
            <View style={styles.tlidBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.tlidText}>{username || "your_username"}.tlid</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  saveBtn: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarTouchable: {
    position: "relative",
    marginBottom: 8,
  },
  avatarOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGradientRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55,
    opacity: 0.6,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  avatarFallback: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "rgba(0,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  removeAvatarBtn: {
    marginTop: 4,
  },
  removeAvatarText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.error,
  },
  avatarHint: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },

  // Form
  formCard: {
    marginBottom: 16,
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  fieldHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 6,
  },
  bioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bioCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  bioCountOver: {
    color: Colors.error,
  },

  // Username
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  usernameStatus: {
    marginLeft: 8,
  },

  // Read-only
  readOnlyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  readOnlyText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  tlidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
    backgroundColor: "rgba(0,255,255,0.04)",
    alignSelf: "flex-start",
  },
  tlidText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
});
