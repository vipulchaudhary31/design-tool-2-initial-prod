# Poster Studio UI design system

Pointers for **`src/styles/theme.css`** and **`src/app/components/ui/*`** so changes stay intentional.

---

## 1. Semantic tokens

- Prefer **`bg-background`**, **`text-foreground`**, **`border-border`**, **`bg-muted`**, **`text-muted-foreground`**, **`bg-primary`**, **`text-primary`** over ad-hoc colors so light/dark follow `:root` / `.dark` in `theme.css`.
- **Light theme:** **`--accent`** is a neutral gray hover slab (chromacity **0**) like dark mode’s subdued surface; **`--accent-foreground`** and **`--ring`** carry the purple brand tint for hover text/focus—not the fill.

---

## 2. Dark mode

- **`@custom-variant dark`** is defined at the top of **`theme.css`**. Theme is toggled on **`document.documentElement`** and matches **`isDarkMode`** in **`App.tsx`** (`classList.toggle('dark', …)`).
- Radix overlays/portals attach under **`document.body`**; CSS variables inherit from **`html`** as long as **`html`** carries **`.dark`** when dark mode is on.

**Optional hardening:** If you ever see **`dark:*` utilities** applying while the app is explicitly in **light mode** but the OS is dark, Tailwind may be coupling `dark:` to `prefers-color-scheme`. Replacing with Tailwind’s documented class strategy **`@custom-variant dark (&:where(.dark, .dark *));`** forces **`dark:`** to follow the `.dark` class only (verify after changing).

---

## 3. Button / select hovers (shadcn-aligned baseline)

The committed primitives use **accent hovers**, not muted-only hovers:

- **`Button`** **`ghost`**: `hover:bg-accent hover:text-accent-foreground` (+ `dark:hover:bg-accent/50`).
- **`Button`** **`outline`**: `hover:bg-accent hover:text-accent-foreground`; dark variants use input surface (`dark:bg-input/30`, `dark:hover:bg-input/50`).
- **`Toggle`** **`outline`** and **`SelectItem`** focus follow **`src/app/components/ui/toggle.tsx`** and **`select.tsx`** — same lineage as upstream shadcn.

If product wants softer hovers later, tweak **`theme.css`** **`--accent` / `--accent-foreground`** (light `:root`) or introduce a distinct token—don’t one-off conflicting utilities without updating this doc.

---

## 4. Decorative UI

Dialog / panel icon tiles may use **`bg-primary/10 text-primary`** for a subtle brand badge.

**Archived layout:** Unused replace-background **`AlertDialog`** markup lives in **`src/app/components/patterns/ReplaceBackgroundConfirmDialog.tsx`** (not wired)—reuse when confirming destructive picks is needed again.
