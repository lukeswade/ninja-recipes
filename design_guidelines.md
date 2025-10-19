# Ninja Creami Recipe Book - Design Guidelines

## Design Approach: Editorial Luxury Food Magazine

**Primary References**: Kinfolk magazine's minimalism, Bon Appétit's editorial sophistication, Cereal magazine's refined layouts

**Core Principle**: Create an elevated, gallery-like experience that treats each recipe as a curated editorial piece with sophisticated restraint and timeless elegance.

---

## Color Palette

**Light Mode:**
- Primary Neutral: 30 8% 25% (sophisticated charcoal)
- Surface: 40 15% 98% (warm cream)
- Card: 0 0% 100% (crisp white)
- Champagne Gold: 45 65% 70% (metallic accent)
- Merlot: 350 45% 38% (deep wine for CTAs)
- Text Primary: 30 10% 15% (rich black)
- Text Secondary: 30 6% 50% (refined gray)
- Border: 30 10% 88% (subtle dividers)

**Dark Mode:**
- Primary Neutral: 30 8% 92% (warm off-white)
- Surface: 30 12% 8% (deep charcoal)
- Card: 30 10% 12% (elevated dark)
- Champagne Gold: 45 60% 65% (warm metallic glow)
- Merlot: 350 50% 48% (lighter wine)
- Text Primary: 30 12% 95% (soft white)
- Text Secondary: 30 8% 65% (light gray)
- Border: 30 8% 20% (subtle dark dividers)

---

## Typography

**Font Families:**
- Headlines: 'Cormorant Garamond' (serif) - dramatic, high-contrast elegance
- Body/UI: 'Work Sans' (geometric sans) - clean, modern legibility

**Hierarchy:**
- Page Titles: text-5xl md:text-6xl font-light tracking-tight (Cormorant)
- Recipe Titles: text-3xl md:text-4xl font-light (Cormorant)
- Section Headers: text-2xl font-light tracking-wide (Cormorant)
- Body Text: text-base leading-loose (Work Sans)
- Meta/UI: text-sm font-medium tracking-wide uppercase (Work Sans)
- Buttons: text-sm font-semibold tracking-wider uppercase (Work Sans)

---

## Layout System

**Spacing Primitives**: Tailwind units of 4, 8, 12, 16, 20, 24, 32 (generous whitespace)

**Grid Structure:**
- Editorial Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12
- Single Column Content: max-w-4xl mx-auto
- Detail View: max-w-6xl mx-auto with 2-column layout
- Forms: max-w-3xl mx-auto

**Container Widths:**
- Full-width hero: w-full
- Content sections: max-w-7xl mx-auto px-8 md:px-12

---

## Component Library

### Navigation
**Top Bar:**
- Clean horizontal layout, h-20, border-b border-neutral/10
- Logo left (Cormorant, text-2xl font-light), centered search (underline input), user menu right
- Background: backdrop-blur-xl bg-surface/95
- Search: Minimal underline input with champagne gold accent line on focus

**Desktop Sidebar (Optional):**
- Fixed left sidebar with vertical navigation
- Filter categories with refined typography

### Recipe Cards (Editorial Grid)
**Tall Elegant Cards:**
- Aspect ratio: 3:4 (portrait orientation)
- Image: Rounded-lg, object-cover, h-[400px] md:h-[500px]
- Content below image: px-6 py-8
- Title: Cormorant, text-2xl font-light, mb-3
- Meta bar: Small caps, text-xs tracking-widest, champagne gold color
- Separator: 1px champagne gold underline, w-12, mt-4
- Shadow: shadow-sm hover:shadow-xl transition-all duration-500
- Hover: Subtle lift (translate-y-[-4px])

**Privacy Indicator:**
- Minimalist pill: top-right on image, backdrop-blur-md, px-3 py-1
- Icons only (globe/lock) with champagne gold background

### Recipe Detail View
**Hero Image:**
- Full-width, h-[65vh], object-cover with subtle dark overlay (gradient-to-b from-transparent to-black/30)
- Title overlay: Bottom third, text-5xl md:text-6xl Cormorant font-light, text-white
- Action icons: Top-right, minimal circles with backdrop-blur-md, champagne gold on hover

**Content Layout:**
- Two-column grid below hero (60/40 split on desktop)
- Left: Ingredients with elegant checkboxes, generous line-height
- Right: Author card, meta information, serving details in refined pills
- Directions: Full-width section below, numbered with large Cormorant numerals
- Photo gallery: Grid 2x2, rounded corners, gap-6

### Forms (Add/Edit Recipe)
**Sophisticated Input Style:**
- Underline inputs: Border-b-2, focus:border-champagne transition
- Labels: Small caps, tracking-widest, text-xs, mb-2
- Text areas: Subtle border, rounded-lg, focus:ring-1 ring-merlot
- Ingredient rows: Clean table layout with minimal dividers
- Add buttons: Pill-shaped, border-2 border-dashed, hover:bg-champagne/10

**Action Buttons:**
- Primary CTA: Pill-shaped (rounded-full), bg-merlot, px-8 py-3
- Secondary: Pill-shaped outline, border-2 border-neutral
- Floating Save: Fixed bottom-right, rounded-full, shadow-2xl

### Community Discovery
**Filter Bar:**
- Horizontal pill navigation: rounded-full pills, champagne gold active state
- Sort dropdown: Minimal with underline select
- Tag system: Small rounded-full pills with champagne gold borders

**Grid Layout:**
- Consistent editorial grid (no masonry)
- Section dividers: Thin champagne gold lines with centered typography
- Load more: Centered pill button with elegant hover state

### Modals & Overlays
**Share Modal:**
- Centered, max-w-md, rounded-2xl, shadow-2xl
- Recipe preview with elegant border
- Action buttons: Pill-shaped with icons, champagne gold highlights
- Success toast: Top-center, backdrop-blur, champagne gold accent

---

## Micro-interactions

**Refined Animations:**
- Card hover: translate-y-[-4px] + shadow-xl (duration-500 ease-out)
- Button hover: Subtle scale-105 for pills (duration-300)
- Favorite heart: Smooth fill with champagne gold glow
- Image lazy load: Fade-in (duration-700)
- Success states: Champagne gold pulse ring

**Interaction Principles:**
- Slow, elegant transitions (duration-500 default)
- Subtle transformations, never jarring
- Champagne gold as interactive accent color
- Hover states add refinement, not distraction

---

## Images

### Hero Sections
**Homepage Hero:**
- Full-width cinematic image, h-[75vh]
- Featured recipe with dramatic food photography
- Dark overlay gradient for text legibility
- Centered CTA: Pill button with backdrop-blur, white text, minimal border

**Recipe Detail Hero:**
- Editorial full-width hero, h-[65vh]
- Professional close-up of finished Ninja Creami creation
- Natural lighting, sharp focus, sophisticated styling
- Title overlay in bottom third with generous padding

### Recipe Cards
- Portrait orientation (3:4 aspect ratio)
- High-end food photography with editorial styling
- Consistent lighting: Natural, soft shadows
- Styling: Minimal props, focus on the dessert, neutral backgrounds
- Color grading: Warm, sophisticated tones matching champagne/merlot palette

### Image Guidelines
- Primary: Finished luxury desserts with editorial quality
- Styling: Clean plates, marble surfaces, linen napkins, metallic spoons
- Composition: Rule of thirds, negative space, refined presentation
- Placeholder: Elegant illustrated icon with champagne gold accent
- Upload zone: Dashed champagne gold border, refined camera icon

---

## Page-Specific Layouts

**Homepage:**
- Full-width hero with featured recipe (h-[75vh])
- "Your Collection" section: Editorial grid, py-20
- "Community Favorites" section: Editorial grid with section header
- Floating Add button: Bottom-right, merlot background, rounded-full

**Community Cookbook:**
- Minimal header with page title (Cormorant, text-6xl)
- Filter bar below (sticky)
- Editorial grid as primary content
- Pagination: Centered, pill-shaped page numbers

**Recipe Detail:**
- Cinematic hero image with title overlay
- Two-column content layout (ingredients/meta)
- Full-width directions section with elegant typography
- Related recipes: Horizontal scroll of tall cards

**Profile:**
- Header: Avatar (large, circular), name (Cormorant), bio (centered)
- Stats bar: Recipe count, followers (small caps, champagne gold dividers)
- User's recipes: Editorial grid with consistent spacing

---

## Dark Mode Implementation

**Warm Sophisticated Approach:**
- Backgrounds: Deep warm charcoal, not pure black
- Champagne gold: Maintains warm glow with adjusted luminosity
- Merlot: Slightly lighter for visibility
- Images: No filters, natural appearance
- Borders: Subtle, 30 8% 20%
- Form inputs: Match card background (30 10% 12%)
- Focus rings: Champagne gold with reduced opacity

**Toggle:** Icon in top nav, smooth color transitions (duration-300)

This design creates a refined, gallery-quality experience that elevates recipe browsing into an editorial journey, combining timeless sophistication with modern usability.