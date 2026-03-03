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
- **Auth**: Email/password with bcrypt hashing, Resend email verification, Twilio SMS 2FA
- **Database**: PostgreSQL with Drizzle ORM (users, sessions, verification_codes, hallmarks, trust_stamps, trusthub_counter tables)
- **Email**: Resend (Replit Connectors SDK) for verification + password reset emails
- **SMS**: Twilio for 2FA codes
- **PWA**: Service worker (stale-while-revalidate), web manifest, offline support, Add to Home Screen

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
  register.tsx             # Registration screen (password strength rules)
  verify.tsx               # Email verification + SMS 2FA code entry
  sms-optin.tsx            # Twilio-compliant SMS opt-in with consent checkbox
  terms.tsx                # Terms of Service (modal)
  privacy.tsx              # Privacy Policy (modal)
  (tabs)/
    _layout.tsx            # Tab navigator (5 tabs)
    index.tsx              # Home Dashboard
    explore.tsx            # App Directory (32 apps)
    wallet.tsx             # Wallet & Balances
    chat.tsx               # Signal Chat
    profile.tsx            # User Profile
  app-detail.tsx           # App detail modal with SSO
  ai-agent.tsx             # AI Agent chat modal
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
public/
  manifest.json            # PWA web app manifest
  sw.js                    # Service worker (cache, offline)
web/
  index.html               # Custom Expo web HTML template with PWA meta tags
server/
  index.ts                 # Express server (serves public/ + static-build/)
  routes.ts                # API routes (auth + AI + hallmark)
  auth.ts                  # Auth routes (register, login, verify-email, verify-2fa, etc.)
  ai-agent.ts              # AI Agent endpoints (chat streaming, TTS, voices)
  hallmark.ts              # Hallmark System (TH-XXXXXXXX hallmarks, trust stamps, blockchain hashing)
  db/
    schema.ts              # Drizzle schema (users, verification_codes, sessions, hallmarks, trust_stamps, trusthub_counter)
    index.ts               # Database connection (Neon + Drizzle)
  services/
    resend.ts              # Resend email service (verification, password reset)
    twilio.ts              # Twilio SMS service (2FA codes)
```

## API Integration
All screens try live Trust Layer API endpoints first and fall back to mock data:
- Auth: POST /api/auth/register, /login, /verify-email, /auth/phone/verify (2FA), /auth/resend-verification, /logout; GET /api/auth/me
- Phone: POST /api/user/phone-settings (update phone), /api/auth/phone/verify-setup (verify phone)
- SSO: POST /api/auth/exchange-token (Hub session → 1hr ecosystem token for child apps)
- Balance: GET /api/balance, /api/shells/my-balance, /api/user/dwc-bag
- Transactions: GET /api/user/transactions
- Membership: GET /api/user/membership
- Ecosystem: GET /api/ecosystem/apps (public)
- Guardian: POST /api/guardian/scan (public)
- Presale: GET /api/presale/stats, /api/presale/tiers (public)
- Subscriptions: GET /api/subscription/status, /api/subscription/plans
- Chat: WebSocket wss://trusthub.tlid.io/ws/chat with separate auth (POST /api/chat/auth/login)
- AI/Voice: POST /api/ai/chat (OpenAI streaming), POST /api/voice/tts (ElevenLabs TTS), GET /api/voice/voices
- Hallmark: POST /api/hallmark/generate (auth), GET /api/hallmark/:hallmarkId/verify (public), POST /api/trust-stamp (auth), GET /api/trust-stamps/:userId (auth)

## Key Features
- Full auth system: email/password registration with password strength rules (8 char min, 1 uppercase, 1 special char)
- Email verification via Resend (6-digit code, Trust Layer branded email)
- SMS 2FA via Twilio (6-digit code on login when phone is configured)
- Twilio-compliant SMS opt-in screen with consent checkbox and legal language
- Terms of Service and Privacy Policy screens (linked from login, register, profile, SMS opt-in)
- Hallmark System: TH-XXXXXXXX numbered blockchain audit trail with SHA-256 hashing
  - Tier 1 Hallmarks: formal records for registration, purchases, certifications (with QR/verification)
  - Tier 2 Trust Stamps: automatic audit trail for logins, profile updates, balance changes
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
- Domain: trusthub.tlid.io (TLID = Trust Layer ID)
- Support: team@tlid.io
- Footer: DarkWave Studios LLC → trusthub.tlid.io, Protected by TrustShield.tech
