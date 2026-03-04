# Trust Layer Hub

## Overview
Native mobile app serving as the front door to a 32-app blockchain ecosystem. Built with React Native + Expo (SDK 54) using Expo Router for file-based routing. Features real authentication, live API integration with mock data fallbacks, SSO for ecosystem app launches, WebSocket-ready Signal Chat with persistence, unified financial wallet (Plaid bank accounts, WalletConnect/Phantom crypto wallets, multi-sig), AI agent with ElevenLabs voice, leaderboard, activity feed, onboarding walkthrough, hallmark timeline, and QR codes.

## Tech Stack
- **Framework**: React Native 0.81 + Expo SDK 54
- **Navigation**: Expo Router (file-based routing with tabs)
- **Styling**: React Native StyleSheet (dark theme only)
- **Animations**: React Native Reanimated 3 (FadeInDown on GlassCards)
- **Icons**: @expo/vector-icons (Ionicons)
- **State**: TanStack Query v5 + React Context (auth) + local state
- **Storage**: expo-secure-store (tokens), AsyncStorage (preferences, onboarding)
- **UI Effects**: expo-blur (glassmorphism), expo-linear-gradient, @react-native-masked-view/masked-view (gradient text)
- **QR Codes**: react-native-qrcode-svg + react-native-svg
- **Auth**: Email/password with bcrypt hashing, Resend email verification, Twilio SMS 2FA
- **Database**: PostgreSQL with Drizzle ORM (users, sessions, verification_codes, hallmarks, trust_stamps, trusthub_counter, linked_accounts, external_wallets, multisig_vaults, multisig_transactions, chat_channels, chat_messages)
- **Email**: Resend (Replit Connectors SDK) for verification + password reset emails
- **SMS**: Twilio for 2FA codes
- **Banking**: Plaid (sandbox mode) for bank account linking and transaction data
- **Crypto Wallets**: WalletConnect (Ethereum), Phantom (Solana) external wallet connections
- **PWA**: Service worker (stale-while-revalidate), web manifest, offline support, Add to Home Screen

## Architecture
- **Theme**: Dark only (#0c1224 base, cyan/purple accents)
- **GlassCard**: Core reusable component with BlurView + LinearGradient glow + FadeInDown entry animation
- **EmptyState**: Reusable empty state component (icon + title + subtitle) for consistent empty UI across screens
- **Tab Navigation**: 5 tabs — Home, Explore, Wallet, Chat, Profile
- **Hamburger Menu**: Slide-in left overlay with navigation to Multi-Sig, Guardian, Hallmark, Leaderboard, Settings, Support
- **Liquid Glass**: NativeTabs support for iOS 26+, BlurView fallback for older
- **API Layer**: lib/api.ts handles auth tokens, GET/POST requests, SSO URL building
- **Auth Context**: lib/auth-context.tsx provides login/register/logout/auto-session + isNewRegistration flag for onboarding
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
  multisig.tsx             # Multi-Sig vault screen (hidden, multi-sig users only)
  leaderboard.tsx          # Leaderboard screen (Top Affiliates, Top Stakers, Most Active)
  user-profile.tsx         # Public trust profile screen (view other users)
  onboarding.tsx           # 4-step onboarding walkthrough (shown after first registration)
  (tabs)/
    _layout.tsx            # Tab navigator (5 tabs) + hamburger menu
    index.tsx              # Home Dashboard (news, world news, ecosystem activity, community, countdown)
    explore.tsx            # App Directory (32 apps)
    wallet.tsx             # Unified Financial Wallet (with QR code receive)
    chat.tsx               # Signal Chat (persistent, with connection status)
    profile.tsx            # User Profile (with trust timeline)
  app-detail.tsx           # App detail modal with SSO
  ai-agent.tsx             # AI Agent chat modal
  hallmark-detail.tsx      # Genesis hallmark detail screen (TH-00000001)
  affiliate.tsx            # Affiliate program screen (with QR code)
components/
  GlassCard.tsx            # Glassmorphism card with FadeInDown animation
  GradientText.tsx         # Gradient text with MaskedView
  GradientButton.tsx       # Gradient action button
  Skeleton.tsx             # Loading skeleton
  BackgroundGlow.tsx       # Ambient glow orbs
  CountdownTimer.tsx       # Launch countdown
  ErrorBoundary.tsx        # Error boundary
  ErrorFallback.tsx        # Error fallback UI
  HamburgerMenu.tsx        # Slide-in navigation menu (includes Leaderboard + Developer Portal)
  EmptyState.tsx           # Reusable empty state (icon + title + subtitle)
constants/
  colors.ts                # Theme colors
  ecosystem-apps.ts        # 32 ecosystem app definitions
  mock-data.ts             # Mock user, balance, transactions, news, chat
hooks/
  useBalance.ts            # SIG/Shell/DWC balance + transactions (live + fallback)
  useMembership.ts         # Membership, subscriptions, VOID stats, presale
  useEcosystemApps.ts      # Ecosystem apps directory (live + fallback)
  useChat.ts               # WebSocket chat with channels, typing, presence, persistence, reconnection
  usePlaidAccounts.ts      # Plaid linked bank accounts CRUD
  useExternalWallets.ts    # WalletConnect/Phantom wallet connections
  useMultisig.ts           # Multi-sig vault, pending txs, approve/reject
  useWorldNews.ts          # World news feed (API + fallback)
  useStaking.ts            # Staking info, stake/unstake mutations (APY, cooldown)
  useWalletActions.ts      # Send, receive, swap token mutations
  useAffiliate.ts          # Affiliate dashboard, link, payout request
  useStripeBusiness.ts     # Stripe status, dashboard, connect/disconnect
  useLeaderboard.ts        # Leaderboard data (top affiliates, stakers, most active)
  useActivityFeed.ts       # Ecosystem activity feed (anonymized events)
  usePublicProfile.ts      # Public user profile lookup by username
  useHallmarkTimeline.ts   # User's hallmarks + trust stamps timeline
lib/
  api.ts                   # API client with Bearer auth, SecureStore, SSO
  auth-context.tsx         # Auth provider (login, register, logout, session check, onboarding flag)
  query-client.ts          # TanStack Query setup
public/
  manifest.json            # PWA web app manifest
  sw.js                    # Service worker (cache, offline)
web/
  index.html               # Custom Expo web HTML template with PWA meta tags
server/
  index.ts                 # Express server (serves public/ + static-build/)
  routes.ts                # API routes (auth + AI + hallmark + plaid + wallets + multisig + news + staking + affiliate + stripe + leaderboard + activity + profiles + chat)
  auth.ts                  # Auth routes (register, login, verify-email, verify-2fa, etc.)
  ai-agent.ts              # AI Agent endpoints (chat streaming, TTS, voices)
  hallmark.ts              # Hallmark System (TH-XXXXXXXX hallmarks, trust stamps, blockchain hashing, timeline)
  plaid.ts                 # Plaid integration (link token, exchange, accounts, transactions)
  wallets.ts               # External wallet connections (WalletConnect, Phantom)
  multisig.ts              # Multi-sig vault management (approve, reject, history)
  news.ts                  # World news feed API (curated national/world stories)
  staking.ts               # Staking endpoints (stake/unstake/info) + send/receive/swap
  affiliate.ts             # Affiliate program (dashboard, link, tracking, payouts)
  stripe-business.ts       # Stripe business dashboard (balance, payments, payouts, connect/disconnect)
  leaderboard.ts           # Leaderboard API (top affiliates, stakers, most active)
  activity-feed.ts         # Ecosystem activity feed (anonymized events from trust stamps)
  public-profiles.ts       # Public user profile lookup (no private data exposed)
  chat-persistence.ts      # Chat channel/message persistence (CRUD for channels + messages)
  db/
    schema.ts              # Drizzle schema (users, sessions, verification_codes, hallmarks, trust_stamps, trusthub_counter, linked_accounts, external_wallets, multisig_vaults, multisig_transactions, affiliate_referrals, affiliate_commissions, stripe_connections, chat_channels, chat_messages)
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
- Chat Persistence: GET /api/chat/channels (auth), GET /api/chat/messages/:channelId (auth), POST /api/chat/messages (auth)
- AI/Voice: POST /api/ai/chat (OpenAI streaming), POST /api/voice/tts (ElevenLabs TTS), GET /api/voice/voices
- Hallmark: POST /api/hallmark/generate (auth), GET /api/hallmark/:hallmarkId/verify (public), POST /api/trust-stamp (auth), GET /api/trust-stamps/:userId (auth), GET /api/hallmark/genesis (public), GET /api/hallmarks/timeline (auth)
- Plaid: POST /api/plaid/create-link-token (auth), POST /api/plaid/exchange-token (auth), GET /api/plaid/accounts (auth), GET /api/plaid/transactions/:accountId (auth), DELETE /api/plaid/accounts/:id (auth)
- Wallets: POST /api/wallets/connect (auth), GET /api/wallets (auth), DELETE /api/wallets/:id (auth), GET /api/wallets/:id/balances (auth)
- Multi-Sig: GET /api/multisig/vault (auth), GET /api/multisig/pending (auth), POST /api/multisig/approve/:txId (auth), POST /api/multisig/reject/:txId (auth), GET /api/multisig/history (auth)
- News: GET /api/news/world (public, curated world news feed)
- Staking: GET /api/staking/info (auth), POST /api/staking/stake (auth), POST /api/staking/unstake (auth)
- Wallet Actions: POST /api/wallet/send (auth), GET /api/wallet/receive (auth), POST /api/wallet/swap (auth)
- Affiliate: GET /api/affiliate/dashboard (auth), GET /api/affiliate/link (auth), POST /api/affiliate/track (public), POST /api/affiliate/request-payout (auth)
- Stripe: GET /api/stripe/status (auth), GET /api/stripe/dashboard (auth), POST /api/stripe/connect (auth), DELETE /api/stripe/disconnect (auth)
- Leaderboard: GET /api/leaderboard (public)
- Activity Feed: GET /api/activity/feed (public)
- Public Profiles: GET /api/users/:username/public (public)

## Key Features
- Full auth system: email/password registration with password strength rules (8 char min, 1 uppercase, 1 special char)
- Email verification via Resend (6-digit code, Trust Layer branded email)
- SMS 2FA via Twilio (6-digit code on login when phone is configured)
- Twilio-compliant SMS opt-in screen with consent checkbox and legal language
- Terms of Service and Privacy Policy screens (linked from login, register, profile, SMS opt-in)
- Onboarding walkthrough: 4-step guided tour shown after first registration (Welcome, Wallet, Affiliate, Ecosystem)
- Hallmark System: TH-XXXXXXXX numbered blockchain audit trail with SHA-256 hashing
  - Genesis Hallmark TH-00000001: auto-created on server startup, clickable badge in profile footer opens detail screen
  - Tier 1 Hallmarks: formal records for registration, purchases, certifications (with QR/verification)
  - Tier 2 Trust Stamps: automatic audit trail for logins, profile updates, balance changes
  - Blockchain stamps on: stake, unstake, send, swap, Stripe connect/disconnect, affiliate payout requests
  - Trust Timeline: visual timeline of hallmarks + stamps on profile screen
- Leaderboard: Top affiliates (by referrals), top stakers (by actions), most active (by stamps)
- Community section on home: top 3 affiliates preview with "View All" link to full leaderboard
- Ecosystem Activity Feed: anonymized recent events on home dashboard
- Public Trust Profiles: view any user's public trust stats by username
- QR Codes: real QR codes on wallet receive modal (TLID address) and affiliate screen (referral link)
- Unified Financial Wallet:
  - Trust Layer native wallet (SIG, Shells, stSIG)
  - Plaid bank account linking (sandbox mode, one-time link, persistent access token)
  - WalletConnect external wallet connections (Ethereum)
  - Phantom Solana wallet connections (deeplink)
  - Portfolio overview with net worth breakdown (crypto/bank/external)
  - Unified transaction history with filter tabs (All/Trust Layer/Banks/Crypto)
  - Shell purchase tiers (via Apple IAP/Google Play in production)
  - Identity section with Hallmark status and Trust Layer ID badge
- Hamburger menu with slide-in navigation overlay (includes Leaderboard link)
- Multi-Sig vault screen (hidden, accessible only to multi-sig users)
  - Vault overview with threshold display and co-signer list
  - Pending transaction approval/rejection
  - Transaction history
- Registration captures First Name for personalized greeting
- CST time-of-day greeting on home screen (Good morning/afternoon/evening, {firstName})
- Desktop-responsive layout: content centered with max-width on web (720px content, 960px explore, 480px auth)
- Desktop breakpoint: 768px — below that uses mobile full-width layout
- Photorealistic AI-generated images on news cards and ecosystem highlight cards
- World News carousel on home screen showing curated national/world news stories with stock photography, source attribution, and time-ago display
- Developer Portal link in hamburger menu (external link to developers.tlid.io)
- Wallet quick actions: Send, Receive, Swap, Stake with bottom-sheet modals
- Staking section with 12.5% APY, stake/unstake, 7-day cooldown, reward projections
- External wallet balances displayed inline (ETH, SOL, USDC, LINK, RAY with USD values)
- Expandable token list per connected wallet
- Pull-to-refresh on wallet screen (invalidates all wallet queries)
- Payment methods section: Apple Pay, Google Pay (coming soon), Add Card placeholder
- Affiliate program: unique hash-based referral ID (cross-platform), tiered commissions (Base 10% → Diamond 20%), referral tracking, SIG payouts, QR code
- Stripe business dashboard: connect Stripe account, view balance/payments/payouts, revenue stats
- User role system: "user" vs "developer/admin" roles on each account
- User uniqueHash generated on registration — used as affiliate ID across all 32+ ecosystem apps
- Dashboard with live portfolio balance, quick actions, photorealistic news carousel, world news carousel, ecosystem activity feed, community leaderboard preview, featured apps, activity feed, launch countdown
- 32-app directory with search, category filtering, 2-column grid (3 columns on desktop 1024px+)
- Signal Chat with WebSocket support, channels, typing indicators, DMs, message persistence, reconnection with exponential backoff, connection status display, delivery indicators
- Profile with live membership data, subscription status, settings, linked apps, trust timeline, real sign out
- App detail modal with SSO token passing for ecosystem app launches
- AI Agent: Chat screen with OpenAI streaming, ElevenLabs voice playback (web), floating sparkles button on home screen
- GlassCard entry animations (FadeInDown via Reanimated)
- Consistent EmptyState component across all screens
- Haptic feedback on all interactive elements

## Ecosystem Interconnection
All 33 apps (Hub + 32 ecosystem apps) are connected through the hallmark/affiliate blockchain hash format. Any identifier in the format `[PREFIX]-[8-DIGIT-PADDED]` (e.g., TH-00000001, TV-00000042, VO-00000003) is recognized as a Trust Layer ecosystem hallmark. The 2-character prefix identifies the originating app, and the 8-digit sequence identifies the specific record within that app.

**Prefix Registry (all connected):**
TH (Hub), TL (L1), TR (TrustHome), TV (TrustVault), TI (TLID.io), VO (THE VOID), SC (Signal Chat), DS (DarkWave Studio), GS (Guardian Shield), GN (Guardian Scanner), GR (Guardian Screener), TW (TradeWorks AI), SA (StrikeAgent), PU (Pulse), CH (Chronicles), AR (The Arcade), BO (Bomber), TG (Trust Golf), OR (ORBIT Staffing OS), OC (Orby Commander), GB (GarageBot), LO (Lot Ops Pro), TQ (TORQUE), DC (TL Driver Connect), VS (VedaSolus), VD (Verdara), AB (Arbora), PP (PaintPros), NP (Nashville Painting Professionals), TB (Trust Book), DA (DarkWave Academy), HE (Happy Eats), BB (Brew & Board Coffee)

Every app's genesis hallmark (`[PREFIX]-00000001`) references `parentGenesis: "TH-00000001"` to maintain the provenance chain back to the Hub. The `uniqueHash` affiliate ID is universal across all apps — one ID, one referral link format, ecosystem-wide commission tracking.

See `HALLMARK_AFFILIATE_HANDOFF.md` for the complete cross-app specification covering:
- Hallmark system (prefixes, genesis marks, hashing, trust stamps, verification)
- Affiliate program (uniqueHash, commission tiers, referral tracking, payout rules)
- Implementation checklist for all 32 ecosystem apps
- Standardized trust stamp categories
- Database schema requirements

## Launch Date
August 23, 2026 (CST) - displayed in countdown timer

## Branding
- "Trust Layer" for ecosystem branding
- "DarkWave Studios LLC" for legal entity only (footer)
- Signal (SIG) is a NATIVE ASSET, never "token"
- Domain: trusthub.tlid.io (TLID = Trust Layer ID)
- Support: team@dwsc.io
- Footer: DarkWave Studios LLC → trusthub.tlid.io, Protected by TrustShield.tech
