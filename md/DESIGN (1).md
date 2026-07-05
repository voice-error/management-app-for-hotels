---
name: R&R Management
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-kpi:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.05em
  display-kpi-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 240px
  container-gap: 1.5rem
  grid-gutter: 1rem
  data-density-padding: 0.5rem 0.75rem
  section-margin: 2rem
---

## Brand & Style

The design system is engineered for high-density, multi-tenant SaaS environments where "God-mode" visibility—the ability to parse vast amounts of operational data at a glance—is the priority. The brand personality is clinical, authoritative, and invisible; the interface recedes to allow critical metrics and status indicators to take center stage.

The aesthetic follows a **Modern Professional Minimalism** approach. It avoids decorative elements in favor of functional clarity. By utilizing a "metrics-forward" philosophy, the UI treats data as the primary visual asset. Layouts are structured to manage high cognitive loads through strict alignment, clear information hierarchy, and a reduced color palette that reserves high chroma specifically for status signaling.

## Colors

This design system uses a logic-driven color palette optimized for status monitoring and operational state-tracking.

*   **Primary (Deep Navy/Slate):** Used for navigation backgrounds, primary actions, and structural headings to ground the interface in a professional SaaS context.
*   **Success (Emerald):** Denotes active, available, or completed states.
*   **Warning (Amber):** Denotes pending, reserved, or cautious states.
*   **Danger (Rose):** Reserved for occupied, overdue, or critical error states.
*   **Neutrals:** A range of cool Slates and Grays are used to create subtle contrast between background surfaces, container borders, and secondary text, reducing visual noise in data-heavy tables.

## Typography

The typography system prioritizes legibility in dense environments. **Inter** serves as the workhorse for the majority of the UI due to its tall x-height and excellent readability at small sizes. 

For "God-mode" dashboards, the `display-kpi` level is used to make core metrics unmistakable. **JetBrains Mono** is introduced for labels, status tags, and IDs to provide a technical, "monitored" feel and to differentiate metadata from primary content. Line heights are kept tight to maximize the amount of information visible above the fold without sacrificing the vertical rhythm.

## Layout & Spacing

The design system utilizes a **Fixed-Fluid Hybrid Grid**. 
*   **Sidebar:** A fixed 240px left-hand navigation allows for persistent access to high-level modules.
*   **Main Canvas:** A fluid 12-column grid that expands to fill the viewport, ensuring maximum data "real estate" on ultra-wide monitors.

A 4px baseline grid governs all spacing. For data-heavy views, we employ a "Dense" spacing model (8px gutters) to allow complex status grids and Kanban pipelines to be viewed with minimal scrolling. Margins on the outer edges of the main canvas are set to 24px to provide "breathing room" against the chrome of the browser/OS.

## Elevation & Depth

This system avoids heavy shadows and skeuomorphism to maintain a clean, operational feel. Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines**:

1.  **Level 0 (Background):** The application canvas uses a subtle off-white/gray (`#F8FAFC`).
2.  **Level 1 (Cards/Panels):** Pure white surfaces with a 1px border (`#E2E8F0`). No shadow is used here to keep the "grid" feeling intact.
3.  **Level 2 (Overlays/Menus):** Small, sharp ambient shadows (4px blur, 5% opacity) are used only for temporary elements like dropdown menus or action tooltips to separate them from the static grid.

## Shapes

The shape language is **Soft (0.25rem)**. This slight rounding takes the "edge" off the professional interface without making it feel consumer-grade or "bubbly." 

*   **Buttons & Inputs:** 4px (0.25rem) corner radius.
*   **Cards & Modals:** 8px (0.5rem) corner radius for a distinct container definition.
*   **Status Badges:** 2px or fully square to maximize the "industrial" or "clinical" look within tables.

## Components

### Navigation & Command
*   **Left Sidebar:** Dark-themed (Deep Navy) with collapsed and expanded states. Active states use a high-contrast left-border accent in the Primary color.
*   **Action Menus:** Subtle "three-dot" vertical triggers within table rows, opening right-aligned small menus.

### Data Display
*   **KPI Cards:** Large numeral `display-kpi` at the top, a `label-mono` descriptor below, and a small sparkline or percentage-change indicator at the bottom-right.
*   **Dense Tables:** No cell padding on the horizontal; 8px vertical padding. Alternating row stripes (Zebra striping) using a 2% Slate tint.
*   **Status Badges:** Solid background with white text for critical states; subtle tinted background with colored text for secondary states.

### Interactive Elements
*   **Kanban Pipelines:** Low-contrast columns with "Card Ghosting" (transparent background/dashed border) during drag-and-drop operations.
*   **Input Fields:** Ghost-style (1px border) that shifts to a 2px Primary border on focus. 
*   **Checkboxes:** Square, using Primary color for the check state to maintain the "Operational" rigor.