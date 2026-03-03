import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";

const MENU_WIDTH = 300;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  externalUrl?: string;
  condition?: boolean;
}

export function HamburgerMenu({ visible, onClose }: HamburgerMenuProps) {
  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const isMultisig = !!(user as Record<string, unknown>)?.isMultisig;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -MENU_WIDTH,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const menuItems: MenuItem[] = [
    {
      icon: "shield-half",
      label: "Multi-Sig",
      route: "/multisig",
      condition: isMultisig,
    },
    { icon: "podium", label: "Leaderboard", route: "/leaderboard" },
    { icon: "scan", label: "Guardian Scanner" },
    { icon: "ribbon", label: "Hallmark" },
    { icon: "code-slash", label: "Developer Portal", externalUrl: "https://developers.tlid.io" },
    { icon: "settings", label: "Settings" },
    { icon: "help-circle", label: "Support" },
  ];

  const visibleItems = menuItems.filter(
    (item) => item.condition === undefined || item.condition
  );

  const handleItemPress = (item: MenuItem) => {
    onClose();
    if (item.externalUrl) {
      setTimeout(() => Linking.openURL(item.externalUrl!), 300);
    } else if (item.route) {
      setTimeout(() => router.push(item.route as never), 300);
    }
  };

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          testID="hamburger-overlay"
        >
          <View style={styles.overlay} />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.menuPanel,
          { transform: [{ translateX }] },
        ]}
      >
        <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
          <View style={[styles.menuContent, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 }]}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Trust Layer</Text>
              <Pressable onPress={onClose} testID="hamburger-close">
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {visibleItems.map((item, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => handleItemPress(item)}
                testID={`menu-item-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <View style={styles.menuItemIconWrap}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.textTertiary}
                />
              </Pressable>
            ))}
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    elevation: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  menuPanel: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: MENU_WIDTH,
  },
  blurContainer: {
    flex: 1,
  },
  menuContent: {
    flex: 1,
    backgroundColor: "rgba(12,18,36,0.85)",
    paddingHorizontal: 20,
  },
  menuHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
    minHeight: 48,
  },
  menuItemPressed: {
    backgroundColor: "rgba(0,255,255,0.06)",
  },
  menuItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
});
