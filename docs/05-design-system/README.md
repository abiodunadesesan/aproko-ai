# 05 - Design System

## Principles

- Clarity over decoration
- Information density without cognitive overload
- Consistency across research, chat, and study workflows
- Accessibility by default

## Foundations

### Typography

- Primary: system sans (web-safe fallback strategy)
- Heading scale: `h1` to `h6` with clear semantic hierarchy
- Body scale: `sm`, `base`, `lg`
- Monospace for code/citations metadata

`TODO`: Final font family selection and licensing decision.

### Color Palette (Tokenized)

- `--background`
- `--foreground`
- `--muted`
- `--primary`
- `--secondary`
- `--destructive`
- `--border`
- `--ring`

Supports light/dark themes with WCAG contrast targets.

### Spacing and Layout

- 4px base spacing scale
- Container widths:
  - reading panes
  - dashboard panes
  - chat + context split panes
- Consistent vertical rhythm for content-heavy views

### Icons

- Lucide icon system
- Meaning-driven icon usage; avoid decorative overload

## Components

Built with shadcn/ui primitives and controlled variants.

### Buttons

- variants: `primary`, `secondary`, `ghost`, `destructive`, `link`
- sizes: `sm`, `md`, `lg`, `icon`
- loading and disabled states required

### Cards

- workspace cards, source cards, result cards, study cards

### Inputs

- text input, search input, textarea, select, command palette input
- inline validation messaging and assistive text patterns

### Navigation

- left sidebar with workspace context
- top nav for global search/actions/profile
- breadcrumbs on deep content routes

### App Shell Components (APP-001)

- `AppShell`:
  - provides authenticated frame (responsive sidebar, top navigation, breadcrumbs, content slot)
  - keyboard access baseline for navigation links and shell controls
  - mobile sidebar open/close behavior for small screens
- `ThemeToggle`:
  - toggles light/dark mode using document root class
  - persists user preference in browser storage
- `User profile menu`:
  - Clerk `UserButton` in top navigation for account actions

### Dashboard Layout

- Shell layout with:
  - persistent navigation
  - primary content pane
  - contextual right panel (citations/memory/source preview)

## Accessibility

- WCAG 2.1 AA baseline
- keyboard navigability for all workflows
- visible focus ring tokens
- ARIA labels for interactive controls
- reduced motion support

## Responsive Behavior

- Desktop-first for V1, mobile-web supported for essential workflows
- Breakpoints:
  - `sm`: stacked panels
  - `md`: partial split layouts
  - `lg+`: full research workspace layout

`TODO`: Final responsive specs for each major screen in wireframes.

## Component Governance

- shared UI package: `packages/ui`
- each component documents:
  - props contract
  - accessibility notes
  - state matrix

## Cross References

- Wireframes: `../06-wireframes/README.md`
- PRD IA and navigation: `../01-prd/README.md`
