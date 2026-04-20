# Template JSON Schema

This document is the source of truth for the compact template payload sent from the studio to backend in `raw_config`.

## Current Payload (compact keys)

```json
{
  "ar": "1080:1350",
  "t": true,
  "pc": ["Self"],
  "lg": ["English", "Hindi"],
  "bg": "uploads/background-2026-04-19T10-20-30.jpg",
  "dc": "#E84393",
  "mt": "image",
  "ip": {
    "x": 36,
    "y": 18,
    "d": 28,
    "sh": "circle",
    "cr": 16,
    "hb": false,
    "sw": 2,
    "sc": "#FFFFFF"
  },
  "np": {
    "x": 10,
    "y": 62,
    "w": 80,
    "h": 8,
    "st": {
      "ts": {
        "c": "#FFFFFF",
        "fs": 48,
        "fw": 700,
        "ls": 0,
        "sh": {
          "ox": 0,
          "oy": 2,
          "bl": 8,
          "col": "#000000",
          "op": 0.65
        },
        "st": {
          "w": 2,
          "col": "#000000"
        },
        "ta": "center"
      }
    }
  }
}
```

## Field Mapping

- `ar` -> aspect ratio string
- `t` -> template type (`true` profile/self, `false` wishes/upload)
- `pc` -> primary categories
- `lg` -> languages
- `bg` -> uploaded background key/path
- `dc` -> dominant color hex from background (`#RRGGBB`) or `null`
- `mt` -> media type (`image` or `video`)
- `ip` -> image placeholder block
- `np` -> name placeholder block

## Change Log

- 2026-04-19: Added `dc` (dominant background color hex) to payload.

