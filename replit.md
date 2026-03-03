# Trust Layer Hub

## Overview
Native mobile app serving as the front door to a 32-app blockchain ecosystem. Built with React Native + Expo (SDK 54) using Expo Router for file-based routing. Features real authentication, live API integration with mock data fallbacks, SSO for ecosystem app launches, and WebSocket-ready Signal Chat.

## Tech Stack
- **Framework**: React Native 0.81 + Expo SDK 54
- **Navigation**: Expo Router (file-based routing with tabs)
- **Styling**: React Native StyleSheet (dark theme only)
- **Animations**: React Native Reanimated 3
- **Icons**: @expo/vector-icons (Ionicons)
- **State**: TanStack Query v5 + React Context (auth) + local state
- **Storage**: expo-secure-store (tokens), AsyncStorage (preferences)
- **UI Effects**: expo-blur (glassmorphism), expo-linear-gradient, @react-native-masked-view/masked-view (gradient text)
- **Auth**: Bearer token auth with SecureStore persistence

## Architecture
- **Theme**: Dark only (#0c1224 base, cyan/purple accents)
- **GlassCard**: Core reusable component with BlurView + LinearGradient glow
- **Tab Navigation**: 5 tabs — Home, Explore, Wallet, Chat, Profile
- **Liquid Glass**: NativeTabs support for iOS 26+, BlurView fallback for older
- **API Layer**: lib/api.ts handles auth tokens, GET/POST requests, SSO URL building
- **Auth Context**: lib/auth-context.tsx provides login/register/logout/auto-session
- **Data Hooks**: hooks/ directory with live API queries that fall back to mock data

## Project Structure
```
app/
  _layout.tsx              # Root layout with providers (QueryClient, Auth)
  login.tsx                # Login screen
  register.tsx             # Registration screen
  (tabs)/
    _layout.tsx            # Tab navigator (5 tabs)
    index.tsx              # Home Dashboard
    explore.tsx            # App Directory (32 apps)
    wallet.tsx             # Wallet & Balances
    chat.tsx               # Signal Chat
    profile.tsx            # User Profile
  app-detail.tsx           # App detail modal with SSO
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
hooks/
  useBalance.ts            # SIG/Shell/DWC balance + transactions (live + fallback)
  useMembership.ts         # Membership, subscriptions, VOID stats, presale
  useEcosystemApps.ts      # Ecosystem apps directory (live + fallback)
  useChat.ts               # WebSocket chat with channels, typing, presence
lib/
  api.ts                   # API client with Bearer auth, SecureStore, SSO
  auth-context.tsx         # Auth provider (login, register, logout, session check)
  query-client.ts          # TanStack Query setup
server/
  index.ts                 # Express server
  routes.ts                # API routes
  ai-agent.ts              # AI Agent endpoints (chat streaming, TTS, voices)
```

## API Integration
All screens try live Trust Layer API endpoints first and fall back to mock data:
- Auth: POST /api/auth/login, /register, GET /api/auth/me, POST /api/auth/logout
- Balance: GET /api/balance, /api/shells/my-balance, /api/user/dwc-bag
- Transactions: GET /api/user/transactions
- Membership: GET /api/user/membership
- Ecosystem: GET /api/ecosystem/apps (public)
- Guardian: POST /api/guardian/scan (public)
- Presale: GET /api/presale/stats, /api/presale/tiers (public)
- Subscriptions: GET /api/subscription/status, /api/subscription/plans
- Chat: WebSocket wss://{url}/ws/chat with separate JWT auth (/api/chat/auth/login)
- AI Agent: POST /api/ai/chat (OpenAI streaming), POST /api/ai/tts (ElevenLabs TTS), GET /api/ai/voices
- SSO: Apps launched with ?auth_token={sessionToken}

## Key Features
- Login/Register screens with real auth flow + "Continue as Guest" option
- Registration captures First Name for personalized greeting
- CST time-of-day greeting on home screen (Good morning/afternoon/evening, {firstName})
- Desktop-responsive layout: content centered with max-width on web (720px content, 960px explore, 480px auth)
- Desktop breakpoint: 768px — below that uses mobile full-width layout
- Dashboard with live portfolio balance, quick actions, news carousel, featured apps, activity feed, launch countdown
- 32-app directory with search, category filtering, 2-column grid (3 columns on desktop 1024px+)
- Wallet with live SIG/Shell balances, Shell purchase tiers, portfolio breakdown, transaction history
- Signal Chat with WebSocket support, channels, typing indicators, DMs
- Profile with live membership data, subscription status, settings, linked apps, real sign out
- App detail modal with SSO token passing for ecosystem app launches
- AI Agent: Chat screen with OpenAI streaming, ElevenLabs voice playback (web), floating sparkles button on home screen

## Launch Date
August 23, 2026 (CST) - displayed in countdown timer

## Branding
- "Trust Layer" for ecosystem branding
- "DarkWave Studios LLC" for legal entity only (footer)
- Signal (SIG) is a NATIVE ASSET, never "token"
- Support: team@dwsc.io
- Footer: DarkWave Studios LLC → darkwavestudios.io, Protected by TrustShield.tech
