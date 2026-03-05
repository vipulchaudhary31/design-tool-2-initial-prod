import { useState, useRef, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, ChevronDown, Sparkles } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Slider } from '@/app/components/ui/slider';
import { Separator } from '@/app/components/ui/separator';
import { Button } from '@/app/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/app/components/ui/collapsible';

export type TextAlignment = 'left' | 'center' | 'right';

export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
  opacity: number;
}

export interface TextStroke {
  width: number;
  color: string;
}

export interface TextStyle {
  color: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  textShadow: TextShadow;
  textStroke: TextStroke;
  textAlignment: TextAlignment;
  maxWidthPercent: number;
}

// ─── Conversion Helpers ───────────────────────────────────────────────

export function normalizeHex(hex: string, fallback: string): string {
  let h = hex.replace('#', '').replace(/[^0-9a-fA-F]/g, '');
  if (h.length === 0) return fallback;
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  h = h.padEnd(6, '0').substring(0, 6);
  return '#' + h.toUpperCase();
}

export function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
}

export function textShadowToCSS(shadow: TextShadow): string {
  if (shadow.offsetX === 0 && shadow.offsetY === 0 && shadow.blur === 0 && shadow.opacity === 0) return 'none';
  return `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${hexToRgba(shadow.color, shadow.opacity)}`;
}

export function textShadowToRN(shadow: TextShadow): {
  textShadowOffset: { width: number; height: number };
  textShadowRadius: number;
  textShadowColor: string;
} | null {
  // Return null when shadow is effectively off — RN renderer can skip shadow props entirely
  if (shadow.opacity === 0) return null;
  return {
    textShadowOffset: { width: shadow.offsetX, height: shadow.offsetY },
    textShadowRadius: shadow.blur,
    textShadowColor: hexToRgba(shadow.color, shadow.opacity),
  };
}

export function textStrokeToRNShadows(stroke: TextStroke) {
  if (stroke.width === 0) return [];
  const w = stroke.width;
  const c = stroke.color;
  // 24-point circle for smooth outlines (every 15°)
  const steps = 24;
  const shadows: { textShadowOffset: { width: number; height: number }; textShadowRadius: number; textShadowColor: string }[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    shadows.push({
      textShadowOffset: { width: +(w * Math.cos(angle)).toFixed(2), height: +(w * Math.sin(angle)).toFixed(2) },
      textShadowRadius: 0,
      textShadowColor: c,
    });
  }
  // For thick strokes (>3px) add inner ring at ~60% radius to fill gaps
  if (w > 3) {
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

export function buildCombinedTextShadow(shadow: TextShadow, stroke: TextStroke): string {
  const parts: string[] = [];
  if (stroke.width > 0) {
    const w = stroke.width;
    const c = stroke.color;
    // 24-point circle for smooth outlines (every 15°) — eliminates jagged gaps visible with 8-direction approach
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const dx = +(w * Math.cos(angle)).toFixed(2);
      const dy = +(w * Math.sin(angle)).toFixed(2);
      parts.push(`${dx}px ${dy}px 0px ${c}`);
    }
    // For thick strokes (>3px) add an inner ring at ~60% radius to fill any remaining gaps
    if (w > 3) {
      const inner = w * 0.6;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * 2 * Math.PI;
        const dx = +(inner * Math.cos(angle)).toFixed(2);
        const dy = +(inner * Math.sin(angle)).toFixed(2);
        parts.push(`${dx}px ${dy}px 0px ${c}`);
      }
    }
  }
  if (!(shadow.offsetX === 0 && shadow.offsetY === 0 && shadow.blur === 0 && shadow.opacity === 0)) {
    parts.push(`${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${hexToRgba(shadow.color, shadow.opacity)}`);
  }
  return parts.length > 0 ? parts.join(', ') : 'none';
}

// ─── Presets ──────────────────────────────────────────────────────────

const SHADOW_PRESETS: { label: string; shadow: TextShadow }[] = [
  { label: 'None', shadow: { offsetX: 0, offsetY: 0, blur: 0, color: '#000000', opacity: 0 } },
  { label: 'Subtle', shadow: { offsetX: 0, offsetY: 1, blur: 4, color: '#000000', opacity: 50 } },
  { label: 'Medium', shadow: { offsetX: 0, offsetY: 2, blur: 8, color: '#000000', opacity: 65 } },
  { label: 'Strong', shadow: { offsetX: 0, offsetY: 3, blur: 10, color: '#000000', opacity: 85 } },
  { label: 'Glow', shadow: { offsetX: 0, offsetY: 0, blur: 14, color: '#FFFFFF', opacity: 70 } },
];

const STROKE_WIDTH_PRESETS: { label: string; width: number }[] = [
  { label: 'None', width: 0 },
  { label: 'Thin', width: 1.5 },
  { label: 'Med', width: 2.5 },
  { label: 'Thick', width: 4 },
  { label: 'Bold', width: 6 },
];

const NO_SHADOW: TextShadow = { offsetX: 0, offsetY: 0, blur: 0, color: '#000000', opacity: 0 };

interface QuickStylePreset {
  label: string;
  desc: string;
  color: string;
  stroke: TextStroke;
  shadow: TextShadow;
  fontWeight?: number;
  letterSpacing?: number;
  swatch: { fill: string; outline: string; glow?: string };
}

/*
 * Caption-style presets inspired by popular YouTube / Reels / Shorts creators.
 * All values map 1:1 to React Native text styling (stroke → multi-offset shadows,
 * shadow → textShadow*, color/fontSize/fontWeight → direct props).
 *
 * Design rules:
 *   • Presets without stroke or shadow get letterSpacing: 0 (no artificial tracking)
 *   • Shadow-only presets get letterSpacing: 0 (shadow doesn't add visual mass)
 *   • Stroke presets get slight letterSpacing (0.5–1) to compensate for outline width
 */
const QUICK_STYLE_PRESETS: QuickStylePreset[] = [
  // ── Clean Foundations ──────────────────────────────────────
  {
    label: 'Clean',
    desc: 'Pure white, no effects',
    color: '#FFFFFF',
    fontWeight: 700,
    letterSpacing: 0,
    stroke: { width: 0, color: '#000000' },
    shadow: { ...NO_SHADOW },
    swatch: { fill: '#FFFFFF', outline: '#888' },
  },
  {
    label: 'Noir',
    desc: 'Clean black for light backgrounds',
    color: '#111111',
    fontWeight: 700,
    letterSpacing: 0,
    stroke: { width: 0, color: '#000000' },
    shadow: { ...NO_SHADOW },
    swatch: { fill: '#1A1A1A', outline: '#888' },
  },

  // ── Shadow ─────────────────────────────────────────────────
  {
    label: 'Shadow',
    desc: 'Soft cinematic drop shadow',
    color: '#FFFFFF',
    fontWeight: 600,
    letterSpacing: 0,
    stroke: { width: 0, color: '#000000' },
    shadow: { offsetX: 0, offsetY: 2, blur: 8, color: '#000000', opacity: 65 },
    swatch: { fill: '#FFFFFF', outline: '#555' },
  },

  // ── Outlined / Creator ─────────────────────────────────────
  {
    label: 'Outline',
    desc: 'Bold stroke + hard drop',
    color: '#FFFFFF',
    fontWeight: 800,
    letterSpacing: 0.5,
    stroke: { width: 3, color: '#000000' },
    shadow: { offsetX: 0, offsetY: 2, blur: 1, color: '#000000', opacity: 80 },
    swatch: { fill: '#FFFFFF', outline: '#000000' },
  },
  {
    label: 'Highlight',
    desc: 'Golden accent with outline',
    color: '#F2D834',
    fontWeight: 700,
    letterSpacing: 0.5,
    stroke: { width: 2.5, color: '#000000' },
    shadow: { offsetX: 0, offsetY: 2, blur: 4, color: '#000000', opacity: 40 },
    swatch: { fill: '#F2D834', outline: '#000000' },
  },
  {
    label: 'Neon',
    desc: 'Glow effect — trending Reels style',
    color: '#FFFFFF',
    fontWeight: 700,
    letterSpacing: 1,
    stroke: { width: 2, color: '#FF2D87' },
    shadow: { offsetX: 0, offsetY: 0, blur: 14, color: '#FF2D87', opacity: 55 },
    swatch: { fill: '#FFFFFF', outline: '#FF2D87', glow: '#FF2D87' },
  },
];

const FONT_WEIGHTS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra' },
  { value: 900, label: 'Black' },
];

function isPresetMatch(a: TextShadow, b: TextShadow): boolean {
  return a.offsetX === b.offsetX && a.offsetY === b.offsetY && a.blur === b.blur && a.color === b.color && a.opacity === b.opacity;
}

// ─── Color picker sub-component ───────────────────────────────────────
function ColorPicker({ value, onChange, onBlur, fallback }: {
  value: string; onChange: (v: string) => void; onBlur: () => void; fallback: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative cursor-pointer shrink-0">
        <input
          type="color"
          value={value.length === 7 ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="w-8 h-8 rounded-md border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-ring/30 transition-shadow"
          style={{ backgroundColor: value.length >= 4 ? value : fallback }}
        />
      </label>
      <Input
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(val) || val === '') onChange(val || fallback);
        }}
        onBlur={onBlur}
        className="flex-1 font-mono uppercase h-8 text-xs"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

interface TextStyleEditorProps {
  textStyle: TextStyle;
  onChange: (style: TextStyle) => void;
  userName: string;
  onUserNameChange: (name: string) => void;
}

export function TextStyleEditor({ textStyle, onChange, userName, onUserNameChange }: TextStyleEditorProps) {
  const [showAdvancedShadow, setShowAdvancedShadow] = useState(false);
  const [showStrokeDetails, setShowStrokeDetails] = useState(false);

  const update = (partial: Partial<TextStyle>) => onChange({ ...textStyle, ...partial });
  const updateShadow = (partial: Partial<TextShadow>) => onChange({ ...textStyle, textShadow: { ...textStyle.textShadow, ...partial } });
  const updateStroke = (partial: Partial<TextStroke>) => onChange({ ...textStyle, textStroke: { ...textStyle.textStroke, ...partial } });

  const [localFontSize, setLocalFontSize] = useState(() => String(textStyle.fontSize));
  const fontSizeFocusedRef = useRef(false);
  useEffect(() => {
    if (!fontSizeFocusedRef.current) setLocalFontSize(String(textStyle.fontSize));
  }, [textStyle.fontSize]);

  const shadow = textStyle.textShadow;
  const stroke = textStyle.textStroke;
  const activePreset = SHADOW_PRESETS.find(p => isPresetMatch(shadow, p.shadow));
  const isCustomShadow = !activePreset && (shadow.opacity > 0 || shadow.blur > 0);
  const activeStrokeW = STROKE_WIDTH_PRESETS.find(p => p.width === stroke.width);
  const isCustomStrokeW = !activeStrokeW && stroke.width > 0;
  const activeQuick = QUICK_STYLE_PRESETS.find(p =>
    p.color === textStyle.color && p.stroke.width === stroke.width && p.stroke.color === stroke.color && isPresetMatch(shadow, p.shadow)
      && (p.fontWeight === undefined || p.fontWeight === textStyle.fontWeight)
      && (p.letterSpacing === undefined || p.letterSpacing === textStyle.letterSpacing)
  );

  return (
    <div className="space-y-5">
      {/* Quick Styles — top of panel */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-primary/60" />
          <Label className="text-xs text-muted-foreground">Quick Styles</Label>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {QUICK_STYLE_PRESETS.map(preset => {
            const isActive = activeQuick === preset;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  const patch: Partial<TextStyle> = {
                    color: preset.color,
                    textStroke: { ...preset.stroke },
                    textShadow: { ...preset.shadow },
                  };
                  if (preset.fontWeight !== undefined) patch.fontWeight = preset.fontWeight;
                  if (preset.letterSpacing !== undefined) patch.letterSpacing = preset.letterSpacing;
                  update(patch);
                }}
                className={`flex flex-col items-start px-2 py-1.5 rounded-md text-[11px] transition-colors border gap-0.5 ${
                  isActive
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-transparent text-muted-foreground border-border hover:border-primary/20 hover:text-foreground'
                }`}
                title={preset.desc}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{
                      backgroundColor: preset.swatch.fill,
                      border: `1.5px solid ${preset.swatch.outline}`,
                      boxShadow: preset.swatch.glow ? `0 0 4px ${preset.swatch.glow}` : undefined,
                    }}
                  />
                  <span className="truncate">{preset.label}</span>
                </div>
              </button>
            );
          })}
        </div>
        {!activeQuick && (stroke.width > 0 || shadow.opacity > 0 || shadow.blur > 0) && (
          <p className="mt-1.5 text-[10px] text-primary/60">Custom style</p>
        )}
      </div>

      <Separator />

      {/* Color */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2">Text Color</Label>
        <ColorPicker
          value={textStyle.color}
          onChange={(v) => update({ color: v })}
          onBlur={() => update({ color: normalizeHex(textStyle.color, '#FFFFFF') })}
          fallback="#FFFFFF"
        />
      </div>

      {/* Size & Weight */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Font Size</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number" min={48} max={120}
              value={localFontSize}
              onFocus={() => { fontSizeFocusedRef.current = true; }}
              onBlur={() => {
                fontSizeFocusedRef.current = false;
                const n = parseInt(localFontSize, 10);
                const clamped = isNaN(n) ? 48 : Math.max(48, Math.min(120, n));
                if (clamped !== textStyle.fontSize) update({ fontSize: clamped });
                setLocalFontSize(String(clamped));
              }}
              onChange={(e) => {
                const raw = e.target.value;
                setLocalFontSize(raw);
                const n = parseInt(raw, 10);
                if (!isNaN(n)) update({ fontSize: Math.max(48, Math.min(120, n)) });
              }}
              className="h-8 text-xs"
            />
            <span className="text-[11px] text-muted-foreground shrink-0">px</span>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Weight</Label>
          <Select value={String(textStyle.fontWeight)} onValueChange={(v) => update({ fontWeight: parseInt(v) })}>
            <SelectTrigger size="sm" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map(fw => (
                <SelectItem key={fw.value} value={String(fw.value)}>
                  {fw.label} ({fw.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
          <span className="text-[11px] font-mono text-muted-foreground">{textStyle.letterSpacing}px</span>
        </div>
        <Slider
          min={-5} max={20} step={0.5}
          value={[textStyle.letterSpacing]}
          onValueChange={([v]) => update({ letterSpacing: v })}
        />
      </div>

      <Separator />

      {/* Stroke */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2">Stroke</Label>
        <div className="flex flex-wrap gap-1">
          {STROKE_WIDTH_PRESETS.map(p => {
            const active = activeStrokeW?.width === p.width;
            return (
              <button
                key={p.label}
                onClick={() => updateStroke({ width: p.width })}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors border ${
                  active ? 'bg-primary/15 text-primary border-primary/30' : 'text-muted-foreground border-border hover:border-primary/20'
                }`}
              >{p.label}</button>
            );
          })}
          {isCustomStrokeW && (
            <span className="px-2.5 py-1 rounded-md text-[11px] bg-primary/15 text-primary border border-primary/30">Custom</span>
          )}
        </div>

        {stroke.width > 0 && (
          <Collapsible open={showStrokeDetails} onOpenChange={setShowStrokeDetails}>
            <CollapsibleTrigger asChild>
              <button className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={`w-3 h-3 transition-transform ${showStrokeDetails ? 'rotate-180' : ''}`} />
                Adjust
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-3 p-3 bg-secondary/50 rounded-md border border-border">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground">Width</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{stroke.width}px</span>
                  </div>
                  <Slider min={0.5} max={10} step={0.5} value={[stroke.width]} onValueChange={([v]) => updateStroke({ width: v })} />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1.5">Color</span>
                  <ColorPicker
                    value={stroke.color}
                    onChange={(v) => updateStroke({ color: v })}
                    onBlur={() => updateStroke({ color: normalizeHex(stroke.color, '#000000') })}
                    fallback="#000000"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <Separator />

      {/* Shadow */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2">Shadow</Label>
        <div className="flex flex-wrap gap-1">
          {SHADOW_PRESETS.map(p => {
            const active = isPresetMatch(shadow, p.shadow);
            return (
              <button
                key={p.label}
                onClick={() => update({ textShadow: { ...p.shadow } })}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors border ${
                  active ? 'bg-primary/15 text-primary border-primary/30' : 'text-muted-foreground border-border hover:border-primary/20'
                }`}
              >{p.label}</button>
            );
          })}
          {isCustomShadow && (
            <span className="px-2.5 py-1 rounded-md text-[11px] bg-primary/15 text-primary border border-primary/30">Custom</span>
          )}
        </div>

        <Collapsible open={showAdvancedShadow} onOpenChange={setShowAdvancedShadow}>
          <CollapsibleTrigger asChild>
            <button className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedShadow ? 'rotate-180' : ''}`} />
              Advanced
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3 p-3 bg-secondary/50 rounded-md border border-border">
              {[
                { label: 'Offset X', key: 'offsetX' as const, min: -20, max: 20, step: 1 },
                { label: 'Offset Y', key: 'offsetY' as const, min: -20, max: 20, step: 1 },
                { label: 'Blur', key: 'blur' as const, min: 0, max: 30, step: 1 },
              ].map(s => (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{shadow[s.key]}px</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[shadow[s.key]]} onValueChange={([v]) => updateShadow({ [s.key]: v })} />
                </div>
              ))}

              <div className="flex items-end gap-3">
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1.5">Color</span>
                  <ColorPicker
                    value={shadow.color}
                    onChange={(v) => updateShadow({ color: v })}
                    onBlur={() => updateShadow({ color: normalizeHex(shadow.color, '#000000') })}
                    fallback="#000000"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground">Opacity</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{shadow.opacity}%</span>
                  </div>
                  <Slider min={0} max={100} step={5} value={[shadow.opacity]} onValueChange={([v]) => updateShadow({ opacity: v })} />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Separator />

      {/* Alignment — near bottom */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2">Alignment</Label>
        <div className="flex gap-1">
          {([
            { value: 'left' as TextAlignment, icon: AlignLeft },
            { value: 'center' as TextAlignment, icon: AlignCenter },
            { value: 'right' as TextAlignment, icon: AlignRight },
          ]).map(a => {
            const Icon = a.icon;
            const active = textStyle.textAlignment === a.value;
            return (
              <Button
                key={a.value}
                variant={active ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8"
                onClick={() => update({ textAlignment: a.value })}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            );
          })}
        </div>
      </div>

      {/* Preview name — bottom */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Preview Name</Label>
        <Input
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder="Enter a name..."
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}