# Design System Document: The Vigilant Luminescence

## 1. Overview & Creative North Star: "The Midnight Concierge"
The Creative North Star for this design system is **"The Midnight Concierge."** In the high-stakes environment of roadside assistance, the UI must act as a calm, authoritative guide through the dark. We are moving away from the "utility-app" aesthetic and toward a high-end, editorial experience that feels both futuristic and reassuring.

This design system breaks the traditional rigid grid by utilizing **intentional asymmetry** and **tonal depth**. Instead of centering every element, we use heavy typographic weighting and overlapping glass layers to create a sense of motion and precision. The goal is a "Digital Boutique" feel—where every interaction feels custom, intentional, and premium.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep obsidian tones, punctuated by high-energy, luminous accents.

### Color Tokens
- **Core Background:** `surface` (#0e0e0e)
- **Primary Action (Neon Cyan):** `primary` (#81ecff) to `primary_container` (#00e3fd) gradient.
- **Alert/Warning (Amber):** `tertiary` (#ffd16f)
- **Error/Emergency:** `error` (#ff716c)
- **Surface Tiers:** `surface_container_lowest` (#000000) through `surface_container_highest` (#262626)

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined solely through background color shifts. A `surface_container_low` card sitting on a `surface` background provides all the definition needed. This creates a seamless, fluid interface that feels carved rather than constructed.

### The "Glass & Gradient" Rule
To achieve a "futuristic" soul, use Glassmorphism for all floating elements (modals, bottom sheets, navigation bars). 
- **Effect:** Apply `surface_variant` at 40% opacity with a `backdrop-filter: blur(24px)`.
- **Gradients:** Main CTAs should never be flat. Use a linear gradient from `primary` to `primary_dim` at a 135-degree angle to provide a metallic, high-tech sheen.

---

## 3. Typography: The Editorial Edge
We use a dual-font approach to balance futuristic precision with readable utility.

- **Display & Headlines:** **Space Grotesk.** This is our brand’s voice. Use `display-lg` (3.5rem) with tight letter spacing (-0.02em) for hero moments. Its geometric quirks convey a high-tech, automotive precision.
- **Body & Functional UI:** **Inter.** Chosen for its mathematical clarity. Use `body-md` (0.875rem) for most data-heavy sections to ensure maximum readability under stressful conditions (e.g., at the side of a highway).

**Hierarchy Principle:** Use extreme scale contrast. A massive `headline-lg` title paired with a tiny, all-caps `label-sm` creates an editorial "magazine" look that feels premium and curated.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, depth is not a shadow; it is a light-source.

- **The Layering Principle:** Stacking is the new shadowing. Place a `surface_container_highest` element inside a `surface_container_low` parent to create a natural, "inset" or "raised" look.
- **Ambient Shadows:** Shadows should be used only for top-level floating elements. Use a blur of 40px, 0px offset, and a color derived from `surface_tint` at 6% opacity. This mimics the glow of a screen in the dark rather than a physical shadow.
- **The "Ghost Border" Fallback:** If a container requires extra definition (e.g., over a complex map), use the `outline_variant` token at 15% opacity. This "Ghost Border" is the only exception to the No-Line rule.

---

## 5. Components

### Buttons: The Kinetic Engine
- **Primary:** Gradient (`primary` to `primary_container`). `xl` rounding (3rem). Height: 56px. Label: `title-sm` (Inter, Semibold).
- **Secondary (Glass):** Background: `surface_variant` at 20% opacity. Border: Ghost Border (15% `outline_variant`). Backdrop-blur: 12px.
- **Disabled:** Background: `surface_container_highest`. Content: `on_surface_variant` at 30% opacity.

### Glass Cards & Lists
- **Rounding:** All cards must use `md` (1.5rem) or `lg` (2rem) corner radii.
- **Lists:** Forbid divider lines. Use `surface_container_low` for the list container and `surface_container_high` for the active/pressed item state. Separate items using 8px of vertical white space.
- **Nesting:** A "Battery Jumpstart" service card should be a `surface_container_low` base with a `primary` glow-pulse on the icon container.

### Inputs: The Precision Field
- **Phone & OTP:** Use `surface_container_highest` for the field background. No borders. On focus, apply a 1px "Ghost Border" using the `primary` color at 50% opacity and a subtle `primary` outer glow.
- **OTP Boxes:** High-contrast `display-sm` (Space Grotesk) characters to ensure no mistakes during data entry.

### Status Badges
- **Online:** `primary_fixed_dim` background with `on_primary_fixed` text.
- **Offline/Job Status:** `surface_container_highest` background with `on_surface_variant` text.
- **Shape:** Pill-shaped (`full` rounding) with `label-md` typography.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use intentional asymmetry. Align titles to the far left and secondary actions to the far right with significant white space between them.
- **Do** use "Breathing Room." If you think a component has enough padding, add 8px more.
- **Do** use the `tertiary` (Amber) color sparingly—only for high-priority alerts like "Mechanic Arriving" or "Safety Warning."

### Don’t:
- **Don’t** use pure white (#FFFFFF) for body text. Use `on_surface_variant` to reduce eye strain in dark mode.
- **Don’t** use standard Material Design drop shadows. They feel "default" and "cheap."
- **Don’t** use 100% opaque borders. They break the illusion of glass and light.
- **Don’t** use icons without purpose. Every icon (Tow Truck, Fuel, etc.) must be a custom, thin-line weight (1.5px stroke) to match the Inter/Space Grotesk aesthetic.