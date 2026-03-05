# Explore Hub Page — Full Agent Handoff Document

## Overview

The Explore Hub (`client/src/pages/explore-hub.tsx`) is the main homepage of Happy Eats (route `/`). It's a self-contained page — it does NOT use the shared Navbar or layout wrapper from App.tsx. It renders its own sticky header, video hero, content sections, ecosystem carousel, and footer.

**Route:** `/` (when not on a Trust Layer domain)
**File:** `client/src/pages/explore-hub.tsx` (559 lines)
**Footer:** `client/src/components/layout/footer.tsx` (376 lines) — exports `Footer` and `EcosystemCarousel`

---

## Page Structure (top to bottom)

### 1. Background Layer
- Full-page gradient: `bg-gradient-to-b from-[#070b16] via-[#0c1222] to-[#070b16]`
- Three large blurred radial glow circles for ambient lighting:
  - Top-left: orange (`bg-orange-500/[0.03]`, 600px, blur-[120px])
  - Bottom-right: violet (`bg-violet-500/[0.03]`, 500px, blur-[120px])
  - Center: cyan (`bg-cyan-500/[0.02]`, 800px, blur-[150px])
- These are `pointer-events-none` and purely decorative

### 2. Sticky Header Bar
- `sticky top-0 z-50` with `bg-[#070b16]/70 backdrop-blur-2xl border-b border-white/[0.04]`
- Left: Home button (ghost icon button, links to `/`)
- Center: Title "Explore Happy Eats" + subtitle "{N} features to discover"
- Right: Wrench icon (links to `/command-center`) + search input (desktop only, `hidden sm:flex`)
- Search input: `w-52 h-9`, rounded-xl, very subtle bg (`bg-white/[0.04]`), border `border-white/[0.08]`
- Padding: `px-3 sm:px-4 py-1.5 sm:py-2`

### 3. Coming Soon Banner
- Imported from `@/components/coming-soon-banner`
- Renders between header and hero
- Orange/amber gradient bar with Rocket icon + "Coming Soon" text
- Full-width, centered text

### 4. Video Hero Header
- `section` element, `h-[60vh] sm:h-[70vh]`, `overflow-hidden`
- **data-testid:** `video-flyover-hero`

#### Video Setup
- 5 looping flyover videos auto-rotate (plays one, advances to next on `ended` event):
  1. `flyover-food-trucks.mp4` — "Food Trucks"
  2. `flyover-commercial.mp4` — "Commercial Fleet"
  3. `flyover-delivery.mp4` — "Local Delivery"
  4. `flyover-office.mp4` — "Office Services"
  5. `flyover-hub.mp4` — "Delivery Hub"
- Videos stored in `client/src/assets/videos/`
- `<video>` element: `autoPlay`, `muted` (initially), `playsInline`, `preload="auto"`, `object-cover`
- Video rotation logic: `useRef` for video element + index ref, `ended` event listener advances to next, wraps around
- Gradient overlay on top of video: `bg-gradient-to-b from-black/60 via-black/40 to-black`

#### Hero Content (centered over video)
- `z-10`, flex column centered, text-center
- Framer Motion entrance: `opacity: 0, y: 20` -> `opacity: 1, y: 0`, delay 0.2s
- Headline: `text-3xl sm:text-4xl md:text-5xl font-bold text-white` — "Everything in one place"
- Subheadline: `text-base sm:text-lg text-white font-medium` with heavy text-shadow — "Food trucks, fleet services, local delivery, office catering — explore every way we serve you."
- Current video label shown below: `text-sm text-white/80 font-semibold tracking-wide` with text-shadow

#### Video Navigation Dots + Mute Button
- Positioned `absolute bottom-6 left-1/2 -translate-x-1/2 z-30`
- 5 circular dot buttons (10px x 10px each):
  - Active dot: `bg-orange-400`
  - Inactive: `bg-white/30 hover:bg-white/50`
  - Clicking a dot jumps to that video
- Mute/unmute toggle button: `size-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10`
  - Shows `VolumeX` when muted, `Volume2` when unmuted (from lucide-react)

### 5. Mobile Search Bar
- `sm:hidden` — only shows on mobile
- Same style as desktop search but full-width (`w-full h-10`)
- Appears below the hero, above the category sections

### 6. Category Sections (the main content)

#### Data Structure
Each category has:
```typescript
interface ExploreCategory {
  title: string;        // Section heading
  icon: React.ReactNode; // Lucide icon
  gradient: string;     // Tailwind gradient classes for accent
  description: string;  // Shown in the info modal
  cards: ExploreCard[];
}

interface ExploreCard {
  label: string;        // Card title
  description: string;  // Card subtitle
  href: string;         // Link destination
  icon: React.ReactNode;
  image: string;        // Photorealistic background image
  glowColor: string;    // Hover glow shadow class
  badge?: string;       // Optional badge text (e.g., "Live", "Free", "Coming Soon")
  featured?: boolean;   // If true, gets larger card treatment
}
```

#### 5 Categories Currently Defined:

**1. Food & Ordering** (gradient: orange to amber)
- Cards: Order Food (featured, "Live" badge), Kitchen Menu ("Coming Soon" badge), Track My Order

**2. Vendors & Partners** (gradient: emerald to teal)
- Cards: Browse Vendors (featured), Become a Vendor ("Free" badge), Vendor Login

**3. Earn & Grow** (gradient: violet to fuchsia)
- Cards: Affiliate Program (featured, "Earn $$$" badge), Investor Info, Roadmap

**4. Driver Tools** (gradient: blue to cyan)
- Cards: Trucker Talk (featured), Weather, GPS Finder, CDL Directory, Mileage Tracker

**5. Explore More** (gradient: rose to orange)
- Cards: Zone Map (featured), Blog, Concierge, Homepage, Team Login, GarageBot ("Partner" badge, external link), Games & Fun

#### Category Section Header
- Flex row with: section title (uppercase, tracked, `text-sm font-bold text-white/70`), info button (tiny circle, opens modal), gradient divider line, card count
- Info button opens `CategoryInfoModal` — glassmorphism modal listing all cards in that category with descriptions

#### Bento Grid Layout
- `grid grid-cols-2 gap-2.5 sm:gap-3`
- On `md:` screens: `md:grid-cols-3`
- Featured card spans `col-span-2 md:col-span-1` and if category has >2 non-featured cards, featured spans `md:row-span-2`
- Non-featured cards fill remaining grid slots

### 7. BentoCard Component (how cards are dressed)

**CRITICAL DESIGN RULE: Every card uses a photorealistic background image with gradient overlays. No blank cards with just text.**

#### Card Structure:
```
[Outer wrapper] — Link or <a> for external
  [motion.div] — hover scale 1.02, y: -3; tap scale 0.98
    [Background layer]
      <img> — full-bleed object-cover, brightness-110, group-hover:scale-110 (700ms zoom)
      [Gradient overlay 1] — bg-gradient-to-t from-black/90 via-black/60 to-black/30
      [Gradient overlay 2] — bg-gradient-to-br from-black/20 to-black/50
    [Content layer] — positioned at bottom (justify-end)
      [Badge] — top-right corner, emerald pulsing badge if present
      [Label] — bold white text with drop-shadow
      [Description] — smaller white/60 text, line-clamp-2
      [Explore arrow] — "Explore >" in tiny uppercase tracking text, white/30 -> white/70 on hover
```

#### Card Sizing:
- Featured: `min-h-[160px]`, padding `p-5`, text `text-base` title / `text-xs` desc
- Normal: `min-h-[140px]`, padding `p-3`, text `text-sm` title / `text-[10px]` desc

#### Card Styling Details:
- Border: `border-white/[0.08] hover:border-white/[0.18]`
- Rounded: `rounded-2xl`
- Each card has a unique `glowColor` shadow class (e.g., `shadow-orange-500/30`) applied on hover via `hover:shadow-xl`
- Active press: `active:scale-[0.97]`
- Transition: `transition-all duration-300`
- Image zoom on hover: `group-hover:scale-110 transition-transform duration-700 ease-out`

#### Card Images
All card images are in `client/src/assets/images/uc/` directory:
- `food_ordering.png`, `kitchen_menu.png`, `browse_vendors.png`, `become_vendor.png`
- `track_order.png`, `affiliate.png`, `trucker_talk.png`, `weather.png`
- `cdl_training.png`, `team_login.png`, `homepage.png`, `gps_finder.png`
- `concierge.png`, `zone_map.png`, `blog.png`, `investors.png`, `games_arcade.png`

These are PNG files imported at the top of the file using Vite asset imports.

#### Badge Styling:
- `bg-emerald-500/30 text-emerald-200 border-emerald-400/30`
- `text-[9px] px-2 py-0.5 backdrop-blur-md animate-pulse shadow-lg shadow-emerald-500/20`

### 8. Ecosystem Carousel (before footer)

**Component:** `EcosystemCarousel` exported from `client/src/components/layout/footer.tsx`

- Heading: "Ecosystem" with Zap icons on either side
- Horizontal scrollable carousel with snap-center behavior
- 10 ecosystem brand cards:
  1. TL Driver Connect, 2. Happy Eats, 3. GarageBot, 4. DarkWave Studios
  5. TrustShield, 6. TLID, 7. TrustVault, 8. Trust Layer, 9. Signal, 10. OrbitStaffing
- Each card: `h-[130px]`, `width: 78vw / max-width: 400px`, snap-center
- Card has photorealistic background image from `client/src/assets/images/eco/` directory
- Active card: `border-cyan-500/30 shadow-lg shadow-cyan-500/10 scale-100`
- Inactive cards: `border-white/[0.06] opacity-60 scale-95`
- Navigation: left/right chevron buttons + dot indicators (active dot is cyan, wider pill shape)
- Ecosystem images: `*.png` files in `client/src/assets/images/eco/`

### 9. Footer

**Component:** `Footer` exported from `client/src/components/layout/footer.tsx`

#### Footer Background:
- Gradient: `bg-gradient-to-b from-[#070b16] via-[#0a0f1e] to-[#050810]`
- Radial overlay: violet glow at top
- Bottom edge: cyan gradient line

#### Footer Content (top to bottom):

**A. Top Divider**
- Orange gradient line (1px) + violet gradient line (2px)

**B. Brand Block (centered)**
- TL Driver Connect icon (cyan/blue gradient square, Truck icon inside)
- "TL Driver Connect" text + "by DarkWave Studios" subtext
- Description: explains TL Driver Connect is nationwide, Happy Eats is first tenant
- Social media buttons: Facebook (blue), Instagram (pink/purple/orange), X (gray), TikTok (dark gray)
  - Each is a `size-8 rounded-lg` with gradient background, `text-[10px] font-bold` label

**C. Link Columns (2-column grid)**

Column 1 — "Platform":
- Order Food, Browse Vendors, Kitchen Menu, Track Order, Zone Map, Affiliate Program
- Links hover to `text-orange-300`

Column 2 — "Driver Tools":
- Trucker Talk, Weather & Roads, GPS Finder, CDL Directory, Mileage Tracker, Concierge
- Links hover to `text-cyan-300`

**D. Company Links (centered, wrapped row)**
- About, Blog, Investor Info, Contact Us, Support, Team, Trust Layer, Report a Bug
- Links hover to `text-violet-300`

**E. Legal Links (centered row, separated by divider line above)**
- Terms of Service, Privacy Policy, Affiliate Disclosure
- `text-xs text-white/30`

**F. Copyright Block (centered, bottom)**
- "© 2026 DarkWave Studios, LLC • All rights reserved"
- "Secured by TrustShield | Powered by DarkWave" (with links)
- "Built with [heart] for drivers everywhere"

---

## Animation Patterns

- **Category sections** use Framer Motion staggered entrance: `opacity: 0, y: 30` -> `opacity: 1, y: 0`, delay = `index * 0.08`
- **Cards** use `whileHover` scale/y transform and `whileTap` shrink
- **Hero content** fades in with y-offset
- **Search empty state** fades in with opacity transition

## Search Functionality

- Single search input filters across ALL categories and cards
- Filters by card `label` and `description` (case-insensitive `.includes()`)
- If no results: shows Search icon + "No features match" + clear button
- Empty categories are hidden when filtering

## Design Rules Summary

1. **Dark theme throughout** — backgrounds use `#070b16`, `#0c1222`, `#0a0f1e`
2. **Every card has a photorealistic background image** — no blank text-only cards
3. **Image treatment**: `brightness-110` filter + double gradient overlay (vertical dark + diagonal dark)
4. **Glassmorphism**: `backdrop-blur-xl` or `backdrop-blur-2xl` on overlays and header
5. **Borders**: Very subtle `border-white/[0.04]` to `border-white/[0.08]`, brighter on hover
6. **Accent colors**: Orange (#FF7849) primary, with violet, cyan, emerald, rose as category accents
7. **Typography**: White text with varying opacity (`text-white`, `text-white/70`, `text-white/50`, `text-white/30`)
8. **Touch targets**: All interactive buttons meet 44px minimum (search input is h-9/h-10, dots are 10px but have padding)
9. **Mobile-first**: 2-column grid on mobile, 3 columns on `md:`, responsive padding, separate mobile search bar
10. **Framer Motion**: Used for entrance animations, hover effects, and modal transitions

## Key Files Reference

| File | Purpose |
|------|---------|
| `client/src/pages/explore-hub.tsx` | Main page component |
| `client/src/components/layout/footer.tsx` | Footer + EcosystemCarousel |
| `client/src/components/coming-soon-banner.tsx` | Coming Soon banner component |
| `client/src/assets/videos/flyover-*.mp4` | 5 hero flyover videos |
| `client/src/assets/images/uc/*.png` | 17 card background images |
| `client/src/assets/images/eco/*.png` | 10 ecosystem brand images |

## How to Add a New Card

1. Add the image to `client/src/assets/images/uc/` (PNG, photorealistic style)
2. Import it at the top of `explore-hub.tsx`: `import imgNewThing from "@/assets/images/uc/new_thing.png";`
3. Add an entry to the appropriate category's `cards` array:
```typescript
{
  label: "New Feature",
  description: "Short description of what this does",
  href: "/new-feature",
  icon: <SomeIcon className="size-5" />,
  image: imgNewThing,
  glowColor: "shadow-orange-500/20",
  badge: "New",        // optional
  featured: false      // set true for larger card treatment
}
```

## How to Add a New Category

Add to the `categories` array with:
```typescript
{
  title: "Category Name",
  icon: <SomeIcon className="size-4" />,
  gradient: "from-color-500 to-color-500",
  description: "Full description for the info modal",
  cards: [ /* card entries */ ]
}
```

## How to Add a New Hero Video

1. Add the `.mp4` file to `client/src/assets/videos/`
2. Import it at the top: `import flyoverNewVideo from "@/assets/videos/flyover-new-video.mp4";`
3. Add to the `HERO_VIDEOS` array: `{ src: flyoverNewVideo, label: "Label Text" }`

## How to Add an Ecosystem Brand

In `client/src/components/layout/footer.tsx`:
1. Add image to `client/src/assets/images/eco/`
2. Import the image at the top of footer.tsx
3. Add to `ecosystemBrands` array:
```typescript
{
  name: "Brand Name",
  tagline: "Short tagline",
  url: "https://example.com",
  image: importedImage,
  color: "from-color-400 to-color-500"
}
```
