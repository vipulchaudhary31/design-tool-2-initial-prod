# Changelog

Product, feature, and technical notes for Poster Studio (internal design tool). **Append or prepend new entries as you ship** — this file is the single running log.

---

## [Unreleased]

_(Add items here before cutting a release or milestone.)_

- **Docs:** **`guidelines/DESIGN-SYSTEM.md`** describes tokens, dark mode wiring, and shadcn-aligned accent hovers (`Button`, `select`, etc.); linked from **`README.md`** and **`guidelines/Guidelines.md`**.

---

## 2026-03-23 → 2026-04-20 — `mar23-dev-baseline` → `designer-exploration`

Dedicated record for the stretch ending at **`13093f12`** (`designer-exploration`, 2026-04-20 IST).

| Field | Value |
|--------|--------|
| **Git range** | `92b491f8` → `13093f12` |
| **Commits in range** | 4 |

```bash
git log --oneline 92b491f8..designer-exploration
git diff --stat 92b491f8..designer-exploration
```

### Summary

The studio moved from a **March baseline** (internal tooling, prod API target, tokens/members) to the **April designer-exploration** line: a large **editor + export + payload** upgrade, **public/static hosting** for the web app, **resilience** when category/tag APIs fail, and **contract documentation** for the compact template JSON (see `TEMPLATE_JSON_SCHEMA_FRONTEND.md` and `TEMPLATE_JSON_SCHEMA_BACKEND.md`).

### Product & feature changes

#### Editor & canvas

- **Richer design workflow:** Canvas, draggable placeholders, image upload, and text styling were reworked for clearer preview and manipulation (`DesignCanvas`, `DraggablePlaceholder`, `ImageUploader`, `TextStyleEditor`).
- **Theme control:** Light/dark theme toggle for the studio shell (`ThemeToggle`).
- **Raster backgrounds:** Stricter handling of image-only backgrounds via validation helpers (`isRasterBackgroundFile`) so uploads align with the export path (image workflow).
- **Sample assets:** Default sample photos (with/without background) were replaced in `public/assets/`.

#### Export & template payload

- **Server-backed export:** Export builds **`raw_config`** (compact template JSON) and **creates the poster template via API** after uploading the background through **presigned storage** — not a “download JSON only” flow.
- **Background reference:** `bg` in the payload is the **object storage key** returned from upload (clients resolve with CDN/base URL), not an inline data URL in production.
- **Dominant colour:** **`dc`** (dominant hex from the background) is included for downstream theming/UI; surfaced in the export panel with copy affordance.
- **Name band geometry:** **`np` includes `x`, `y`, `w`, `h`** as percentages — the layout matches the editor instead of implying fixed width/centering only.

#### Reliability

- **Fallback tags:** If **category/tag APIs fail**, the app applies **fallback tags** so designers are not blocked.

#### Access & delivery

- **GitHub Pages:** The app can be **built and deployed to GitHub Pages** (workflow + Vite `base` for project-site hosting), improving shareable internal previews of the studio.

#### Login & shell

- **Login screen** refresh and continued alignment with API-backed auth (`Login.tsx` and related API usage).

### Technical changes

#### Application code

- **`App.tsx`:** Major refactor — export pipeline (blob → presigned upload → `raw_config` → create template), dominant colour wiring, and integration with updated panels.
- **`templateSchema.ts`:** **`dc` / `dominantColorHex`** added to `CompactTemplateJSON` and `TEMPLATE_KEY_MAP`.
- **`src/api/client.ts` & login:** Adjustments for the current API contract and behaviour.
- **`ExportPanel`:** Export checks, loading state, dominant colour display/copy.
- **`vite.config.ts`:** **`base`** set for GitHub Pages project-site paths.
- **`ImageWithFallback`:** Minor fix for image loading behaviour.
- **`fonts.css`:** Small font-related addition for the updated UI.

#### Infrastructure & CI

- **`.github/workflows/deploy-pages.yml`:** New workflow to build and deploy the Vite app to GitHub Pages.

#### Dependencies

- **`package.json` / `package-lock.json`:** Dependency change(s) in support of the above (see lockfile for exact versions).

### Documentation & contract

- **Template JSON:** Formal documentation for the compact payload was expanded (authoritative reference: **`TEMPLATE_JSON_SCHEMA_FRONTEND.md`** and **`TEMPLATE_JSON_SCHEMA_BACKEND.md`**).

### Commits (oldest → newest)

| Commit | Summary |
|--------|---------|
| `c3d27541` | **feat:** enhance editor preview, export, and payload contract |
| `b1d1b788` | **fix:** set Vite base path for GitHub Pages project site |
| `42ed2415` | **ci:** add GitHub Actions workflow to build and deploy to Pages |
| `13093f12` | **fix:** provide fallback tags when category APIs fail |

### Branch context

The **`feat/remove-download-and-add-members`** line includes an additional snapshot commit (`353d4e6f` — “initial internal tool snapshot with prod API target”) that may not sit on the same first-parent line as `designer-exploration`; this entry is anchored on **`mar23-dev-baseline` → `designer-exploration`**.
