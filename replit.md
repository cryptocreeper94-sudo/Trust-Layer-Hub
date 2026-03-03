# Trust Layer Hub

## Overview
Native mobile app serving as the front door to a 32-app blockchain ecosystem. Built with React Native + Expo (SDK 54) using Expo Router for file-based routing.

## Tech Stack
- **Framework**: React Native 0.81 + Expo SDK 54
- **Navigation**: Expo Router (file-based routing with tabs)
- **Styling**: React Native StyleSheet (dark theme only)
- **Animations**: React Native Reanimated 3
- **Icons**: @expo/vector-icons (Ionicons)
- **State**: TanStack Query v5 + local state
- **Storage**: expo-secure-store (tokens), AsyncStorage (preferences)
- **UI Effects**: expo-blur (glassmorphism), expo-linear-gradient, @react-native-masked-view/masked-view (gradient text)

## Architecture
- **Theme**: Dark only (#0c1224 base, cyan/purple accents)
- **GlassCard**: Core reusable component with BlurView + LinearGradient glow
- **Tab Navigation**: 5 tabs — Home, Explore, Wallet, Chat, Profile
- **Liquid Glass**: NativeTabs support for iOS 26+, BlurView fallback for older

## Project Structure
```
app/
  _layout.tsx              # Root layout with providers
  (tabs)/
    _layout.tsx            # Tab navigator (5 tabs)
    index.tsx              # Home Dashboard
    explore.tsx            # App Directory (32 apps)
    wallet.tsx             # Wallet & Balances
    chat.tsx               # Signal Chat
    profile.tsx            # User Profile
  app-detail.tsx           # App detail modal
components/
  GlassCard.tsx            # Glassmorphism card
  GradientText.tsx         # Gradient text with MaskedView
  GradientButton.tsx       # Gradient action button
  Skeleton.tsx             # Loading skeleton
  BackgroundGlow.tsx       # Ambient glow orbs
  CountdownTimer.tsx       # Launch countdown
  ErrorBoundary.tsx        # Error boundary
  ErrorFallback.tsx        # Error fallback UI
constants/
  colors.ts                # Theme colors
  ecosystem-apps.ts        # 32 ecosystem app definitions
  mock-data.ts             # Mock user, balance, transactions, news, chat
lib/
  query-client.ts          # TanStack Query setup
server/
  index.ts                 # Express server
  routes.ts                # API routes
```

## Key Features
- Dashboard with portfolio balance, quick actions, news carousel, featured apps, activity feed, launch countdown
- 32-app directory with search, category filtering, 2-column grid
- Wallet with SIG/Shell balances, Shell purchase tiers, portfolio breakdown, transaction history
- Signal Chat with channels, DMs, message interface
- Profile with Trust Layer ID, VOID membership, Guardian score, settings, linked apps
- App detail modal with launch via in-app browser

## Launch Date
August 23, 2026 (CST) - displayed in countdown timer

## Branding
- "Trust Layer" for ecosystem branding
- "DarkWave Studios" for legal entity only
- Signal (SIG) is a NATIVE ASSET, never "token"
- Support: team@dwsc.io
