export const MOCK_USER = {
  id: "tl-001-7a3f",
  username: "satoshi_v",
  displayName: "Satoshi V.",
  email: "satoshi@trustlayer.io",
  trustLayerId: "satoshi.tlid",
  memberNumber: "#00142",
  voidTier: "Phantom",
  guardianScore: 94,
  avatarInitials: "SV",
  joinedDate: "2025-03-15",
};

export const MOCK_BALANCE = {
  sig: 125847.52,
  shells: 450000,
  stSig: 50000,
  portfolioValue: 18742.30,
  change24h: 4.7,
};

export const MOCK_TRANSACTIONS = [
  {
    id: "tx1",
    type: "received" as const,
    amount: 5000,
    asset: "SIG",
    from: "alice.tlid",
    txHash: "0x7a3f...e2b1",
    createdAt: "2026-03-03T10:30:00Z",
  },
  {
    id: "tx2",
    type: "purchase" as const,
    amount: 25000,
    asset: "Shells",
    from: "Apple IAP",
    txHash: "0x8b4e...f3c2",
    createdAt: "2026-03-02T15:45:00Z",
  },
  {
    id: "tx3",
    type: "staked" as const,
    amount: 10000,
    asset: "stSIG",
    from: "TrustVault",
    txHash: "0x9c5f...a4d3",
    createdAt: "2026-03-01T09:15:00Z",
  },
  {
    id: "tx4",
    type: "sent" as const,
    amount: 2500,
    asset: "SIG",
    from: "bob.tlid",
    txHash: "0xad6g...b5e4",
    createdAt: "2026-02-28T14:20:00Z",
  },
  {
    id: "tx5",
    type: "received" as const,
    amount: 15000,
    asset: "SIG",
    from: "Staking Rewards",
    txHash: "0xbe7h...c6f5",
    createdAt: "2026-02-27T08:00:00Z",
  },
  {
    id: "tx6",
    type: "purchase" as const,
    amount: 100000,
    asset: "Shells",
    from: "Google Play",
    txHash: "0xcf8i...d7g6",
    createdAt: "2026-02-26T17:30:00Z",
  },
];

export const MOCK_NEWS = [
  {
    id: "n1",
    title: "Guardian Scanner Reaches 1M Scans",
    body: "The Guardian Security Scanner has completed over 1 million AI agent verifications across 13+ chains, marking a major milestone for the Trust Layer ecosystem.",
    category: "Milestone",
    image: require("@/assets/images/news-hero-4.png"),
    createdAt: "2026-03-03T08:00:00Z",
  },
  {
    id: "n2",
    title: "ORBIT Staffing OS Enterprise Launch",
    body: "ORBIT Staffing OS is now available for enterprise clients. Blockchain-verified employment records and payroll management for organizations of all sizes.",
    category: "Launch",
    image: require("@/assets/images/news-hero-1.png"),
    createdAt: "2026-03-02T12:00:00Z",
  },
  {
    id: "n3",
    title: "Shell Presale: 65% Sold",
    body: "The Trust Layer Shell presale has reached 65% sold. Early adopters are securing their positions before the August 23, 2026 launch.",
    category: "Presale",
    image: require("@/assets/images/news-hero-3.png"),
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "n4",
    title: "TradeWorks AI v2.0 Released",
    body: "TradeWorks AI version 2.0 introduces advanced prediction models, portfolio optimization, and real-time market sentiment analysis.",
    category: "Update",
    image: require("@/assets/images/news-hero-2.png"),
    createdAt: "2026-02-28T14:00:00Z",
  },
  {
    id: "n5",
    title: "Trust Golf Expands to 50+ Courses",
    body: "Trust Golf now features over 50 premium golf courses with AI swing analysis, scoring, and exclusive tee time deals.",
    category: "Update",
    image: require("@/assets/images/news-hero-5.png"),
    createdAt: "2026-02-27T09:00:00Z",
  },
];

export const MOCK_CHANNELS = [
  {
    id: "ch1",
    name: "General",
    lastMessage: "Welcome to the Trust Layer community!",
    lastMessageTime: "10:30 AM",
    unread: 3,
    isPublic: true,
  },
  {
    id: "ch2",
    name: "Trading",
    lastMessage: "StrikeAgent prediction confirmed...",
    lastMessageTime: "9:45 AM",
    unread: 12,
    isPublic: true,
  },
  {
    id: "ch3",
    name: "Security Alerts",
    lastMessage: "Guardian detected suspicious contract on BSC",
    lastMessageTime: "8:15 AM",
    unread: 1,
    isPublic: true,
  },
  {
    id: "ch4",
    name: "alice.tlid",
    lastMessage: "Did you see the new Shell tier?",
    lastMessageTime: "Yesterday",
    unread: 0,
    isPublic: false,
  },
  {
    id: "ch5",
    name: "dev-team",
    lastMessage: "Deploying DWSC Studio update now",
    lastMessageTime: "Yesterday",
    unread: 0,
    isPublic: false,
  },
];

export const MOCK_MESSAGES = [
  {
    id: "m1",
    sender: "alice.tlid",
    senderInitials: "AL",
    text: "Has anyone tried the new Guardian Scanner update?",
    timestamp: "10:30 AM",
    isMe: false,
  },
  {
    id: "m2",
    sender: "You",
    senderInitials: "SV",
    text: "Yes! The multi-chain scanning is incredible. Tested it on 5 different contracts.",
    timestamp: "10:32 AM",
    isMe: true,
  },
  {
    id: "m3",
    sender: "bob.tlid",
    senderInitials: "BO",
    text: "The threat detection caught a rug pull on BSC before anyone else. Saved me thousands.",
    timestamp: "10:34 AM",
    isMe: false,
  },
  {
    id: "m4",
    sender: "alice.tlid",
    senderInitials: "AL",
    text: "That's exactly why Guardian is essential. Have you all been stacking Shells before launch?",
    timestamp: "10:35 AM",
    isMe: false,
  },
  {
    id: "m5",
    sender: "You",
    senderInitials: "SV",
    text: "Absolutely. The Whale tier is the way to go. 100k Shells for $100.",
    timestamp: "10:36 AM",
    isMe: true,
  },
  {
    id: "m6",
    sender: "charlie.tlid",
    senderInitials: "CH",
    text: "Don't forget to check the countdown timer. Less than 6 months to launch!",
    timestamp: "10:38 AM",
    isMe: false,
  },
];

export const SHELL_TIERS = [
  { name: "Starter", shells: 5000, price: 5.0 },
  { name: "Builder", shells: 25000, price: 25.0 },
  { name: "Whale", shells: 100000, price: 100.0 },
];

export const FEATURED_APP_IDS = [1, 3, 9, 11, 14, 5];
