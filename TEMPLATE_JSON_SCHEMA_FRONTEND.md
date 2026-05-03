## Template JSON Schema — Frontend React Native Rendering Guide

Exported by **Poster Studio** web tool.  
Target platform: **React Native, Android-first**.

**Payload contract:** the studio builds a `CompactTemplateJSON` object and sends it to the backend as `raw_config` on template create. The background file is uploaded to object storage first; `bg` in the JSON is the **returned object key** (e.g. `uploads/background-2026-04-19T10-20-30.jpg`), not a data URL. Your mobile app should prefix that key with your **media / CDN base URL** when loading the image. **`dc`** is the dominant background colour (`#RRGGBB`) for **both images and videos**, and is included for theming and the name strip. Current studio export always sends a string; use **`#000000`** if the field is missing, `null`, or invalid in older payloads.

---

## Canvas & design space

The web editor uses a fixed **1080px wide** canvas. The **background media** height is variable and depends on the upload:

- **Images** are validated against four allowed heights: **1152, 1350, 1484, 1620** (at width 1080).
- **Videos** use the real video dimensions normalised to 1080px wide — any height is possible.

When **`nl === "strip"`**, the logical poster is **taller** than the background alone: a name strip is attached **below** the background (not drawn on top of it). The exported `ar` reflects the **full poster** size (background height + strip height). When **`nl === "overlay"`**, `ar` matches the background only (legacy).

The `ar` field is a string `"W:H"` (GCD-reduced). **Do not** hardcode only known image ratios — `ar` can be any valid ratio string.

**Parse `ar` and get design height:**

```js
const [w, h] = ar.split(':').map(Number);
const designCanvasWidth = 1080;
const designCanvasHeight = (1080 * h) / w;
```

For the four standard image sizes:

| Canvas (W×H) | Typical `ar` in JSON* | `designCanvasHeight` |
|--------------|------------------------|----------------------|
| 1080 × 1152 | (e.g. `15:16` or similar) | 1152 |
| 1080 × 1350 | (e.g. `4:5`) | 1350 |
| 1080 × 1484 | (e.g. `270:371` or reduced) | 1484 |
| 1080 × 1620 | (e.g. `2:3`) | 1620 |

Video templates may produce any ratio — always derive canvas size from the parsed `ar`, never from a fixed table.

At **render** time, scale to the device:

```js
const scale = outputCanvasWidth / 1080;
const canvasHeight = outputCanvasWidth * (h / w); // same as designCanvasHeight * (outputCanvasWidth/1080)
```

---

## Scaling contract

Some values are in **design px** (1080-wide coordinate system). Use:

```js
const scale = outputCanvasWidth / 1080;
```

**Scale these by `scale`:**
- `np.st.ts.fs` — font size  
- `np.st.ts.ls` — letter spacing  
- `np.st.ts.sh.ox`, `np.st.ts.sh.oy`, `np.st.ts.sh.bl` — shadow  
- `ip.sw` — photo border width  
- `ip.cr` — corner radius (square only)

**Percent of canvas (0–100) — multiply by width/height:**
- `ip.x`, `ip.y`, `ip.d`  
- `np.x`, `np.y`, `np.w`, `np.h`

**Important when `nl === "strip"`:** `ar` describes the **full poster** (background + strip), but `ip` percentages are still computed against the **background band height only** (the media region, equal to the height implied by the background before the strip is added). Derive `backgroundBandHeight` from your layout (e.g. `totalHeight - stripHeight` from `ar` + strip rule, or store background-only height separately in your pipeline). Do **not** multiply `ip.y` by the full poster height if a strip is present.

**Use as-is (no scale):**  
hex colours, `ip.sh`, `ip.hb`, `np.st.ts.fw`, `np.st.ts.ta`, shadow opacity `np.st.ts.sh.op` (0–1).

---

## Font

**Font family is not in the JSON.** The web editor uses *Noto Sans* for preview only.  
Your app chooses the font. Sizes and weights are font-agnostic.

---

## Top-level structure

```json
{
  "ar": "4:5",
  "t": true,
  "pc": ["Self"],
  "lg": ["English", "Hindi"],
  "pn": "Festival-banner",
  "bg": "uploads/background-2026-04-19T10-20-30.jpg",
  "dc": "#E84393",
  "mt": "image",
  "nl": "strip",
  "ia": null,
  "li": false,
  "sa": "2026-05-03T06:30:00.000Z",
  "ip": { ... },
  "np": { ... }
}
```

| Key  | Type                   | Description |
|------|------------------------|-------------|
| `ar` | string                 | Aspect ratio `"W:H"` (reduced). Parse both parts as numbers to get canvas proportions. |
| `t`  | boolean                | `true` = Self/Profile, `false` = Wishes/Upload |
| `pc` | string[]               | Primary category tags |
| `lg` | string[]               | Language tags |
| `pn` | string                 | **Post name** — required non-empty trimmed string; same text as **`title`** on template create API. |
| `bg` | string \| `null`       | **Object storage key** for the background (after presigned upload). Resolve with your CDN/app base URL. `null` if no background. For images the key ends in `.jpg`/`.png`/`.webp`; for videos it ends in `.mp4`. |
| `dc` | string (see note)     | **Dominant colour** (`#RRGGBB`) sampled from the background **image or video** (Color Thief). **Current studio** always emits a hex string; on extraction failure it sends **`#000000`**. Legacy payloads may use `null` or omit the key — treat those like **`#000000`** for strip rendering. |
| `mt` | `"image"` \| `"video"` | Background media type. **`"image"`** = JPEG/PNG/WebP; **`"video"`** = MP4. Use this to decide whether to render `<Image>` or `<Video>` in your app. |
| `nl` | `"strip"` \| `"overlay"` | **`"strip"`** = fixed bottom strip, text from **`pn`**, typography from **`np.st.ts`** (ignore **`np.x/y/w/h`**). **`"overlay"`** = full `np`. Missing `nl` → treat as `"overlay"`. |
| `ia` | object \| `null`       | Photo intro animation config. Present only for video templates when enabled; otherwise `null`. |
| `li` | boolean                | Default **`false`**: **`sa`** selects go-live (**scheduled**). Set **`true`** for immediate publish once saved/processed (**`sa`** → **`null`**). |
| `sa` | string \| **`null`**   | ISO 8601 UTC when **`li`** is **`false`** (typically in the future at export time). **`null`** when **`li`** is **`true`**. |
| `ip` | object                 | Photo placeholder |
| `np` | object                 | Name placeholder (includes **x, y, width, height** as %) |

**How `sa` is produced in the studio:** the editor collects a **local** calendar date and **local** time-of-day on the creator’s machine, then emits a **single UTC** instant in **`sa`** (no separate compressed keys for date vs time in `raw_config`).

---

## `ip` — Photo placeholder

Same semantics as before (circle/square, `cr` only for square, `hb`, stroke).

```json
"ip": {
  "x": 36,
  "y": 18,
  "d": 28,
  "sh": "circle",
  "hb": false,
  "sw": 2,
  "sc": "#FFFFFF"
}
```

```json
"ip": {
  "x": 36,
  "y": 18,
  "d": 28,
  "sh": "square",
  "cr": 16,
  "hb": true,
  "sw": 0,
  "sc": "#FFFFFF"
}
```

| Key  | Type | Description |
|------|------|-------------|
| `x`, `y`, `d` | 0–100 | Position and size as **%** of canvas width/height (same as earlier docs). |
| `sh` | `"circle"` \| `"square"` | Shape |
| `cr` | design px | Corner radius — **only when** `sh === "square"` |
| `hb` | boolean | Photo has background vs cutout |
| `sw`, `sc` | design px / hex | Border |

**Render snippet** (unchanged idea):

```jsx
const photoSize   = (ip.d / 100) * canvasWidth;
const photoLeft   = (ip.x / 100) * canvasWidth;
const photoTop    = (ip.y / 100) * canvasHeight;
const borderRadius = ip.sh === 'circle' ? photoSize / 2 : (ip.cr ?? 0) * scale;
const borderWidth  = ip.sw * scale;
```

---

## `ia` — Photo animation (video templates only)

`ia` configures a **one-shot intro animation** for the photo layer.

```json
"ia": {
  "p": "bottom-to-top",
  "d": 2.4
}
```

| Key | Type | Description |
|-----|------|-------------|
| `p` | `"bottom-to-top"` \| `"top-to-bottom"` \| `"left-to-right"` \| `"right-to-left"` | Direction the photo enters **from** before settling at its `ip.x/ip.y` final position. |
| `d` | number | Duration in seconds. |

Runtime expectation on RN/export renderers:
- Start the animation at **video time `0`**.
- Run for **`d` seconds**.
- Studio preview/export currently use a fixed **600px entry offset** in the selected direction before easing into the final `ip` position.
- End at the exact `ip` final coordinates and keep it there for the rest of the video.
- Do not retrigger unless playback restarts from `0`.

---

## `nl` — Name layout

The renderer must check `nl` before deciding how to draw the name.

### `nl === "strip"` (default for new templates)

- **Render a fixed full-width strip attached to the bottom edge of the *background*** — the poster’s total height = background band + strip (strip is **not** overlaid on the video/image pixels).
- Strip height (design px): **`round(backgroundHeightPx × 0.065)`** (`NAME_STRIP_HEIGHT_PERCENT = 6.5` on the background band **before** adding the strip).
- Strip background colour: pure black mixed with the dominant background colour (`dc`) at **50% opacity** — i.e. `R/G/B` of `dc` divided by 2. If `dc` is missing, `null`, or invalid, treat it as **`#000000`** (strip background is then pure black).
- **Text:** render **`pn`** using the same compact fields as overlay mode: **`np.st.ts`** — `fs` (font size, design px), `fw`, `c` (colour), `ls` (letter spacing), `sh` (shadow or `null`), `st` (stroke), `ta` (alignment). Vertically centre in the strip; horizontal padding should account for stroke/shadow like the overlay name band. **Single line**, ellipsis if needed. **Max width** of the text line: **80%** of canvas width (studio default; not a separate key in JSON today).
- **Ignore `np` geometry** for strip mode only: **`np.x` / `np.y` / `np.w` / `np.h`** do not position the strip text (the strip is full width). Do **not** ignore **`np.st.ts`** — it drives strip typography.

```jsx
function normalizeDc(dc) {
  if (typeof dc === 'string' && /^#[0-9A-Fa-f]{6}$/i.test(dc.trim())) return dc.trim().toUpperCase();
  return '#000000';
}
const ts = json.np.st.ts;
const stripHeight = canvasHeight * 0.065;
const dominant = normalizeDc(json.dc);
const stripBg = mixHalfWithBlack(dominant);
// Apply ts.c, ts.fs (scaled), ts.fw, ts.ls, ts.ta, expand ts.sh / ts.st per RN doc for overlay text.
return (
  <View style={{
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: stripHeight,
    backgroundColor: stripBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: ts.ta === 'left' ? 'flex-start' : ts.ta === 'right' ? 'flex-end' : 'center',
    paddingHorizontal: 6,
  }}>
    <Text
      numberOfLines={1}
      style={{
        color: ts.c,
        fontWeight: String(ts.fw),
        fontSize: ts.fs,
        letterSpacing: ts.ls,
        maxWidth: '80%',
        textAlign: ts.ta,
        /* stroke + shadow: same helpers as overlay `np` text */
      }}
    >
      {json.pn}
    </Text>
  </View>
);
```

### `nl === "overlay"` (legacy)

Render the `np` block exactly as documented below — it carries position (`x/y/w/h`) and full text styling (`np.st.ts`).

---

## `np` — Name placeholder

> When **`nl === "overlay"`**, use **`np.x/y/w/h`** and **`np.st.ts`**. When **`nl === "strip"`**, ignore **`np.x/y/w/h`** for layout but apply **`np.st.ts`** for strip typography (text is **`pn`**). Stroke and shadow use the same rules as overlay text.

**`x`, `y`, `w`, and `h` are all present in the JSON** (as percentages 0–100).  
Do **not** assume a fixed 80% width or centered X unless you intentionally ignore the payload.

```json
"np": {
  "x": 10,
  "y": 62,
  "w": 80,
  "h": 8,
  "st": { "ts": { ... } }
}
```

| Key | Type (0–100) | Description |
|-----|----------------|-------------|
| `x` | % of canvas **width** | Left edge of the name band |
| `y` | % of canvas **height** | Top edge of the name band |
| `w` | % of canvas **width** | Width of the name band |
| `h` | % of canvas **height** | Height of the name band |

```jsx
const bandWidth  = (np.w / 100) * canvasWidth;
const bandHeight = (np.h / 100) * canvasHeight;
const bandLeft   = (np.x / 100) * canvasWidth;
const bandTop    = (np.y / 100) * canvasHeight;
```

---

## `np.st.ts` — Text style

All styling is under `np.st.ts` (not repeated here in full; same compact shape as before).

| Key | Description |
|-----|-------------|
| `c` | Text colour (hex) |
| `fs` | Font size, design px — **scale** |
| `fw` | Font weight (number) |
| `ls` | Letter spacing, design px — **scale** |
| `ta` | `left` \| `center` \| `right` |
| `sh` | Drop shadow object or `null` |
| `st` | Text stroke `{ w, col }` — expand in RN with shadow layers (below) |

### `sh` — Drop shadow (compact)

`null` = no shadow. Otherwise: `ox`, `oy`, `bl` in design px (scale), `col` hex, `op` in **0–1**.

### `st` — Text stroke (compact)

React Native has no native text stroke. The editor stores one width + colour; expand into multiple `textShadow` layers (e.g. 24 directions, + optional inner ring for thick strokes) as in the sample below.

```json
"st": { "w": 2, "col": "#000000" }
```

---

## Background URL and media type

If `bg` is a non-null string and does not start with `data:` or `http`, treat it as a **path/key** and join with your configured **media base URL** (same host the API used for upload).

If you support older or test payloads, `bg` may still be a `data:` URL or full `https:` URL — handle both.

**Always use `mt` to decide how to render the background:**

```js
if (json.mt === 'video') {
  // render <Video source={{ uri: bgUri }} resizeMode="cover" repeat />
} else {
  // render <Image source={{ uri: bgUri }} resizeMode="cover" />
}
```

For **video** templates, `dc` is still populated (sampled from decoded frames in the editor — two timestamps when duration allows; the brighter sample is kept to reduce black intro frames winning). It can still be perceptually “off” for some assets; the studio guarantees a **valid hex** or **`#000000`**.

---

## Complete rendering sketch (RN)

Uses **parsed `ar`** for height, **`np` band from x/y/w/h** (overlay mode), and **`dc`** for placeholders / strip:

```jsx
import { View, Text, Image, StyleSheet } from 'react-native';

function PosterTemplate({ json, outputWidth, mediaBaseUrl, userName, userPhotoUri }) {
  const [aw, ah] = json.ar.split(':').map(Number);
  const canvasWidth = outputWidth;
  const canvasHeight = outputWidth * (ah / aw);
  const scale = outputWidth / 1080;

  const bgUri = !json.bg
    ? null
    : json.bg.startsWith('data:') || json.bg.startsWith('http')
      ? json.bg
      : `${mediaBaseUrl.replace(/\/$/, '')}/${json.bg.replace(/^\//, '')}`;

  const { ip, np } = json;
  const ts = np.st.ts;

  const photoSize   = (ip.d / 100) * canvasWidth;
  const photoLeft   = (ip.x / 100) * canvasWidth;
  const photoTop    = (ip.y / 100) * canvasHeight;
  const borderRadius = ip.sh === 'circle' ? photoSize / 2 : (ip.cr ?? 0) * scale;
  const borderWidth  = ip.sw * scale;

  const bandWidth  = (np.w / 100) * canvasWidth;
  const bandHeight = (np.h / 100) * canvasHeight;
  const bandLeft   = (np.x / 100) * canvasWidth;
  const bandTop    = (np.y / 100) * canvasHeight;

  const baseTextStyle = {
    color:         ts.c,
    fontSize:      ts.fs * scale,
    fontWeight:    String(ts.fw),
    letterSpacing: ts.ls * scale,
    textAlign:     ts.ta,
    width:         bandWidth,
  };

  const shadowStyle = ts.sh ? {
    textShadowOffset: { width: ts.sh.ox * scale, height: ts.sh.oy * scale },
    textShadowRadius: ts.sh.bl * scale,
    textShadowColor:  rgbaFromHex(ts.sh.col, ts.sh.op),
  } : {};

  const placeholderBg = typeof json.dc === 'string' && /^#[0-9A-Fa-f]{6}$/.test(json.dc) ? json.dc : '#000000';

  return (
    <View style={{ width: canvasWidth, height: canvasHeight, backgroundColor: placeholderBg }}>
      {bgUri && json.mt === 'video' && (
        <Video source={{ uri: bgUri }} style={StyleSheet.absoluteFill} resizeMode="cover" repeat muted={false} />
      )}
      {bgUri && json.mt !== 'video' && (
        <Image source={{ uri: bgUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      <View style={{
        position: 'absolute',
        left: photoLeft, top: photoTop,
        width: photoSize, height: photoSize,
        borderRadius,
        borderWidth: borderWidth > 0 ? borderWidth : 0,
        borderColor: borderWidth > 0 ? ip.sc : 'transparent',
        overflow: 'hidden',
      }}>
        {userPhotoUri && (
          <Image source={{ uri: userPhotoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        )}
      </View>

      <View style={{
        position: 'absolute',
        left: bandLeft, top: bandTop,
        width: bandWidth, height: bandHeight,
        alignItems: ts.ta === 'left' ? 'flex-start' : ts.ta === 'right' ? 'flex-end' : 'center',
        justifyContent: 'center',
      }}>
        {generateStrokeShadows(ts.st, scale).map((s, i) => (
          <Text key={i} style={[baseTextStyle, StyleSheet.absoluteFill, { textShadowOffset: s.textShadowOffset, textShadowRadius: s.textShadowRadius, textShadowColor: s.textShadowColor }]} numberOfLines={1}>
            {userName}
          </Text>
        ))}
        <Text style={[baseTextStyle, shadowStyle]} numberOfLines={1}>{userName}</Text>
      </View>
    </View>
  );
}

function rgbaFromHex(hex, op) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${op.toFixed(2)})`;
}

function generateStrokeShadows(st, scale) {
  if (!st || st.w <= 0) return [];
  const w = st.w * scale;
  const c = st.col;
  const shadows = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * 2 * Math.PI;
    shadows.push({
      textShadowOffset: { width: +(w * Math.cos(angle)).toFixed(2), height: +(w * Math.sin(angle)).toFixed(2) },
      textShadowRadius: 0,
      textShadowColor: c,
    });
  }
  if (st.w > 3) {
    const inner = w * 0.6;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 2 * Math.PI;
      shadows.push({
        textShadowOffset: { width: +(inner * Math.cos(angle)).toFixed(2), height: +(inner * Math.sin(angle)).toFixed(2) },
        textShadowRadius: 0,
        textShadowColor: c,
      });
    }
  }
  return shadows;
}
```

---

## TypeScript

```ts
import type { CompactTemplateJSON } from '@/templateSchema';
```

See `src/templateSchema.ts` for the typed definition and `TEMPLATE_KEY_MAP` for long names.

---

## Changelog (designer exploration / April 2026 vs March 2026)

- **`pn`:** mandatory **`postName`** (defaults from uploaded background filename in the studio).
- **`li` / `sa`:** publish scheduling — default is **scheduled**; immediate only when **`li`** is **`true`** (ISO 8601 UTC `scheduledAt` when dated).
- **`dc` (dominant colour):** sampled for theming and strip tint. **Current studio** always sends `#RRGGBB` ( **`#000000`** on failure ). Treat missing/`null` `dc` in old payloads as **`#000000`**.  
- **`bg`:** production export is the **storage key** after upload, not an inline data URL.  
- **`np`:** **x, w, h** are always serialized; name band is no longer “fixed width / centered only” in data — layout matches the editor.

### May 2026
- **Video backgrounds (`mt: "video"`):** studio accepts MP4 uploads alongside images. `bg` key ends in `.mp4`; `mt` is `"video"`. **`dc`** is sampled for **videos** as well as images (see strip section). `ar` may be any GCD-reduced ratio (not limited to the 4 image presets). Render with `<Video>` when `mt === "video"`.
- **Photo intro animation (`ia`):** added compact animation payload for video templates only. Presets are directional (`bottom-to-top`, `top-to-bottom`, `left-to-right`, `right-to-left`) with duration seconds (`d`). Applies to the **photo layer** (`ip`), not the name text layer.
- **Name layout (`nl`):** default **`"strip"`** — bottom strip with **`pn`**, **`np.st.ts`** typography, **`np` geometry ignored**; strip height **6.5%** of background band; **`dc`** at 50% with black for strip fill. **`"overlay"`** = legacy full `np`. Missing `nl` → `"overlay"`.
- **Dominant colour (`dc`) for video:** `dc` is extracted for **video** backgrounds (one or two frame samples; brighter result preferred) as well as images. Studio normalizes to **`#000000`** when sampling fails. Strip mode mixes black at 50% with `dc`; fallback dominant = **`#000000`**. Older docs incorrectly stated `dc` was always `null` for video.
