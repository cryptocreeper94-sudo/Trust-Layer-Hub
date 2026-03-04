import React, { useState } from "react";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { HamburgerMenu } from "@/components/HamburgerMenu";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
        <Label>Explore</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallet">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Wallet</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <Icon sf={{ default: "bubble.left", selected: "bubble.left.fill" }} />
        <Label>Chat</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function TabBarBackground() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  if (isIOS) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(12,18,36,0.5)", "rgba(12,18,36,0.85)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={tabBarStyles.topBorder} />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12,18,36,0.95)" }]} />
      <LinearGradient
        colors={["rgba(0,255,255,0.04)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { height: 1 }]}
      />
      <View style={tabBarStyles.topBorder} />
    </View>
  );
}

function ActiveTabIcon({ name, color, size, focused }: { name: string; color: string; size: number; focused: boolean }) {
  return (
    <View style={tabBarStyles.iconContainer}>
      <Ionicons name={name as any} size={size} color={color} />
      {focused && (
        <View style={tabBarStyles.activeIndicator}>
          <LinearGradient
            colors={["#00ffff", "#06b6d4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={tabBarStyles.activeIndicatorGradient}
          />
        </View>
      )}
    </View>
  );
}

function ClassicTabLayout({ onMenuOpen }: { onMenuOpen: () => void }) {
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "transparent",
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTransparent: true,
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 17,
        },
        headerLeft: () => (
          <Pressable
            onPress={onMenuOpen}
            style={tabBarStyles.headerMenuBtn}
            testID="hamburger-button"
          >
            <Ionicons name="menu" size={22} color={Colors.textPrimary} />
          </Pressable>
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          position: "absolute" as const,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <ActiveTabIcon name={focused ? "home" : "home-outline"} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size, focused }) => (
            <ActiveTabIcon name={focused ? "compass" : "compass-outline"} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size, focused }) => (
            <ActiveTabIcon name={focused ? "wallet" : "wallet-outline"} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size, focused }) => (
            <ActiveTabIcon name={focused ? "chatbubbles" : "chatbubbles-outline"} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <ActiveTabIcon name={focused ? "person" : "person-outline"} color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function FloatingMenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={tabBarStyles.floatingMenuBtn}
      testID="hamburger-button"
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12,18,36,0.6)" }]} />
      </BlurView>
      <Ionicons name="menu" size={22} color={Colors.textPrimary} />
    </Pressable>
  );
}

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false);

  if (isLiquidGlassAvailable()) {
    return (
      <View style={{ flex: 1 }}>
        <NativeTabLayout />
        <FloatingMenuButton onPress={() => setMenuVisible(true)} />
        <HamburgerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ClassicTabLayout onMenuOpen={() => setMenuVisible(true)} />
      <HamburgerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  topBorder: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  iconContainer: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingTop: 4,
  },
  activeIndicator: {
    marginTop: 4,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden" as const,
  },
  activeIndicatorGradient: {
    flex: 1,
    borderRadius: 1.5,
  },
  headerMenuBtn: {
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  floatingMenuBtn: {
    position: "absolute" as const,
    top: 58,
    left: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  },
});
