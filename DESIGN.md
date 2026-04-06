# Design System Document: The Financial Ledger Editorial

## 1. Overview & Creative North Star: "The Digital Curator"
This design system moves away from the cluttered, "dashboard-heavy" aesthetics of traditional fintech apps and toward a sophisticated, high-end editorial experience. Our Creative North Star is **The Digital Curator**. 

Think of this system as a premium economic journal rather than a database. We achieve this by breaking the "template" look through intentional asymmetry—utilizing expansive white space (the "breath" of the UI) and high-contrast typography scales. We prioritize tonal depth and layered surfaces over rigid grids and harsh lines. The result is a professional environment that feels authoritative, calm, and intellectually rigorous.

---

## 2. Colors: Tonal Depth & Atmospheric UI
Our palette is anchored by the deep, trustworthy `primary` (#000666) and the organizational `primary_container` (#1A237E). However, the secret to a premium feel lies in how we treat the background.

- **The "No-Line" Rule:** To maintain an editorial feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For example, a card (using `surface_container_lowest`) should sit on a section background of `surface_container_low`. 
- **Surface Hierarchy & Nesting:** Use the `surface_container` tiers to create "nested" depth. Treat the UI as a series of stacked sheets of fine paper. 
    - *Level 0 (Base):* `surface` (#f8f9fa)
    - *Level 1 (Sections):* `surface_container_low` (#f3f4f5)
    - *Level 2 (Cards/Content):* `surface_container_lowest` (#ffffff)
- **The "Glass & Gradient" Rule:** Use Glassmorphism for floating elements (like a sticky top navigation or a "Quick Add" FAB). Use `surface_container_lowest` at 80% opacity with a 12px backdrop-blur. 
- **Signature Textures:** For primary CTAs, do not use flat fills. Apply a subtle linear gradient from `primary` (#000666) to `primary_container` (#1A237E) at a 135-degree angle to provide a "vault-like" metallic depth.

---

## 3. Typography: The Editorial Voice
We utilize a dual-font system to balance authority with high-density readability.

- **Display & Headlines (Manrope):** This is our "Editorial" voice. Manrope's wide apertures and geometric forms provide a modern, institutional feel. Use `display-lg` for landing hero moments and `headline-sm` for category titles.
- **Body & Labels (Inter):** Inter is our "Utility" voice. Its high x-height ensures financial data and bookmark descriptions remain legible at small sizes.
- **Hierarchy Tip:** Use `on_surface_variant` (#454652) for body text to reduce visual vibration against the white background, reserving the pure `on_surface` (#191c1d) for bolded headlines.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows and borders create "visual noise." We achieve hierarchy through **Tonal Layering**.

- **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` background. This creates a soft, natural lift that looks intentional and premium.
- **Ambient Shadows:** If a card must "float" (e.g., during a drag-and-drop action), use an extra-diffused shadow: `box-shadow: 0 10px 30px rgba(25, 28, 29, 0.05)`. Note the low opacity (5%) and use of the `on_surface` color as the shadow tint.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline_variant` at 20% opacity. Never use 100% opaque borders.
- **Glassmorphism:** Navigation bars should use `surface` with a blur effect, allowing the colors of the bookmarked cards to subtly bleed through as the user scrolls.

---

## 5. Components: The Curated Elements

### Cards (The Core Unit)
- **Styling:** No borders. Use `xl` (0.75rem) roundedness. 
- **Separation:** Forbid dividers. Use `spacing-6` (1.5rem) of vertical white space to separate card groups.
- **Interaction:** On hover, a card should shift from `surface_container_lowest` to `surface_container_high` with a 200ms ease-in-out transition.

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `full` roundedness, `label-md` uppercase text with 0.05em letter spacing.
- **Secondary:** Transparent background with a "Ghost Border."
- **Tertiary (Action Icons):** Use `on_surface_variant`. On hover, the icon should scale to 1.1x and shift to `primary`.

### Category Tags (Chips)
- **Styling:** Use `secondary_container` background with `on_secondary_container` text.
- **Shape:** `md` (0.375rem) roundedness to differentiate from the `full` roundedness of action buttons.

### Input Fields
- **Styling:** Minimalist approach. Only a bottom "Ghost Border" that transforms into a 2px `primary` line on focus.
- **Labels:** Always use `label-sm` in `on_surface_variant` positioned 0.5rem above the input.

### Additional Component: The "Perspective" Sidebar
A sticky navigation element using `surface_container_low`. It uses no vertical line to separate from the main content; the background color shift is the only boundary.

---

## 6. Do’s and Don’ts

### Do
- **Do** embrace asymmetry. It’s okay to have a 3-column grid where one column is twice as wide as the others to emphasize a "Featured" economic report.
- **Do** use the Spacing Scale religiously. Consistent gaps of `spacing-8` (2rem) between sections create a feeling of luxury.
- **Do** use `tertiary_container` for financial alerts or "Market Down" indicators, as its warm tone provides a sophisticated contrast to the deep blues.

### Don’t
- **Don’t** use black (#000000). Use `on_surface` (#191c1d) for all "black" elements to keep the palette soft.
- **Don’t** use standard "Drop Shadows." If it looks like a default plugin setting, it is wrong. Focus on tonal shifts first.
- **Don’t** crowd the interface. If a screen feels full, increase the padding by two steps on the Spacing Scale.