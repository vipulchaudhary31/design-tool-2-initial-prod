## Template JSON Schema — Backend Model & Key Map

Exported by **Poster Studio** web tool.  
Audience: **backend developers** who need to:
- understand the **full logical structure** of the template JSON, and  
- map from **compact keys** in the payload → **full internal model** in their service.

This file combines the content of:
- the full logical schema (expanded names), and  
- the compact → full key map,
into **one authoritative backend-facing document**.

---

### 1. Root object (expanded names)

Logical TypeScript-style interface (not a strict JSON Schema draft):

```ts
interface TemplateJSONFull {
  aspectRatio: string;
  isProfileTemplate: boolean;
  primaryCategories: string[];
  languageTags: string[];
  /** Creator-visible title / list name — required, trimmed non-empty string from Poster Studio */
  postName: string;
  /** When true, the post becomes visible once the backend completes processing/saving. */
  publishLiveImmediately: boolean;
  /**
   * When `publishLiveImmediately` is false, ISO 8601 UTC instant when the post should go live (must be in the future at export).
   * When `publishLiveImmediately` is true, this should be **`null`**.
   */
  scheduledAt: string | null;
  backgroundImage: string | null;
  /**
   * Dominant colour `#RRGGBB` sampled from the background **image or video** in the editor.
   * Current Poster Studio always sends a string; **`#000000`** when extraction fails.
   * Legacy rows may have `null` — consumers should treat as `#000000` for strip parity.
   */
  dominantColorHex: string | null;
  mediaType: 'image' | 'video';
  /**
   * "strip": bottom strip + `postName`; ignore name band **geometry** (`x/y/w/h`);
   * still apply **`namePlaceholder.styling.textStyle`** to strip typography. Strip height ≈ **6.5%** of background.
   */
  nameLayout: 'strip' | 'overlay';
  imageAnimation: ImageAnimation | null;
  imagePlaceholder: ImagePlaceholder;
  namePlaceholder: NamePlaceholder;
}
```

| Full name           | Type                        | Description                                                        |
|---------------------|-----------------------------|--------------------------------------------------------------------|
| `aspectRatio`       | string                      | `"W:H"` (often GCD-reduced, e.g. `4:5` for 1080×1350). Any valid ratio is possible because uploads are no longer dimension-whitelisted. |
| `isProfileTemplate` | boolean                     | `true` = Self/Profile, `false` = Wishes/Upload                    |
| `primaryCategories` | string[]                    | Tags chosen in the editor (Self/Wishes categories)                |
| `languageTags`      | string[]                    | Language labels (e.g. `["English","Hindi"]`)                      |
| `postName`          | string                      | Required display title; matches **`title`** on template create.   |
| `publishLiveImmediately` | boolean               | **`true`** = visible as soon as the template/post is activated on the backend; **`false`** = use `scheduledAt`. |
| `scheduledAt`       | string \| **`null`**        | ISO 8601 **UTC** for go-live time when not immediate (e.g. `"2026-05-03T06:30:00.000Z"`). **`null`** when immediate. |
| `backgroundImage`   | string \| null              | **Object storage key** after presigned upload. Ends in `.jpg`/`.png` for images or `.mp4` for video. Legacy test payloads may be `data:` or full `https:` URLs. `null` = no background. |
| `dominantColorHex`  | string \| null              | Hex `#RRGGBB` sampled from the background **image or video** in the editor. **Current studio** always persists a string ( **`#000000`** on failure ). **`null`** may appear on older templates — treat like **`#000000`** when rendering the strip. |
| `mediaType`         | `'image'` \| `'video'`      | Background media type. **`"image"`** = JPG/JPEG/PNG raster. **`"video"`** = MP4. Use this to decide how to serve/display the background on the consumer app. |
| `nameLayout`        | `'strip'` \| `'overlay'`    | **`"strip"`** = fixed bottom strip with `postName`; ignore **`namePlaceholder` x/y/w/h**; apply **`styling.textStyle`** to strip text (same semantics as overlay). Strip height ≈ **6.5%** of background band. **`"overlay"`** = full `namePlaceholder` layout + styling. Default `"strip"`; missing → treat as `"overlay"`. |
| `imageAnimation`    | `ImageAnimation` \| null    | Photo intro animation for video templates. `null` for image templates or when disabled. |
| `imagePlaceholder`  | `ImagePlaceholder`          | Photo frame position/shape/border config                          |
| `namePlaceholder`   | `NamePlaceholder`           | Name text band position + text styling                            |

---

### 2. `ImagePlaceholder`

```ts
interface ImagePlaceholder {
  xPercent: number;          // 0–100
  yPercent: number;          // 0–100
  diameterPercent: number;   // 0–100
  shape: 'circle' | 'square' | 'heart' | 'oval' | 'flower' | 'pin' | 'dome';
  cornerRadiusPx?: number;   // only for shape === 'square'
  hasBackground: boolean;
  strokeWidthPx: number;
  strokeColor: string;       // hex
  blurBorders: boolean;
}
```

| Full name         | Type                  | Description                                                         |
|-------------------|-----------------------|---------------------------------------------------------------------|
| `xPercent`        | number (0–100)        | Left of photo frame as % of canvas width                           |
| `yPercent`        | number (0–100)        | Top of photo frame as % of canvas height                           |
| `diameterPercent` | number (0–100)        | Size of photo frame as % of canvas width                           |
| `shape`           | `'circle' \| 'square' \| 'heart' \| 'oval' \| 'flower' \| 'pin' \| 'dome'` | Frame shape |
| `cornerRadiusPx`  | number \| undefined   | Corner radius (design px) — only for `shape === "square"`          |
| `hasBackground`   | boolean               | `true` = user photo keeps background, `false` = cutout/PNG         |
| `strokeWidthPx`   | number                | Photo border width (design px, 0 = none)                           |
| `strokeColor`     | string (hex)          | Photo border colour                                                |
| `blurBorders`     | boolean               | Feather alpha at the photo frame edge so it blends into the background |

---

### 2.1 `ImageAnimation`

```ts
interface ImageAnimation {
  preset: 'bottom-to-top' | 'top-to-bottom' | 'left-to-right' | 'right-to-left';
  durationSeconds: number;
}
```

| Full name          | Type                                                             | Description |
|--------------------|------------------------------------------------------------------|-------------|
| `preset`           | `'bottom-to-top' \| 'top-to-bottom' \| 'left-to-right' \| 'right-to-left'` | Entry direction for the photo layer before settling at final `imagePlaceholder` coordinates. |
| `durationSeconds`  | number                                                           | Animation duration in seconds. |

Semantics:
- Runs once from video start (`t=0`) and finishes by `durationSeconds`.
- After completion, photo remains at final `imagePlaceholder` coordinates.
- Renderer/export pipelines should not loop this unless playback restarts from `t=0`.

---

### 3. `NamePlaceholder`

```ts
interface NamePlaceholder {
  xPercent: number;          // 0–100
  yPercent: number;          // 0–100
  widthPercent: number;      // 0–100
  heightPercent: number;     // 0–100
  styling: NameStyling;
}
```

| Full name       | Type          | Description                                        |
|-----------------|---------------|----------------------------------------------------|
| `xPercent`      | number (0–100)| Left of name band as % of canvas width             |
| `yPercent`      | number (0–100)| Top of name band as % of canvas height             |
| `widthPercent`  | number (0–100)| Width of name band as % of canvas width            |
| `heightPercent` | number (0–100)| Height of name band as % of canvas height          |
| `styling`       | `NameStyling` | Text styling container (currently a single style)  |

---

### 4. `NameStyling` and `TextStyleFull`

```ts
interface NameStyling {
  textStyle: TextStyleFull;
}

interface TextStyleFull {
  color: string;                 // hex
  fontSizePx: number;            // design px
  fontWeight: number;            // e.g. 400, 600, 700
  letterSpacingPx: number;       // design px
  textAlign: 'left' | 'center' | 'right';
  shadow: TextShadowFull | null;
  stroke: TextStrokeFull;
}
```

| Full name         | Type                             | Description                                    |
|-------------------|----------------------------------|------------------------------------------------|
| `color`           | string (hex)                     | Text colour                                   |
| `fontSizePx`      | number                           | Base font size in design px                   |
| `fontWeight`      | number                           | Numeric weight (300/400/500/600/700/800/900)  |
| `letterSpacingPx` | number                           | Letter spacing in design px                   |
| `textAlign`       | `'left' \| 'center' \| 'right'`  | Text alignment                                |
| `shadow`          | `TextShadowFull \| null`         | Text drop shadow, `null` = no shadow          |
| `stroke`          | `TextStrokeFull`                 | Text stroke/outline settings                  |

---

### 5. `TextShadowFull` (from compact `sh`)

```ts
interface TextShadowFull {
  offsetXPx: number;   // design px
  offsetYPx: number;   // design px
  blurRadiusPx: number;// design px
  color: string;       // hex
  opacity: number;     // 0–1
}
```

| Full name      | Type    | Description                                       |
|----------------|---------|---------------------------------------------------|
| `offsetXPx`    | number  | Shadow X offset in design px                     |
| `offsetYPx`    | number  | Shadow Y offset in design px                     |
| `blurRadiusPx` | number  | Shadow blur radius in design px                  |
| `color`        | string  | Shadow colour as hex                             |
| `opacity`      | number  | Shadow opacity as float in \[0, 1]               |

When `shadow` is `null`, all of the above are absent (no shadow applied).

---

### 6. `TextStrokeFull` (from compact `st`)

```ts
interface TextStrokeFull {
  widthPx: number;     // design px
  color: string;       // hex
}
```

| Full name | Type   | Description                            |
|-----------|--------|----------------------------------------|
| `widthPx` | number | Stroke width in design px (0 = none)  |
| `color`   | string | Stroke colour as hex (e.g. `"#000"`)  |

If `widthPx` is `0`, the visual result is “no stroke”.

---

### 7. Compact → Full key map

This section shows the **current compact keys in the JSON** and the full
field path they map to in the logical model above.

#### 7.1 Top-level keys

| Compact key | Full path             | Meaning                                                          |
|-------------|----------------------|------------------------------------------------------------------|
| `ar`        | `aspectRatio`        | Aspect ratio `W:H` (may be reduced, e.g. `4:5`); parse both parts as numbers. |
| `t`         | `isProfileTemplate`  | Template type — `true` = Self/Profile, `false` = Wishes/Upload   |
| `pc`        | `primaryCategories`  | Primary categories (tags) selected in the editor                 |
| `lg`        | `languageTags`       | Language tags (e.g. `["English","Hindi"]`)                       |
| `pn`        | `postName`           | Post / template display name (trimmed non-empty string)           |
| `li`        | `publishLiveImmediately` | Immediate vs scheduled publishing                                |
| `sa`        | `scheduledAt`        | ISO 8601 UTC go-live instant, or **`null`** when `li === true`  |
| `bg`        | `backgroundImage`    | **Storage key** for the uploaded background (or `data:` / full URL in legacy flows), or `null` |
| `dc`        | `dominantColorHex`   | Dominant background colour `#RRGGBB` (studio: always string, **`#000000`** if sampling fails). Legacy: `null` ok |
| `mt`        | `mediaType`          | Media type for `backgroundImage`: `"image"` or `"video"`         |
| `nl`        | `nameLayout`         | Name layout mode (`"strip"` or `"overlay"`); see semantics above |
| `ia`        | `imageAnimation`     | Photo intro animation payload (video templates only)             |
| `ip`        | `imagePlaceholder`   | Image (photo) placeholder object                                 |
| `np`        | `namePlaceholder`    | Name text placeholder object                                     |

Poster Studio derives **`sa`** from the creator’s **local** calendar date (`YYYY-MM-DD`) and **local** time (`HH:mm`) at export into one **UTC ISO 8601** string; payloads do **not** include separate compressed fields for raw date/time.

#### 7.2 `ip` — Image placeholder

All under `ip`:

| Compact key | Full path                                   | Meaning                                                           |
|-------------|---------------------------------------------|-------------------------------------------------------------------|
| `ip.x`      | `imagePlaceholder.xPercent`                 | Photo frame left position as % of canvas width (0–100)           |
| `ip.y`      | `imagePlaceholder.yPercent`                 | Photo frame top position as % of canvas height (0–100)           |
| `ip.d`      | `imagePlaceholder.diameterPercent`          | Photo frame diameter/size as % of canvas width (0–100)           |
| `ip.sh`     | `imagePlaceholder.shape`                    | Photo frame shape — `"circle"`, `"square"`, `"heart"`, `"oval"`, `"flower"`, `"pin"`, or `"dome"` |
| `ip.cr`     | `imagePlaceholder.cornerRadiusPx`           | Corner radius in design px (only when `shape === "square"`)      |
| `ip.hb`     | `imagePlaceholder.hasBackground`            | Has background — `true` = full photo, `false` = cutout PNG       |
| `ip.sw`     | `imagePlaceholder.strokeWidthPx`            | Photo border (stroke) width in design px; currently render only for square |
| `ip.sc`     | `imagePlaceholder.strokeColor`              | Photo border (stroke) colour as hex string; currently render only for square |
| `ip.bb`     | `imagePlaceholder.blurBorders`              | Feather the photo frame edge for dynamic app rendering            |

#### 7.2.1 `ia` — Image animation

| Compact key | Full path                         | Meaning |
|-------------|-----------------------------------|---------|
| `ia.p`      | `imageAnimation.preset`           | Direction preset (`bottom-to-top`, `top-to-bottom`, `left-to-right`, `right-to-left`) |
| `ia.d`      | `imageAnimation.durationSeconds`  | Duration in seconds |

#### 7.3 `np` — Name placeholder

Top-level under `np`:

| Compact key | Full path                              | Meaning                                                  |
|-------------|----------------------------------------|----------------------------------------------------------|
| `np.x`      | `namePlaceholder.xPercent`             | Name band left position as % of canvas width (0–100)    |
| `np.y`      | `namePlaceholder.yPercent`             | Name band top position as % of canvas height (0–100)    |
| `np.w`      | `namePlaceholder.widthPercent`         | Name band width as % of canvas width (0–100)            |
| `np.h`      | `namePlaceholder.heightPercent`        | Name band height as % of canvas height (0–100)          |
| `np.st`     | `namePlaceholder.styling`              | Styling container (text style object lives at `.ts`)    |

#### 7.4 `np.st.ts` — Text style (main object)

All under `np.st.ts`:

| Compact key   | Full path                                        | Meaning                                                   |
|---------------|--------------------------------------------------|-----------------------------------------------------------|
| `np.st.ts.c`  | `namePlaceholder.styling.textStyle.color`        | Text colour as hex (e.g. `"#FFFFFF"`)                    |
| `np.st.ts.fs` | `namePlaceholder.styling.textStyle.fontSizePx`   | Font size in design px                                   |
| `np.st.ts.fw` | `namePlaceholder.styling.textStyle.fontWeight`   | Font weight as numeric value (e.g. `400`, `700`)         |
| `np.st.ts.ls` | `namePlaceholder.styling.textStyle.letterSpacingPx` | Letter spacing in design px                          |
| `np.st.ts.ta` | `namePlaceholder.styling.textStyle.textAlign`    | Text alignment — `"left"`, `"center"`, or `"right"`      |
| `np.st.ts.sh` | `namePlaceholder.styling.textStyle.shadow`       | Compact text shadow object (or `null`)                   |
| `np.st.ts.st` | `namePlaceholder.styling.textStyle.stroke`       | Compact text stroke object                               |

#### 7.5 `np.st.ts.sh` — Text shadow (compact)

When `sh` is not `null`, these are the keys under `np.st.ts.sh`:

| Compact key      | Full path                                             | Meaning                                      |
|------------------|-------------------------------------------------------|----------------------------------------------|
| `np.st.ts.sh.ox` | `namePlaceholder.styling.textStyle.shadow.offsetXPx`  | Shadow offset X in design px                 |
| `np.st.ts.sh.oy` | `namePlaceholder.styling.textStyle.shadow.offsetYPx`  | Shadow offset Y in design px                 |
| `np.st.ts.sh.bl` | `namePlaceholder.styling.textStyle.shadow.blurRadiusPx` | Shadow blur radius in design px           |
| `np.st.ts.sh.col`| `namePlaceholder.styling.textStyle.shadow.color`      | Shadow colour as hex                         |
| `np.st.ts.sh.op` | `namePlaceholder.styling.textStyle.shadow.opacity`    | Shadow opacity as a 0–1 float (e.g. `0.65`) |

If `sh` is `null`, the text has **no** shadow.

#### 7.6 `np.st.ts.st` — Text stroke (compact)

These keys live under `np.st.ts.st`:

| Compact key       | Full path                                          | Meaning                                      |
|-------------------|----------------------------------------------------|----------------------------------------------|
| `np.st.ts.st.w`   | `namePlaceholder.styling.textStyle.stroke.widthPx` | Stroke width in design px (0 = no stroke)    |
| `np.st.ts.st.col` | `namePlaceholder.styling.textStyle.stroke.color`   | Stroke colour as hex (e.g. `"#000000"`)      |

When `w === 0`, there is effectively **no stroke**.

---

### 8. Quick backend summary

- **Use the expanded interfaces** (`TemplateJSONFull`, `ImagePlaceholder`, `NamePlaceholder`, etc.)
  as your internal backend model.
- Use the **compact → full map** above to decode the compact payload you receive
  from the Poster Studio web tool into that internal model.
- **`pn` (`postName`):** required human-facing name; persist with **`raw_config`** and align with **`title`** on poster-template create calls.
- **`li` / `sa` (`publishLiveImmediately` / `scheduledAt`):** when `li` is `true`, expose the template/post as soon as it is persisted; when `false`, hold visibility until **`sa`** (parse as UTC ISO instant). Prefer **`sa === null`** when `li === true`.
- **`bg` / `backgroundImage`:** persist the key returned from upload (same string stored in `raw_config`). Clients resolve it with your CDN or asset host; do not assume a data URL in production. File extension reflects the type (`.mp4` for video).
- **`mt` / `mediaType`:** persist this alongside `bg`. Consumer apps use it to render `<Video>` vs `<Image>`. Do not infer media type from the file extension alone.
- **`nl` / `nameLayout`:** persist as-is. When `"strip"`, ignore **`np` geometry** (`x`,`y`,`w`,`h`) and render the bottom strip using **`postName`** + **`np.st.ts`** for typography (≈ **6.5%** strip height, **80%** max text width default). When `"overlay"`, render full `np` as before.
- **`ia` / `imageAnimation`:** optional photo intro animation for video templates. Persist as-is with `raw_config`; consumer renderers should run once from start of playback and then hold final position.
- **`ip.bb` / `imagePlaceholder.blurBorders`:** persist this boolean with `raw_config`. Consumer renderers should feather the selected placeholder frame edge for both image and video backgrounds using the same shape path as `ip.sh`. Do not attempt subject-edge detection and do not store a pre-rendered blurred user image in the template, because user photos are dynamic and can be transparent cutouts.
- **`dc` / `dominantColorHex`:** sampled from **images and videos** in the editor (video: up to two frame samples, brighter result preferred). **Current export** always includes a hex string; failures normalize to **`#000000`**. Legacy payloads may store `null` — backends and clients should coerce to **`#000000`** for strip rendering. Used by **`nl === "strip"`** (strip = black mixed 50% with dominant).
- **`ar` / `aspectRatio`:** any valid GCD-reduced ratio for both image and video templates. Always parse the two numbers dynamically — do not hardcode a list of known values.
- All rendering-specific React Native details live in  
  `TEMPLATE_JSON_SCHEMA_FRONTEND.md` (frontend guide); this backend document
  is only about **data shape and meaning**.

---

### 9. Changelog

#### May 2026
- **Background upload rules:** images accept JPG/JPEG/PNG up to **5 MB** and videos accept MP4 up to **100 MB**. No dimension/aspect-ratio whitelist remains; `ar` may be any GCD-reduced ratio.
- **Video support:** `mt` can be `"video"` (MP4). `bg` key ends in `.mp4`. **`dc` / `dominantColorHex`** are populated for **video** templates the same way as images (see quick summary). Persist `mt` alongside `bg` so consumer apps can render the correct media component.
- **Photo animation support (`ia`):** compact payload now includes optional photo intro animation for video templates (`ia.p`, `ia.d`). This applies to the photo layer (`ip`) and is intended to run once from video start, then stay at final position.
- **Blur borders (`ip.bb`):** compact payload now includes a boolean for edge-feathering the photo frame boundary on both image and video backgrounds.
- **Name layout (`nl`):** `"strip"` (default) = bottom strip with `postName` + **`namePlaceholder.styling`** for type; **ignore band x/y/w/h**; strip ≈ **6.5%** of background height. `"overlay"` = full name placeholder. Missing `nl` → `"overlay"`.
- **Dominant colour (`dc`) for video:** extracted for video backgrounds (multi-frame sampling in studio when possible). Failures map to **`#000000`** in new exports; strip fallback uses the same semantics as the frontend doc.

#### April 2026 (vs March 2026 baseline)
- **`pn` → `postName`:** mandatory post title — mirrors **`title`** on template create requests.
- **`li` / `sa` → `publishLiveImmediately` / `scheduledAt`:** post visibility — immediate (`sa: null`) vs scheduled UTC instant.
- **`dc` → `dominantColorHex`:** dominant colour for theming / strip; current studio requires a `#RRGGBB` string ( **`#000000`** on failure ).
- **`bg`:** production payloads use **object storage keys** after presigned upload; older docs assumed inline data URLs.
- **`np`:** `x`, `w`, and `h` are always present in compact JSON (name band is fully specified).
