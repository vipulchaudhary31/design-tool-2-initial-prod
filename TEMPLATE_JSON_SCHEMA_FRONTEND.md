## Template JSON Schema — Frontend React Native Rendering Guide

Exported by **Poster Studio** web tool.  
Target platform: **React Native, Android-first**.

**Payload contract:** the studio builds a `CompactTemplateJSON` object and sends it to the backend as `raw_config` on template create. The background file is uploaded to object storage first; `bg` in the JSON is the **returned object key** (e.g. `uploads/background-2026-04-19T10-20-30.jpg`), not a data URL. Your mobile app should prefix that key with your **media / CDN base URL** when loading the image. `dc` is still useful for theming and fallbacks when the image is not yet loaded.

---

## Canvas & design space

The web editor uses a fixed **1080px wide** canvas. Height is variable and depends on the uploaded background:

- **Images** are validated against four allowed heights: **1152, 1350, 1484, 1620** (at width 1080).
- **Videos** use the real video dimensions normalised to 1080px wide — any height is possible.

The `ar` field is a string `"W:H"` (GCD-reduced), e.g. `4:5` for a 1080×1350 canvas, or `9:16` for a 1080×1920 video. **Do not** hardcode only known image ratios — `ar` can be any valid ratio string.

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
| `dc` | string \| `null`       | **Dominant colour** of the background (`#RRGGBB`), sampled from images only. Always **`null`** for video backgrounds. Use for UI chrome or placeholders when media is not yet loaded. |
| `mt` | `"image"` \| `"video"` | Background media type. **`"image"`** = JPEG/PNG/WebP; **`"video"`** = MP4. Use this to decide whether to render `<Image>` or `<Video>` in your app. |
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

## `np` — Name placeholder

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

**`dc` is always `null` for video backgrounds.** Don't rely on it for video templates — use a generic placeholder colour instead.

---

## Complete rendering sketch (RN)

Uses **parsed `ar`** for height, **`np` band from x/y/w/h**, and optional **`dc`** for placeholders:

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

  return (
    <View style={{ width: canvasWidth, height: canvasHeight, backgroundColor: json.dc ?? undefined }}>
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
- **`dc` (dominant color):** added for theming; may be `null` if not computed.  
- **`bg`:** production export is the **storage key** after upload, not an inline data URL.  
- **`np`:** **x, w, h** are always serialized; name band is no longer “fixed width / centered only” in data — layout matches the editor.

### May 2026
- **Video backgrounds (`mt: "video"`):** studio now accepts MP4 uploads alongside images. `bg` key ends in `.mp4`; `mt` is `"video"`. `dc` is always `null` for video. `ar` may be any GCD-reduced ratio (not limited to the 4 image presets). Render with `<Video>` when `mt === "video"`.
