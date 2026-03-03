import { pgTable, text, timestamp, boolean, serial, integer, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  firstName: text("first_name"),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  uniqueHash: text("unique_hash").unique(),
  role: text("role").default("user").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  type: text("type").notNull(), // "email_verify" | "sms_2fa" | "password_reset"
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hallmarks = pgTable("hallmarks", {
  id: serial("id").primaryKey(),
  thId: text("th_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  appId: text("app_id"),
  appName: text("app_name"),
  productName: text("product_name"),
  releaseType: text("release_type"),
  metadata: jsonb("metadata"),
  dataHash: text("data_hash").notNull(),
  txHash: text("tx_hash"),
  blockHeight: text("block_height"),
  qrCodeSvg: text("qr_code_svg"),
  verificationUrl: text("verification_url"),
  hallmarkId: integer("hallmark_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trustStamps = pgTable("trust_stamps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  category: text("category").notNull(),
  data: jsonb("data"),
  dataHash: text("data_hash").notNull(),
  txHash: text("tx_hash"),
  blockHeight: text("block_height"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trusthubCounter = pgTable("trusthub_counter", {
  id: text("id").primaryKey().default("th-master"),
  currentSequence: text("current_sequence").default("0").notNull(),
});

export const linkedAccounts = pgTable("linked_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  plaidAccessToken: text("plaid_access_token").notNull(),
  plaidItemId: text("plaid_item_id").notNull(),
  accountId: text("account_id").notNull(),
  institutionName: text("institution_name"),
  institutionId: text("institution_id"),
  accountType: text("account_type"),
  accountSubtype: text("account_subtype"),
  accountMask: text("account_mask"),
  balance: text("balance").default("0"),
  currency: text("currency").default("USD"),
  lastSynced: timestamp("last_synced"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const externalWallets = pgTable("external_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  address: text("address").notNull(),
  chain: text("chain").notNull(),
  walletType: text("wallet_type").notNull(),
  label: text("label"),
  lastSynced: timestamp("last_synced"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const multisigVaults = pgTable("multisig_vaults", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  vaultName: text("vault_name").notNull(),
  threshold: integer("threshold").notNull(),
  coSigners: jsonb("co_signers"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const multisigTransactions = pgTable("multisig_transactions", {
  id: serial("id").primaryKey(),
  vaultId: integer("vault_id").notNull().references(() => multisigVaults.id),
  amount: text("amount").notNull(),
  destination: text("destination").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(),
  signatures: jsonb("signatures"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateReferrals = pgTable("affiliate_referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredUserId: integer("referred_user_id").references(() => users.id),
  referralHash: text("referral_hash").notNull(),
  platform: text("platform").default("trusthub").notNull(),
  status: text("status").default("pending").notNull(),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referralId: integer("referral_id").references(() => affiliateReferrals.id),
  amount: text("amount").notNull(),
  currency: text("currency").default("SIG").notNull(),
  tier: text("tier").default("base").notNull(),
  status: text("status").default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatChannels = pgTable("chat_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon").default("chatbubbles"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stripeConnections = pgTable("stripe_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stripeAccountId: text("stripe_account_id"),
  stripeCustomerId: text("stripe_customer_id"),
  accessToken: text("access_token"),
  connected: boolean("connected").default(false).notNull(),
  businessName: text("business_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
