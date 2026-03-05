# Trust Layer Hub

## Overview
The Trust Layer Hub is a native mobile application designed as the central gateway to a sprawling 32-app blockchain ecosystem. Its primary purpose is to provide a unified user experience for authentication, financial management, communication, and ecosystem exploration. Key capabilities include real authentication, live API integration with robust mock data fallbacks, single sign-on (SSO) for seamless access to ecosystem apps, a persistent WebSocket-based chat system, a comprehensive financial wallet integrating traditional banking (Plaid) and various crypto wallets (WalletConnect, Phantom), an AI agent with voice capabilities (ElevenLabs), and a suite of community features like leaderboards, activity feeds, and a unique Hallmark timeline for tracking digital provenance. The project aims to establish a foundational and interconnected platform for the entire Trust Layer ecosystem, fostering user engagement and providing a secure, transparent digital environment.

## User Preferences
I prefer clear, concise instructions and explanations.
I value an iterative development process, with regular updates and opportunities for feedback.
Please ask for my explicit approval before implementing any major architectural changes or feature additions.
Ensure all code is well-documented and follows best practices for React Native development.
I prefer a dark theme UI for all applications.
Do not make changes to the `HALLMARK_AFFILIATE_HANDOFF.md` file.

## System Architecture
The application is built using React Native 0.81 and Expo SDK 54, leveraging Expo Router for file-based routing and tab navigation. The UI adheres to a strict dark-only theme (`#0c1224` base with cyan/purple accents — NO light mode per spec) and utilizes a distinctive "Cyber-Glassmorphism" design language featuring:
- **GlassCard** with `BlurView`, inner gradient overlay, and optional glow border (cyan-purple)
- **BackgroundGlow** with 5 layered gradient orbs for atmospheric depth
- **GradientText** for branded section headers and hero typography
- **GradientButton** with shadow/elevation for premium CTA buttons
- **Tab bar** with glassmorphic background, active cyan indicator line, and outline/fill icon toggle
- **FadeInDown** spring animations via `React Native Reanimated 3` on card entries
- **EmptyState** for consistent empty content displays
- All interactive elements use `Inter` font family, pill-shaped badges, rounded containers, and uppercase labels with letter-spacing for a premium fintech aesthetic.

The architecture emphasizes a strong separation of concerns:
- **API Layer**: `lib/api.ts` manages all API interactions, including authentication tokens, GET/POST requests, and SSO URL construction.
- **Authentication**: A dedicated `Auth Context` (`lib/auth-context.tsx`) handles user authentication flows (login, registration, logout, session management) and manages an `isNewRegistration` flag for onboarding.
- **Data Management**: `TanStack Query v5` is used for server state management, augmented by `React Context` for authentication state and local component state. Custom hooks in the `hooks/` directory provide live API queries with zero-value fallbacks on failure (no fake data).
- **Navigation**: A five-tab navigation structure (Home, Explore, Wallet, Chat, Profile) is implemented, complemented by a slide-in hamburger menu for secondary navigation.
- **Backend**: An Express server handles API routes for authentication, AI services, financial integrations (Plaid, WalletConnect, Phantom), multi-sig operations, news feeds, staking, affiliate programs, and chat persistence.
- **Database**: PostgreSQL with Drizzle ORM is used for data persistence, managing a wide array of schemas including users, sessions, financial accounts, multi-sig vaults, chat data, and the unique Hallmark system.
- **Hallmark System**: This core feature implements a blockchain-like audit trail with `TH-XXXXXXXX` numbered hallmarks and `SHA-256` hashing for formal records (Tier 1) and automatic audit trails (Tier 2 Trust Stamps) across the ecosystem.

Key architectural decisions include:
- **Dark-only theme**: Standardized visual identity.
- **Glassmorphism UI**: Consistent aesthetic across interactive elements.
- **PWA support**: Ensures web accessibility and offline capabilities.
- **Modular components**: Promotes reusability and maintainability.
- **Zero-value Fallbacks**: All hooks return zeros/empty arrays on API failure — never fake data. Users see their real balances or nothing.
- **Single Sign-On (SSO)**: Facilitates seamless transitions between the Hub and 32 ecosystem applications.
- **Cross-App Hashing**: The `[PREFIX]-[8-DIGIT-PADDED]` hallmark format and universal `uniqueHash` affiliate ID interconnect all 33 applications, forming a cohesive ecosystem.

## External Dependencies
- **Authentication & Communication:**
    - **Resend**: For email verification and password reset emails.
    - **Twilio**: For SMS 2FA codes and compliant SMS opt-in.
- **Financial Services:**
    - **Plaid**: For linking bank accounts and accessing transaction data (sandbox mode).
    - **WalletConnect**: Coming Soon — Ethereum-based external crypto wallet integration.
    - **Phantom**: Coming Soon — Solana-based external crypto wallet deep link integration.
- **AI & Voice:**
    - **OpenAI**: For AI agent chat streaming.
    - **ElevenLabs**: For text-to-speech (TTS) capabilities for the AI agent.
- **Database:**
    - **PostgreSQL**: Primary data store, accessed via Drizzle ORM.
- **Cloud Infrastructure:**
    - **Neon**: (Implied by Drizzle setup) for serverless PostgreSQL.
- **Styling & UI Effects:**
    - **@expo/vector-icons**: For consistent iconography.
    - **expo-secure-store**: For secure token storage.
    - **AsyncStorage**: For user preferences and onboarding state.
    - **expo-blur**: For glassmorphism effects.
    - **expo-linear-gradient**: For gradient effects.
    - **@react-native-masked-view/masked-view**: For gradient text effects.
- **QR Code Generation:**
    - **react-native-qrcode-svg**: For generating QR codes.
    - **react-native-svg**: Supporting SVG rendering for QR codes.
- **News Feeds:**
    - **fast-xml-parser**: RSS/XML parsing for real-time news feeds.

## News Architecture
Three-tier tabbed news system on the home dashboard:
- **Local News**: Google News RSS search by city (resolved from user's zip code via Zippopotam.us API). Zip code stored in AsyncStorage.
- **National News**: BBC Business, BBC Tech, NYT Business, NYT Tech, CryptoCompare. Interleaved by category for balanced coverage.
- **World News**: NYT Homepage, BBC News, BBC Science, NYT World.
- Backend: `server/news.ts` — RSS feed aggregation with 10-minute cache, deduplication, category mapping. No API keys required.
- Frontend: `hooks/useLatestNews.ts` (useNationalNews, useLocalNews), `hooks/useWorldNews.ts`
- API endpoints: `GET /api/news/national`, `GET /api/news/world`, `GET /api/news/local?zip=XXXXX`, `GET /api/news/zip-lookup?zip=XXXXX`

## DeFi Suite (Aligned with dwtl.io)
Staking, swap, and tokenomics aligned with the Trust Layer DeFi spec:
- **5 Staking Pools**: Liquid Flex (10% APY, no lock, min 100 SIG), Core Guard 45 (14%, 45d, 500), Core Guard 90 (18%, 90d, 1000), Core Guard 180 (24%, 180d, 2500), Founders Forge (30%, 365d, 5000)
- **Boost APY**: +2% to +8% via Staking Quests
- **Liquid Staking**: SIG → stSIG at 1:1 exchange rate; stSIG usable in other DeFi
- **DEX Swap**: 0.3% fee (30 bps), constant product formula. Pairs: SIG/Shells, SIG/stSIG, SIG/USDC, SIG/USDT
- **Tokenomics**: SIG = $0.01 (presale), Shells = $0.001, 1B total supply
- **Allocation**: Treasury 50%, Staking Rewards 15%, Dev/Team 15%, Ecosystem Growth 10%, Community Rewards 10%
- **Endpoints**: GET /api/staking/pools, GET /api/staking/stats, POST /api/staking/stake, POST /api/staking/unstake, POST /api/staking/claim, POST /api/liquid-staking/stake, POST /api/liquid-staking/unstake, POST /api/wallet/swap
- **Backend**: `server/staking.ts`
- **Hooks**: `hooks/useStaking.ts` (useStakingInfo, useStakingPools, useStakingStats, useStake, useUnstake, useClaimRewards, useLiquidStake, useLiquidUnstake)
- **Liquid Staking UI**: Wallet tab has Mint stSIG / Redeem SIG buttons wired to `/api/liquid-staking/stake` and `/api/liquid-staking/unstake`
- **Boost APY**: All reward calculations use `baseApy + boostApy` (total APY), not just baseApy

## Welcome Modal
- `components/WelcomeModal.tsx`: First-visit popup explaining the Trust Layer ecosystem
- Shows 5 key features (wallet, bank/Stripe connections, affiliate program, 32-app ecosystem, trust stamps)
- Network stats: 200K+ TPS, 400ms blocks, 32 apps
- CTA: Create Account or Explore as Guest
- Persisted via AsyncStorage (`hasSeenWelcome_v1`)
- Rendered on home screen (`app/(tabs)/index.tsx`)

## Pulse Integration (Cross-App)
- **Backend proxy**: `server/pulse.ts` fetches from `https://darkwavepulse.com/api/public/market-summary` and `/stats`
- **60-second in-memory cache** with graceful fallback (serves cached data or empty state if Pulse is unavailable)
- **Proxy endpoints**: `GET /api/pulse/summary`, `GET /api/pulse/stats`
- **Frontend hook**: `hooks/usePulse.ts` (usePulseSummary, usePulseStats)
- **Home widget**: "Market Pulse" glassmorphic card on home dashboard showing top 3 trading signals with direction, confidence bars, price, market sentiment, prediction accuracy badge, and total predictions count
- **Deep link**: Tapping widget navigates to Pulse app detail (appId 13)
- **Conditionally rendered**: Widget only shows when Pulse data is available

## Hamburger Menu
- `components/HamburgerMenu.tsx`: Slide-in navigation
- Items: Multi-Sig (conditional), Leaderboard, Stripe Dashboard, Guardian Scanner, Hallmark, Developer Portal, Settings, Support

## Developer Portal
- **In-App Tab**: `app/(tabs)/developer.tsx` — hidden Developer tab, unlocked via PIN 0424
- **Activation**: Profile page footer — tap "Trust Layer Hub v1.0.0" 5 times to trigger PIN entry modal. Deactivate by tapping 3 times when active, or via "Exit" button on the Dev tab.
- **PIN stored**: `AsyncStorage("devModeActive")` — persists across sessions, clears on logout
- **Auth context**: `isDevMode`, `activateDevMode(pin)`, `deactivateDevMode()` in `lib/auth-context.tsx`
- **No admin roles**: All users are "user" role. PIN is purely client-side gating — no special server permissions
- **Backend**: `server/developer-portal.ts`
  - `GET /api/developer/stats` (auth) — aggregated system stats (DB counts, blockchain status, Pulse status, server info, endpoint catalog)
  - `GET /api/developer/health` (auth) — service health checks (server, database, blockchain, pulse)
  - `GET /developer` — web fallback developer portal HTML page
- **Dev tab shows**: health status bar, system overview (user/session/hallmark/stamp counts), server info (uptime/node/memory/env), blockchain stats (block time/TPS/accounts), Pulse stats (signals/sentiment/accuracy), integrations status, collapsible API endpoint catalog with filters, quick links
- **Hook**: `hooks/useDeveloperStats.ts` (useDeveloperStats, useDeveloperHealth) — auto-refreshes 60s/30s
- **Production-safe**: Uses AbortController pattern (not AbortSignal.timeout) for external API calls

## Account Recovery
- **Forgot Password**: 3-step flow (email → code → new password)
  - Backend: `POST /api/auth/forgot-password` (sends 6-digit code via Resend), `POST /api/auth/reset-password` (validates code, updates password, invalidates all sessions)
  - Frontend: `app/forgot-password.tsx` — multi-step screen with code input, password requirements display
  - Password reset creates a trust stamp (`trusthub-password-reset`)
  - Code expires in 10 minutes; follows same verification pattern as email/2FA codes
- **Forgot Username**: Email-based recovery
  - Backend: `POST /api/auth/forgot-username` (sends username to email via Resend)
  - Frontend: `app/forgot-username.tsx` — single-step screen with confirmation
  - Resend service: `sendUsernameRecoveryEmail()` in `server/services/resend.ts`
- Both screens accessible from login page via "Forgot password?" / "Forgot username?" links
- Security: All responses use neutral messaging ("If an account exists...") to prevent email enumeration

## Remember Me & Biometric Auth
- **Remember Me toggle**: Login screen checkbox — 30-day session (checked) vs 24-hour session (unchecked)
  - Backend: `rememberMe` flag in `POST /api/auth/login` controls session duration
  - Security info bubble explains session duration policy
- **Biometric Login** (native only, expo-local-authentication):
  - Enable/disable via Profile > Settings > Biometric Auth toggle
  - Login screen shows prominent biometric button when enabled
  - Credentials stored in AsyncStorage on device (cleared on logout)
  - Auth context: `biometricsAvailable`, `biometricsEnabled`, `loginWithBiometrics()`, `enableBiometrics()`, `disableBiometrics()`

## Blockchain Connection (dwtl.io) — LIVE
- **Backend proxy**: `server/blockchain.ts` connects to `https://dwtl.io` for all on-chain data
- **Address derivation**: `0x` + SHA256(`trustlayer:member:` + userId).slice(0, 40)
- **Proxy endpoints**:
  - `GET /api/balance` — SIG, stSIG from chain (via `/api/wallets/:address/balances`)
  - `GET /api/shells/my-balance` — Shells balance from chain
  - `GET /api/user/transactions` — Transaction history from chain
  - `GET /api/user/dwc-bag` — Portfolio bag from chain balances
  - `GET /api/network/stats` — Block time, TPS, accounts, supply from chain
  - `GET /api/blockchain/wallet` — Full wallet info + balances from chain
  - `GET /api/blockchain/tlid/:tlidId` — TLID resolution from chain
  - `GET /api/swap/pairs` — Swap pairs from chain DEX
  - `GET /api/swap/quote` — Price quotes from chain
  - `GET /api/liquid-staking/rate` — stSIG:SIG rate from chain
- **Staking routes** (`server/staking.ts`) updated to proxy through dwtl.io:
  - GET pools/positions pull real data with fallback to hardcoded values
  - POST stake/unstake/claim/liquid-stake proxy to chain with SSO token exchange
  - Swap executes on chain with fallback to local rate table
- **30-second cache** on public GET endpoints for performance
- **Graceful fallback**: All endpoints return safe defaults if chain is unreachable