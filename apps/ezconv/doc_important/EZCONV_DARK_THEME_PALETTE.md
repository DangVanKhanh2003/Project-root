# EzConv Dark Theme Palette and Style Brief

## Goal

This document extracts the dark-theme design language from `apps/ezconv` and turns it into a portable style brief for other projects.

Use it as a design-system reference, not as a file-level implementation guide.

## Theme identity

EzConv dark theme is:

- warm, not cold
- editorial, not neon
- minimal, not glossy
- contrast-led, not shadow-led
- accent-driven, but only with one main accent

The overall mood is:

- charcoal and ash surfaces
- soft ivory text
- burnt orange as the only strong brand color
- large rounded geometry
- subtle borders instead of heavy shadows

If you recreate this theme in another product, keep the warmth and restraint. Do not add blue, purple, cyberpunk glow, or glassmorphism by default.

## Core palette

### Primary dark palette

| Role | Token idea | Value | Notes |
| --- | --- | --- | --- |
| Brand primary | `--brand` | `#C65D3B` | Burnt orange, main action color |
| Brand hover | `--brand-hover` | `#B14F2F` | Darker orange for hover/pressed |
| Brand soft | `--brand-soft` | `#D9785B` | Softer accent for highlights |
| Page background | `--bg-page` | `#1F1F1E` | Warm charcoal, main canvas |
| Card background | `--bg-card` | `#2A2A28` | Elevated surface, only slightly lighter than page |
| Soft surface | `--bg-surface-soft` | `#383836` | Pills, secondary containers, hover blocks |
| Hover surface | `--bg-hover` | `#383836` | Same family as soft surface |
| Heading text | `--text-heading` | `#E8E6E3` | Warm off-white |
| Body text | `--text-body` | `#D6D4CF` | Main reading text |
| Secondary text | `--text-secondary` | `#C9C7C2` | Support text, labels, metadata |
| Placeholder text | `--text-placeholder` | `#8A8884` | Input hint, lower priority text |
| Default border | `--border-default` | `#3A3A38` | Main card and divider border |
| Input border | `--border-input` | `#40403E` | Slightly stronger than default border |
| Subtle border | `--border-subtle` | `#2F2F2D` | Hairline dividers |
| Accent wash | `--color-accent-dark` | `rgba(198, 93, 59, 0.2)` | Hover, chip fill, focus wash |

### Semantic colors

These are less unique to EzConv, but they are used conservatively:

| Role | Value | Guidance |
| --- | --- | --- |
| Success | `#10B981` | Use for validation/success only |
| Warning | `#F59E0B` | Use for warnings only |
| Error | `#E74C3C` | Use for errors only |

Keep semantic colors local to status messages. Do not let them become secondary brand colors.

## Color behavior rules

### 1. One accent only

In dark mode, interactive emphasis shifts toward orange.

That means:

- active pills use orange text or orange fill
- selected toggles use orange
- focus hints can use orange glow
- links and primary actions use orange

Avoid adding a second bright accent.

### 2. Warm neutrals first

The dark theme is not black + white. It is built from warm gray-browns.

Preferred neutral ladder:

- `#1F1F1E` for page canvas
- `#2A2A28` for cards
- `#383836` for hover/soft blocks

This keeps the UI calm and premium.

### 3. Contrast comes from layering, not shadow

Most dark components in EzConv do not rely on big shadows.

Instead they use:

- slightly lighter card surface on a darker page
- 1px borders in nearby neutral shades
- orange tint only for active emphasis

If porting this style, remove heavy drop shadows before adding more color.

## Typography mood

Use a two-font tone when possible:

- sans-serif for interface and body
- serif display for major headings

In EzConv the visual feel is:

- UI/body: clean modern sans
- headings: more editorial and premium

Portable rule:

- headings should feel refined, not techy
- body copy should stay readable and neutral

## Shape language

EzConv uses soft, generous radii.

Recommended radius scale:

| Usage | Value |
| --- | --- |
| Small controls | `8px` |
| Inputs / cards / dropdowns | `12px` to `16px` |
| Large cards | `16px` to `28px` |
| Pills / chips / CTA buttons | `999px` or large rounded pill |
| Signature shell radius | `36px` |

Overall shape rule:

- avoid sharp corners
- avoid perfect enterprise rectangles
- prefer soft rounded forms, especially on hero inputs and main action buttons

## Component recipes

### Page shell

- Background: `#1F1F1E`
- Main text: `#E8E6E3`
- Secondary text: `#C9C7C2`
- Keep background mostly flat
- If adding pattern, keep it extremely subtle and warm

### Cards

- Background: `#2A2A28`
- Border: `1px solid #3A3A38`
- Shadow: none or very faint
- Radius: `16px` to `28px`

Cards should feel dense and calm, not floating.

### Inputs

- Surface: `#2A2A28`
- Border: `#40403E`
- Placeholder: `#8A8884`
- Text: `#E8E6E3`
- Focus: orange border or soft orange glow

EzConv-specific touch worth reusing:

- an orange animated border/glow can be used around hero inputs
- keep it soft and blurred, not neon

### Buttons

Primary button:

- Background: `#C65D3B`
- Hover: `#B14F2F`
- Text: white
- Shape: pill or rounded rectangle
- Shadow: none

Secondary neutral button:

- Background: transparent or near-black
- Border: neutral or transparent
- Text: light text
- Hover can shift toward orange if the interaction is important

Active chip / toggle:

- Text: orange
- Fill: orange at `12%` to `25%` alpha

### Badges and inline highlights

- Background: orange tint, low alpha
- Text: orange
- Radius: pill or small rounded chip

Do not use bright saturated fills for normal badges.

### Header and navigation

- Header background should match or nearly match page background
- Add a subtle bottom border
- Sticky headers can use blur, but keep opacity restrained
- Nav text stays neutral until active or hovered

### Overlays and drawers

Backdrop recipes seen in the project:

- `rgba(8, 8, 8, 0.55)`
- `rgba(15, 23, 42, 0.5)`

Portable rule:

- use a dark translucent backdrop
- keep drawer surface aligned with `--bg-card`
- avoid white drawers in dark mode

### Footer

EzConv keeps the footer brand-forward:

- solid brand orange background
- white text

This is a stronger move than the rest of the dark theme and works because the rest of the UI is so restrained.

If porting, use this only if the brand is confident enough to own the whole footer.

## Interaction patterns

### Hover

Preferred hover treatment:

- switch to `--bg-hover`
- or add a light orange wash
- avoid dramatic scale or glow

### Focus

Preferred focus treatment:

- orange border
- soft orange aura
- no blue default outline if the product wants full theme consistency

### Selected / active

Preferred selected state:

- orange text
- orange-tinted background

Do not use bright solid fills for every selected state. Save solid orange for primary actions.

## Shadows and elevation

This theme is intentionally low-shadow.

Recommended rule set:

- cards: no shadow
- dropdowns: very small shadow only when needed
- modals: moderate shadow allowed, but still restrained
- rely on surface contrast and border before relying on shadow

If a dark theme starts feeling too "web app default", reducing shadow usually gets it closer to EzConv.

## What is representative vs not representative

### Representative of the EzConv dark-theme DNA

- warm charcoal surfaces
- burnt-orange accent
- large radii
- low-shadow cards
- orange-tint active states
- off-white text instead of pure white
- subtle borders

### Less representative / do not blindly copy

Some files in the repo contain styles that are more feature-specific than brand-defining:

- bright yellow warning popup styles
- bright blue maintenance popup styles
- isolated hard-coded black/ivory button combinations in some playlist states

When porting to another project, prioritize the core palette and component rules above over those one-off exceptions.

## Portable token starter

Use this as the starting point for another project:

```css
:root[data-theme="dark"] {
  --brand: #C65D3B;
  --brand-hover: #B14F2F;
  --brand-soft: #D9785B;

  --bg-page: #1F1F1E;
  --bg-card: #2A2A28;
  --bg-surface-soft: #383836;
  --bg-hover: #383836;

  --text-heading: #E8E6E3;
  --text-body: #D6D4CF;
  --text-secondary: #C9C7C2;
  --text-placeholder: #8A8884;

  --border-default: #3A3A38;
  --border-input: #40403E;
  --border-subtle: #2F2F2D;

  --accent-fill-soft: rgba(198, 93, 59, 0.12);
  --accent-fill-strong: rgba(198, 93, 59, 0.2);

  --status-success: #10B981;
  --status-warning: #F59E0B;
  --status-error: #E74C3C;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 28px;
  --radius-pill: 999px;
}
```

## Portable component starter

```css
html[data-theme="dark"] body {
  background: var(--bg-page);
  color: var(--text-body);
}

html[data-theme="dark"] .card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: none;
}

html[data-theme="dark"] .input,
html[data-theme="dark"] .select,
html[data-theme="dark"] .textarea {
  background: var(--bg-card);
  color: var(--text-heading);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-xl);
}

html[data-theme="dark"] .input::placeholder,
html[data-theme="dark"] .textarea::placeholder {
  color: var(--text-placeholder);
}

html[data-theme="dark"] .input:focus,
html[data-theme="dark"] .select:focus,
html[data-theme="dark"] .textarea:focus {
  border-color: var(--brand);
  outline: none;
  box-shadow: 0 0 0 3px rgba(198, 93, 59, 0.14);
}

html[data-theme="dark"] .btn-primary {
  background: var(--brand);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill);
}

html[data-theme="dark"] .btn-primary:hover {
  background: var(--brand-hover);
}

html[data-theme="dark"] .chip-active {
  color: var(--brand);
  background: rgba(198, 93, 59, 0.16);
}
```

## Do / Don't summary

### Do

- use warm dark neutrals
- keep one dominant accent color
- use off-white text instead of stark white
- use borders to separate layers
- keep cards quiet and low-shadow
- use orange tint for active states
- use generous rounded corners

### Don't

- do not add blue or purple as competing accents
- do not make the background pure black everywhere
- do not use white cards in dark mode
- do not rely on heavy shadows for hierarchy
- do not make every control bright orange
- do not use neon glow or glossy gradients by default

## One-line brief for another AI

Build a warm charcoal dark theme with burnt-orange accents, ivory text, subtle neutral borders, large rounded shapes, almost no shadow, and orange-tinted active states instead of bright multi-color UI.

## Prompt template

Paste this into another AI when you want it to implement the EzConv-inspired dark theme in a different project.

```text
Apply an EzConv-inspired dark theme to this project.

Important: do not copy EzConv file structure or component names. Recreate only the visual language and theme behavior in the context of this codebase.

Theme direction:
- warm, premium dark theme
- charcoal/ash surfaces, not cold blue-black
- burnt-orange as the only strong accent
- off-white text, not pure white everywhere
- subtle borders, low-shadow UI
- large rounded corners
- active states should use orange-tinted fills, not bright multicolor styling

Core dark palette:
- brand: #C65D3B
- brand-hover: #B14F2F
- brand-soft: #D9785B
- bg-page: #1F1F1E
- bg-card: #2A2A28
- bg-surface-soft: #383836
- bg-hover: #383836
- text-heading: #E8E6E3
- text-body: #D6D4CF
- text-secondary: #C9C7C2
- text-placeholder: #8A8884
- border-default: #3A3A38
- border-input: #40403E
- border-subtle: #2F2F2D
- accent-fill-soft: rgba(198, 93, 59, 0.12)
- accent-fill-strong: rgba(198, 93, 59, 0.2)
- success: #10B981
- warning: #F59E0B
- error: #E74C3C

Visual rules:
- page background should be warm charcoal
- cards should be only slightly lighter than the page
- use borders for separation before using shadows
- keep shadows minimal or remove them when possible
- primary buttons should be solid burnt orange with white text
- secondary and neutral controls should stay dark and calm
- selected/active chips, toggles, tabs, and pills should prefer orange text plus a soft orange-tinted background
- inputs should use dark surfaces with orange focus treatment
- do not introduce blue, purple, neon glow, glossy gradients, or glassmorphism unless the existing design system already requires it
- do not make every element orange; orange should signal action or state emphasis

Shape language:
- small radius: 8px
- medium radius: 12px
- large radius: 16px
- extra large card/input radius: 28px
- signature shell radius when appropriate: 36px
- pill buttons/chips: 999px

Typography mood:
- preserve the current typography system if the project already has one
- if the project allows it, major headings can feel a bit more editorial/refined than the body text
- keep body text neutral and readable

Implementation requirements:
- inspect the current codebase first and adapt the theme to the existing architecture
- prefer tokenizing colors, borders, radii, and surface layers before adding one-off overrides
- preserve the current layout and component structure
- do not rewrite unrelated UI logic
- keep light theme behavior intact unless I explicitly ask you to redesign both themes
- if the app already has theme switching, integrate with the existing mechanism instead of replacing it

Component targets:
- body / page shell
- header / nav
- cards / sections / panels
- forms / inputs / selects / textareas
- primary and secondary buttons
- dropdowns / popovers / modals
- tables, lists, tabs, chips, badges, and empty states
- status colors for success, warning, and error

Preferred component styling:
- cards: background #2A2A28, 1px solid #3A3A38, little or no shadow
- inputs: background #2A2A28, border #40403E, text #E8E6E3, placeholder #8A8884
- input focus: orange border or soft orange focus ring
- primary button: background #C65D3B, hover #B14F2F, white text
- active chip/tab/toggle: orange text with a low-alpha orange fill
- overlays: dark translucent backdrop

Do:
- use warm dark neutrals
- keep one dominant accent color
- use off-white text instead of harsh white everywhere
- keep the interface calm and restrained
- use subtle hierarchy through surface contrast and borders

Do not:
- do not use pure black everywhere
- do not use white cards in dark mode
- do not rely on heavy shadows for hierarchy
- do not add a second competing accent color
- do not make the UI look cyberpunk, neon, or generic SaaS dark mode

Deliverables:
1. Implement the dark theme directly in the codebase.
2. Reuse the existing styling architecture where possible.
3. Add or update theme tokens if the project supports them.
4. Briefly summarize what you changed and any remaining gaps.

Before editing, first identify:
- where the project's theme tokens or global styles live
- where cards, forms, buttons, and overlays are styled
- whether there is already a theme switch or dark-mode hook

Then implement the EzConv-inspired dark theme in the most maintainable way for this project.
```

## Short prompt

```text
Implement a dark theme inspired by EzConv for this project: warm charcoal backgrounds, slightly lighter card surfaces, off-white text, subtle neutral borders, large rounded corners, minimal shadows, and burnt-orange (#C65D3B) as the single main accent. Use orange-tinted active states instead of bright multicolor UI. Preserve the existing layout and architecture, inspect the codebase first, prefer theme tokens over one-off overrides, keep light mode intact, and integrate with any existing theme-switching mechanism.
```
