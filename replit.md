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
The application is built using React Native 0.81 and Expo SDK 54, leveraging Expo Router for file-based routing and tab navigation. The UI adheres to a strict dark theme (`#0c1224` base with cyan/purple accents) and utilizes a distinctive "Liquid Glass" design language, featuring `GlassCard` components with `BlurView`, `LinearGradient` glows, and `FadeInDown` entry animations via `React Native Reanimated 3`. Core UI components are reusable, such as `EmptyState` for consistent empty content displays and `GradientText` for branded typography.

The architecture emphasizes a strong separation of concerns:
- **API Layer**: `lib/api.ts` manages all API interactions, including authentication tokens, GET/POST requests, and SSO URL construction.
- **Authentication**: A dedicated `Auth Context` (`lib/auth-context.tsx`) handles user authentication flows (login, registration, logout, session management) and manages an `isNewRegistration` flag for onboarding.
- **Data Management**: `TanStack Query v5` is used for server state management, augmented by `React Context` for authentication state and local component state. Custom hooks in the `hooks/` directory provide live API queries with integrated mock data fallbacks for development and resilience.
- **Navigation**: A five-tab navigation structure (Home, Explore, Wallet, Chat, Profile) is implemented, complemented by a slide-in hamburger menu for secondary navigation.
- **Backend**: An Express server handles API routes for authentication, AI services, financial integrations (Plaid, WalletConnect, Phantom), multi-sig operations, news feeds, staking, affiliate programs, and chat persistence.
- **Database**: PostgreSQL with Drizzle ORM is used for data persistence, managing a wide array of schemas including users, sessions, financial accounts, multi-sig vaults, chat data, and the unique Hallmark system.
- **Hallmark System**: This core feature implements a blockchain-like audit trail with `TH-XXXXXXXX` numbered hallmarks and `SHA-256` hashing for formal records (Tier 1) and automatic audit trails (Tier 2 Trust Stamps) across the ecosystem.

Key architectural decisions include:
- **Dark-only theme**: Standardized visual identity.
- **Glassmorphism UI**: Consistent aesthetic across interactive elements.
- **PWA support**: Ensures web accessibility and offline capabilities.
- **Modular components**: Promotes reusability and maintainability.
- **Live API with Mock Fallback**: Ensures functionality during development and provides resilience against API outages.
- **Single Sign-On (SSO)**: Facilitates seamless transitions between the Hub and 32 ecosystem applications.
- **Cross-App Hashing**: The `[PREFIX]-[8-DIGIT-PADDED]` hallmark format and universal `uniqueHash` affiliate ID interconnect all 33 applications, forming a cohesive ecosystem.

## External Dependencies
- **Authentication & Communication:**
    - **Resend**: For email verification and password reset emails.
    - **Twilio**: For SMS 2FA codes and compliant SMS opt-in.
- **Financial Services:**
    - **Plaid**: For linking bank accounts and accessing transaction data (sandbox mode).
    - **WalletConnect**: For connecting Ethereum-based external crypto wallets.
    - **Phantom**: For connecting Solana-based external crypto wallets.
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