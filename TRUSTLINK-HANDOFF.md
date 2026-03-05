# TrustLink — Cross-Ecosystem SSO Handoff

## What Is TrustLink

TrustLink is the Trust Layer ecosystem's single sign-on (SSO) system. It allows any user who has registered on **any** app in the 33-app ecosystem to sign into **any other** app without re-registering. Their identity, `uniqueHash` (affiliate ID), and profile travel with them.

**The user experience**: On your app's login screen, there's a "TrustLink" button. The user enters their Trust Layer email and taps TrustLink. Your app validates them against the central Trust Layer backend (`dwtl.io`), finds or creates a local account, syncs their `uniqueHash`, and logs them in. They see their name, their account, their affiliate identity — all recognized instantly.

---

## How It Works (The Flow)

```
User taps "TrustLink" on your login screen
        ↓
Your app sends their email to your own backend
        ↓
Your backend calls dwtl.io to validate the user
        ↓
dwtl.io returns: email, username, displayName, uniqueHash
        ↓
Your backend finds or creates a local user with that email
        ↓
If new user → auto-create account (email verified, hallmark generated)
If existing user → sync uniqueHash from ecosystem if it differs
        ↓
Create a local session, return user data + session token
        ↓
User is logged in — sees their profile, wallet, affiliate data
```

---

## What You Need to Implement

### 1. Backend Endpoint: `POST /api/auth/sso/verify`

This is the core TrustLink endpoint. It accepts an SSO token, validates it against the Trust Layer central backend, and returns a local session.

```typescript
app.post("/api/auth/sso/verify", async (req, res) => {
  try {
    const { sso_token, auth_token } = req.body;
    const token = sso_token || auth_token;
    if (!token) {
      return res.status(400).json({ error: "SSO token is required" });
    }

    const DWTL_BASE = "https://dwtl.io";
    let ecosystemUser = null;

    // Method 1: Exchange token via dwtl.io
    try {
      const verifyRes = await fetch(`${DWTL_BASE}/api/auth/exchange-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubSessionToken: token }),
      });
      if (verifyRes.ok) {
        ecosystemUser = await verifyRes.json();
      }
    } catch {}

    // Method 2: Bearer token validation (fallback)
    if (!ecosystemUser && token.length >= 48) {
      try {
        const meRes = await fetch(`${DWTL_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          ecosystemUser = meData.user || meData;
        }
      } catch {}
    }

    if (!ecosystemUser || !ecosystemUser.email) {
      return res.status(401).json({ error: "Invalid or expired SSO token" });
    }

    // --- CRITICAL: Sync the uniqueHash ---
    const ecosystemHash = ecosystemUser.uniqueHash || ecosystemUser.unique_hash || null;

    // Find or create local user
    let existingUser = await findUserByEmail(ecosystemUser.email.toLowerCase());

    if (!existingUser) {
      // Auto-create: use the ecosystem's uniqueHash so affiliate links work cross-app
      existingUser = await createUser({
        email: ecosystemUser.email.toLowerCase(),
        username: ecosystemUser.username || ecosystemUser.displayName || ecosystemUser.email.split("@")[0],
        firstName: ecosystemUser.firstName || ecosystemUser.displayName || null,
        uniqueHash: ecosystemHash || crypto.randomBytes(16).toString("hex"),
        emailVerified: true,
        role: "user",
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12), // random, user logs in via TrustLink
      });

      // Generate your app's hallmark + trust stamp for the new account
      await generateHallmark(existingUser.id);
      await createTrustStamp(existingUser.id, "account", "trustlink_registration", { source: "trustlink_sso" });
    } else if (ecosystemHash && existingUser.uniqueHash !== ecosystemHash) {
      // Sync uniqueHash from ecosystem — this ensures affiliate ID is consistent
      await updateUserUniqueHash(existingUser.id, ecosystemHash);
      existingUser.uniqueHash = ecosystemHash;
    }

    // Create local session (30-day for TrustLink users)
    const sessionToken = generateToken();
    await createSession(existingUser.id, sessionToken, 30 * 24 * 60 * 60 * 1000);

    await createTrustStamp(existingUser.id, "account", "trustlink_login", { source: "trustlink_sso" });

    res.json({
      user: {
        id: existingUser.id.toString(),
        email: existingUser.email,
        username: existingUser.username,
        firstName: existingUser.firstName,
        displayName: existingUser.firstName || existingUser.username,
        uniqueHash: existingUser.uniqueHash,
        role: existingUser.role || "user",
        emailVerified: existingUser.emailVerified,
      },
      sessionToken,
      ssoLinked: true,
    });
  } catch (error) {
    console.error("TrustLink verify error:", error?.message);
    res.status(500).json({ error: "TrustLink verification failed" });
  }
});
```

### 2. Backend Endpoint: `POST /api/auth/exchange-token`

This is the **outbound** side — when OTHER apps call YOUR app to validate one of your users. You probably already have this. Make sure it returns `uniqueHash`:

```typescript
app.post("/api/auth/exchange-token", async (req, res) => {
  const { hubSessionToken } = req.body;
  // Validate the session token in your DB
  // Find the user
  // Generate a short-lived ecosystem token
  // Return:
  res.json({
    ecosystemToken,
    expiresIn: 3600,
    userId: user.id.toString(),
    email: user.email,
    username: user.username,
    displayName: user.firstName || user.username,
    uniqueHash: user.uniqueHash,  // <-- CRITICAL: include this
  });
});
```

### 3. Frontend: Login Screen — TrustLink Button

Add a "TrustLink" button on your login screen below the regular sign-in button. The user enters their email in the existing email field, then taps TrustLink instead of the regular login button.

**Button design:**
- Icon: `link` (Ionicons) or a chain-link icon
- Label: `TrustLink`
- Style: Subtle accent border (purple/cyan), not the primary gradient button
- Below the button: hint text — "Already a Trust Layer member? Enter your email above and tap TrustLink to sign in instantly."
- Separated from the main login by a divider line with "or" text

**Flow on tap:**
1. Validate the email field isn't empty
2. Call your own backend's `POST /api/auth/sso/verify` (or a dedicated TrustLink endpoint)
3. Your backend talks to `dwtl.io` to validate the user
4. On success: store the session token, set the user, navigate to the main app
5. On failure: show a friendly error ("No Trust Layer account found for this email")

### 4. Outbound SSO: Launching Other Ecosystem Apps

When your user taps to open another ecosystem app, append their session token to the URL:

```typescript
function buildAppLaunchUrl(appUrl: string, token: string | null): string {
  if (!appUrl || !token) return appUrl;
  const sep = appUrl.includes("?") ? "&" : "?";
  return `${appUrl}${sep}auth_token=${token}`;
}
```

This way, when they arrive at the other app, it can auto-authenticate them via its own `POST /api/auth/sso/verify`.

### 5. Deep Link Handling (Optional but Recommended)

If your app is opened with `?auth_token=xxx` or `?sso_token=xxx` in the URL, auto-authenticate the user:

```typescript
// On app load, check URL params
const params = new URL(window.location.href).searchParams;
const ssoToken = params.get("auth_token") || params.get("sso_token");
if (ssoToken) {
  const success = await loginWithSSO(ssoToken);
  if (success) {
    // Navigate to main app — user is logged in
  }
}
```

---

## The uniqueHash — Why It Matters

The `uniqueHash` is every user's **permanent affiliate identity** across the entire ecosystem. It's:

- Generated once at registration (random hex string)
- Stored in the `unique_hash` column on the users table
- **The same hash across every app** — TrustLink SSO carries it
- Used to construct referral links: `https://[app-domain].tlid.io/ref/[uniqueHash]`

**When a user signs in via TrustLink**, your app MUST:
1. Check if the ecosystem user has a `uniqueHash`
2. If they do, store it (or update your local copy to match)
3. Never generate a new random hash for a TrustLink user — use the one from the ecosystem

This ensures that if Kathy signs up on Signal Chat and gets hash `a7b3c9d2e1f4`, then signs into the Hub via TrustLink, she has the **same hash** — and all her referral links work across every app.

---

## Referral Link Format (Universal)

```
https://[your-app-domain]/ref/[uniqueHash]
```

Examples:
```
https://trusthub.tlid.io/ref/a7b3c9d2e1f4
https://signalchat.tlid.io/ref/a7b3c9d2e1f4
https://trustbook.tlid.io/ref/a7b3c9d2e1f4
```

Same hash, different apps. The referral is attributed to the referrer on YOUR app's platform.

---

## API Reference: dwtl.io Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://dwtl.io/api/auth/exchange-token` | POST | Validate a session token, get user info + uniqueHash |
| `https://dwtl.io/api/auth/me` | GET (Bearer) | Fallback: validate a Bearer token, get user profile |

**Request to exchange-token:**
```json
{ "hubSessionToken": "the-token-from-the-other-app" }
```

**Response from exchange-token:**
```json
{
  "ecosystemToken": "new-short-lived-token",
  "expiresIn": 3600,
  "userId": "123",
  "email": "kathy@example.com",
  "username": "kathyg",
  "displayName": "Kathy",
  "uniqueHash": "a7b3c9d2e1f4"
}
```

---

## Checklist for Each App

- [ ] Add `POST /api/auth/sso/verify` endpoint (validates against dwtl.io, finds/creates local user, syncs uniqueHash)
- [ ] Add "TrustLink" button on login screen (link icon + "TrustLink" label)
- [ ] Add hint text below: "Already a Trust Layer member? Enter your email and tap TrustLink."
- [ ] Ensure `POST /api/auth/exchange-token` returns `uniqueHash` in response
- [ ] Sync uniqueHash on TrustLink login (don't generate a new one if ecosystem provides one)
- [ ] Append `?auth_token={sessionToken}` when launching other ecosystem apps
- [ ] (Optional) Handle `?auth_token=` / `?sso_token=` URL params on app load for auto-login
- [ ] Create trust stamp on TrustLink registration/login (category: "account", action: "trustlink_login" or "trustlink_registration")
- [ ] Test: User registers on App A → signs into App B via TrustLink → sees same uniqueHash, same affiliate link format

---

## Trust Layer Ecosystem Apps

For reference, here are all the apps that should implement TrustLink:

| App | Domain |
|-----|--------|
| Trust Layer Hub | trusthub.tlid.io |
| DarkWave Pulse | darkwavepulse.com |
| Trust Layer (main) | dwtl.io |
| DarkWave Studios | darkwavestudios.io |
| Signal Chat | signalchat.tlid.io |
| Trust Book | trustbook.tlid.io |
| Trust Vault | trustvault.tlid.io |
| TrustHome | trusthome.tlid.io |
| TrustShield | trustshield.tech |
| TLID | tlid.io |
| Trust Golf | trustgolf.app |
| DarkWave Academy | academy.tlid.io |
| Arbora | arbora.tlid.io |
| TORQUE | torque.tlid.io |
| THE VOID | intothevoid.app |
| Verdara | verdara.tlid.io |
| VedaSolus | vedasolus.io |
| Orby | getorby.io |
| ORBIT | orbitstaffing.io |
| StrikeAgent | strikeagent.io |
| TradeWorks AI | tradeworksai.io |
| GarageBot | garagebot.io |
| The Arcade | darkwavegames.io |
| LotOps | lotopspro.io |
| TL Driver | tldriverconnect.com |
| Happy Eats | happyeats.app |
| Brew&Board | brewandboard.coffee |
| Chronicles | yourlegacy.io |
| Guardian Scanner | guardianscanner.tlid.io |
| Guardian Screener | guardianscreener.tlid.io |
| PaintPros | paintpros.io |
| Nashville Painting | nashpaintpros.io |
| DWC Studio | studio.tlid.io |

---

## Notes

- **No pay gates**: TrustLink is free. Always.
- **30-day sessions**: TrustLink users get 30-day sessions (they're verified ecosystem members)
- **Email verified**: TrustLink users are auto-verified (they already verified on another app)
- **Password**: TrustLink auto-created accounts get a random password. The user logs in via TrustLink, not credentials. If they want to set a password later, they use "Forgot Password."
- **Hallmark**: When a new user is created via TrustLink, generate your app's genesis hallmark for them, just like a normal registration.
- **Trust stamps**: Log both `trustlink_registration` (first time) and `trustlink_login` (subsequent) as trust stamps.
- **CORS**: React Native apps don't send browser-style Origin headers. Your CORS config should allow `Content-Type, Authorization` headers.
