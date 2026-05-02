// Compact template JSON schema used for export.
// This keeps the downloaded files small while this file documents
// the meaning of each short key for your dev team.

export type CompactTemplateJSON = {
  /** aspectRatio: e.g. "1080:1350" */
  ar: string;
  /** isProfileTemplate: true = Self (Profile), false = Wishes (Upload) */
  t: boolean;
  /** primaryCategories: Self/Wishes tags */
  pc: string[];
  /** languageTags */
  lg: string[];
  /** backgroundImage (data URL) or null */
  bg: string | null;
  /** dominantColorHex from background image (e.g. "#E84393") */
  dc: string | null;
  /** mediaType: "image" | "video" */
  mt: 'image' | 'video';
  /** Image (photo) placeholder */
  ip: {
    /** x position (% of canvas width, 0–100) */
    x: number;
    /** y position (% of canvas height, 0–100) */
    y: number;
    /** diameter (% of canvas width, 0–100) */
    d: number;
    /** shape: "circle" | "square" */
    sh: 'circle' | 'square';
    /** cornerRadius (only for square), in design px */
    cr?: number;
    /** hasBackground flag (used by consumer to decide cutout vs. full) */
    hb: boolean;
    /** strokeWidth around photo (design px) */
    sw: number;
    /** strokeColor (normalized hex) */
    sc: string;
  };
  /** Name/text placeholder */
  np: {
    /** x position (% of canvas width, 0–100) */
    x: number;
    /** y position (% of canvas height, 0–100) */
    y: number;
    /** width (% of canvas width, 0–100) */
    w: number;
    /** height (% of canvas height, 0–100) */
    h: number;
    /** styling configuration */
    st: {
      ts: {
        /** text color */
        c: string;
        /** fontSize (design px) */
        fs: number;
        /** fontWeight (numeric) */
        fw: number;
        /** letterSpacing (design px) */
        ls: number;
        /**
         * Compact text shadow config from the editor.
         * Null when shadow is disabled (opacity = 0).
         * All px values are in design px (1080-wide canvas).
         * `op` is opacity in the 0–1 range.
         * The RN app should expand this into `textShadowOffset`,
         * `textShadowRadius` and `textShadowColor` at render time.
         */
        sh: {
          ox: number; // offsetX
          oy: number; // offsetY
          bl: number; // blur radius
          col: string; // color (hex)
          op: number; // opacity (0–1)
        } | null;
        /**
         * Compact stroke config.
         * width in design px (1080-wide canvas) and colour as hex.
         * RN renderer should generate the 24/36 shadow ring from these
         * values using the algorithm described in TEMPLATE_JSON_SCHEMA_FRONTEND.md.
         */
        st: {
          w: number;
          col: string;
        };
        /** textAlignment: "left" | "center" | "right" */
        ta: 'left' | 'center' | 'right';
      };
    };
  };
};

// Human-readable mapping for dev docs / tooling.
export const TEMPLATE_KEY_MAP = {
  ar: 'aspectRatio',
  t: 'isProfileTemplate',
  pc: 'primaryCategories',
  lg: 'languageTags',
  bg: 'backgroundImage',
  dc: 'dominantColorHex',
  mt: 'mediaType',
  ip: 'imagePlaceholder',
  np: 'namePlaceholder',
  ip_x: 'imagePlaceholder.x',
  ip_y: 'imagePlaceholder.y',
  ip_d: 'imagePlaceholder.diameter',
  ip_sh: 'imagePlaceholder.shape',
  ip_cr: 'imagePlaceholder.cornerRadius',
  ip_hb: 'imagePlaceholder.hasBackground',
  ip_sw: 'imagePlaceholder.strokeWidth',
  ip_sc: 'imagePlaceholder.strokeColor',
  np_x: 'namePlaceholder.x',
  np_y: 'namePlaceholder.y',
  np_w: 'namePlaceholder.width',
  np_h: 'namePlaceholder.height',
  np_st_ts_c: 'namePlaceholder.styling.textStyle.color',
  np_st_ts_fs: 'namePlaceholder.styling.textStyle.fontSize',
  np_st_ts_fw: 'namePlaceholder.styling.textStyle.fontWeight',
  np_st_ts_ls: 'namePlaceholder.styling.textStyle.letterSpacing',
  np_st_ts_sh: 'namePlaceholder.styling.textStyle.textShadow',
  np_st_ts_st: 'namePlaceholder.styling.textStyle.textStroke',
  np_st_ts_ta: 'namePlaceholder.styling.textStyle.textAlignment',
} as const;

