import { pgTable, text, timestamp, boolean, serial, integer, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  firstName: text("first_name"),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
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
