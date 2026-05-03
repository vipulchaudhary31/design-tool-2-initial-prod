import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import type { TextAlignment, TextShadow, TextStroke } from './TextStyleEditor';
import { buildCombinedTextShadow } from './TextStyleEditor';
import { computeSnap, computeResizeSnap, circleToRect, nameToRect } from './snap-engine';
import type { Rect, SnapGuide } from './snap-engine';

type Corner = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | null;

export type PhotoAnimationPreset = 'none' | 'bottom-to-top' | 'top-to-bottom' | 'left-to-right' | 'right-to-left';

/**
 * Entry offset for each preset (screen px — large enough to start off-canvas).
 * Pure translate, no opacity change, so the photo slides cleanly into place.
 */
const PHOTO_ANIM_INITIAL: Record<PhotoAnimationPreset, object> = {
  none:            {},
  'bottom-to-top': { y: 600 },
  'top-to-bottom': { y: -600 },
  'left-to-right': { x: -600 },
  'right-to-left': { x: 600 },
};
const PHOTO_ANIM_FINAL: Record<PhotoAnimationPreset, object> = {
  none:            {},
  'bottom-to-top': { y: 0 },
  'top-to-bottom': { y: 0 },
  'left-to-right': { x: 0 },
  'right-to-left': { x: 0 },
};

interface DraggablePlaceholderProps {
  type: 'circle' | 'rectangle';
  x: number;
  y: number;
  width?: number;
  height: number;
  canvasScale: number;
  onDrag: (x: number, y: number) => void;
  onResizeDiameter?: (diameter: number) => void;
  /** Combined update for circle: position + diameter in one call */
  onCircleChange?: (x: number, y: number, diameter: number) => void;
  /** Combined update for rectangle: position + size (used for resize and move) */
  onRectChange?: (x: number, y: number, width: number, height: number) => void;
  minDiameter?: number;
  maxDiameter?: number;
  minRectWidth?: number;
  maxRectWidth?: number;
  minRectHeight?: number;
  maxRectHeight?: number;
  label: string;
  fontSize?: number;
  fontWeight?: number;
  textColor?: string;
  textShadow?: TextShadow;
  textStroke?: TextStroke;
  userPhoto?: string | null;
  /** Fallback preview image when `userPhoto` is not set (matches canvas preview behaviour). */
  samplePhoto?: string | null;
  canvasWidth: number;
  canvasHeight: number;
  textAlignment?: TextAlignment;
  letterSpacing?: number;
  textFontFamily?: string;
  photoShape?: 'circle' | 'square';
  photoCornerRadius?: number;
  photoStrokeWidth?: number;
  photoStrokeColor?: string;
  // ── Snap / selection props ──
  isSelected?: boolean;
  onSelect?: () => void;
  otherRects?: Rect[];
  onActiveGuides?: (guides: SnapGuide[]) => void;
  /** Reports the live moving rect during drag (for distance indicators) */
  onDragRect?: (rect: Rect | null) => void;
  /** Photo layer animation — only used for circle type when background is video */
  photoAnimation?: { preset: PhotoAnimationPreset; duration: number; playKey: number };
}

const CORNER_HIT_SIZE = 18;

/** Canvas selection accents — fixed OKLCH so handles match dark mode even in light UI (avoid theme `primary`). */
const SEL_HANDLE_FILL = 'oklch(0.768 0.1305 223.2)';
const SEL_HANDLE_BORDER_IDLE = 'oklch(0.5 0.12 223)';
const SEL_HANDLE_RING = 'oklch(0.768 0.1305 223.2 / 0.9)';
const SEL_HANDLE_RING_RECT = 'oklch(0.768 0.1305 223.2 / 0.8)';

function getCorner(localX: number, localY: number, boxW: number, boxH: number): Corner {
  // Clamp hit zone so the centre 40% of the element always stays grabbable,
  // even when the band is tiny (e.g. 72 design-px at 0.46 canvas scale ≈ 33 screen-px).
  const hitH = Math.min(CORNER_HIT_SIZE, Math.floor(boxH * 0.3));
  const hitW = Math.min(CORNER_HIT_SIZE, Math.floor(boxW * 0.3));

  const nearLeft   = localX < hitW;
  const nearRight  = localX > boxW - hitW;
  const nearTop    = localY < hitH;
  const nearBottom = localY > boxH - hitH;
  // Diagonal corners take priority
  if (nearTop    && nearLeft)  return 'tl';
  if (nearTop    && nearRight) return 'tr';
  if (nearBottom && nearLeft)  return 'bl';
  if (nearBottom && nearRight) return 'br';
  // Edge-midpoint strips
  if (nearTop)    return 't';
  if (nearBottom) return 'b';
  if (nearLeft)   return 'l';
  if (nearRight)  return 'r';
  return null;
}

// True for handles that only affect one axis
function isEdgeHandle(c: Corner): c is 't' | 'b' | 'l' | 'r' {
  return c === 't' || c === 'b' || c === 'l' || c === 'r';
}

/** Map a circle edge handle to a diagonal corner key understood by `computeResizeSnap`. */
function circleSnapCornerForEdge(edge: 't' | 'b' | 'l' | 'r'): 'tl' | 'tr' | 'bl' | 'br' {
  if (edge === 't') return 'tr';
  if (edge === 'b') return 'br';
  if (edge === 'l') return 'bl';
  return 'br';
}

function cornerCursor(c: Corner): string {
  if (c === 'tl' || c === 'br') return 'nwse-resize';
  if (c === 'tr' || c === 'bl') return 'nesw-resize';
  if (c === 't'  || c === 'b')  return 'ns-resize';
  if (c === 'l'  || c === 'r')  return 'ew-resize';
  return 'grab';
}

export function DraggablePlaceholder({
  type,
  x,
  y,
  width,
  height,
  canvasScale,
  onDrag,
  onResizeDiameter,
  onCircleChange,
  onRectChange,
  minDiameter = 100,
  maxDiameter = 600,
  minRectWidth = 200,
  maxRectWidth = 1080,
  minRectHeight = 60,
  maxRectHeight = 250,
  label,
  fontSize = 48,
  fontWeight = 600,
  textColor = '#FFFFFF',
  textShadow = { offsetX: 0, offsetY: 0, blur: 0, color: '#000000', opacity: 0 },
  textStroke = { width: 0, color: '#000000' },
  userPhoto = null,
  samplePhoto = null,
  canvasWidth,
  canvasHeight,
  textAlignment = 'center',
  letterSpacing = 0,
  textFontFamily = "'Noto Sans', 'Inter', sans-serif",
  photoShape = 'circle',
  photoCornerRadius = 16,
  photoStrokeWidth = 0,
  photoStrokeColor = '#FFFFFF',
  isSelected = false,
  onSelect,
  otherRects = [],
  onActiveGuides,
  onDragRect,
  photoAnimation,
}: DraggablePlaceholderProps) {
  const safeScale = canvasScale || 1;
  const previewPhoto = userPhoto || samplePhoto;

  // ── shared visual state ──
  const [hoveredCorner, setHoveredCorner] = useState<Corner>(null);
  const [interacting, setInteracting] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // ── pointer-capture refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerState = useRef<{
    action: 'move' | 'resize';
    corner: Corner;
    startPointerX: number;
    startPointerY: number;
    startX: number;
    startY: number;
    startDiameter: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  // Live position/size during gesture
  const [liveX, setLiveX] = useState(x);
  const [liveY, setLiveY] = useState(y);
  const [liveDiameter, setLiveDiameter] = useState(height);
  const [liveWidth, setLiveWidth] = useState(width ?? height);
  const [liveHeight, setLiveHeight] = useState(height);

  // Sync live values from props when not interacting
  useEffect(() => {
    if (!interacting) {
      setLiveX(x);
      setLiveY(y);
      setLiveDiameter(height);
      setLiveWidth(width ?? height);
      setLiveHeight(height);
    }
  }, [x, y, width, height, interacting]);

  // Clear guides + drag rect when not interacting
  useEffect(() => {
    if (!interacting) {
      onActiveGuides?.([]);
      onDragRect?.(null);
    }
  }, [interacting]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clamp helpers ──
  const clampCirclePos = useCallback(
    (px: number, py: number, d: number) => ({
      x: Math.max(0, Math.min(canvasWidth - d, px)),
      y: Math.max(0, Math.min(canvasHeight - d, py)),
    }),
    [canvasWidth, canvasHeight],
  );

  const clampRectPos = useCallback(
    (px: number, py: number, w: number, h: number) => ({
      x: Math.max(0, Math.min(canvasWidth - w, px)),
      y: Math.max(0, Math.min(canvasHeight - h, py)),
    }),
    [canvasWidth, canvasHeight],
  );

  const clampDiameter = useCallback(
    (d: number) => Math.max(minDiameter, Math.min(maxDiameter, d)),
    [minDiameter, maxDiameter],
  );

  const clampRectSize = useCallback(
    (w: number, h: number) => ({
      width: Math.max(minRectWidth, Math.min(maxRectWidth, w)),
      height: Math.max(minRectHeight, Math.min(maxRectHeight, h)),
    }),
    [minRectWidth, maxRectWidth, minRectHeight, maxRectHeight],
  );

  // ── Snap helper ──
  const applySnap = useCallback(
    (rect: Rect) => computeSnap(rect, otherRects, canvasWidth, canvasHeight),
    [otherRects, canvasWidth, canvasHeight],
  );

  // ══════════════ POINTER DOWN ══════════════
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      onSelect?.();

      const el = containerRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);

      const rect = el.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const detectedCorner = getCorner(localX, localY, rect.width, rect.height);
      const cornerCircle =
        type === 'circle' && onResizeDiameter && detectedCorner
          ? detectedCorner
          : null;
      const cornerRect = (type === 'rectangle' && onRectChange)
        ? detectedCorner : null;
      const corner = cornerCircle ?? cornerRect;

      pointerState.current = {
        action: corner ? 'resize' : 'move',
        corner,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startX: type === 'circle' ? liveX : liveX,
        startY: type === 'circle' ? liveY : liveY,
        startDiameter: type === 'circle' ? liveDiameter : height,
        startWidth: type === 'rectangle' ? liveWidth : (width ?? height),
        startHeight: type === 'rectangle' ? liveHeight : height,
      };

      setInteracting(true);
      setIsResizing(!!corner);
    },
    [type, liveX, liveY, liveDiameter, liveWidth, liveHeight, x, y, width, height, onResizeDiameter, onRectChange, onSelect],
  );

  // ══════════════ POINTER MOVE ══════════════
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ps = pointerState.current;
      if (!ps) {
        // Hover cursor tracking for resize handles
        if (containerRef.current && (type === 'circle' && onResizeDiameter || type === 'rectangle' && onRectChange)) {
          const rect = containerRef.current.getBoundingClientRect();
          const detected = getCorner(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
          setHoveredCorner(detected);
        }
        return;
      }
      e.preventDefault();

      const dx = (e.clientX - ps.startPointerX) / safeScale;
      const dy = (e.clientY - ps.startPointerY) / safeScale;

      if (type === 'circle') {
        if (ps.action === 'move') {
          const rawX = ps.startX + dx;
          const rawY = ps.startY + dy;
          const clamped = clampCirclePos(rawX, rawY, ps.startDiameter);
          const movingRect = circleToRect(clamped.x, clamped.y, ps.startDiameter);
          const snap = applySnap(movingRect);
          const finalClamped = clampCirclePos(snap.x, snap.y, ps.startDiameter);
          setLiveX(finalClamped.x);
          setLiveY(finalClamped.y);
          onActiveGuides?.(snap.guides);
          onDragRect?.(circleToRect(finalClamped.x, finalClamped.y, ps.startDiameter));
        } else {
          // ── Resize with center-snap ──
          const c = ps.corner;
          let newD: number;
          let newX = ps.startX;
          let newY = ps.startY;

          if (isEdgeHandle(c)) {
            const edge = c;
            if (edge === 't') {
              newD = clampDiameter(ps.startDiameter - 2 * dy);
              newY = ps.startY + ps.startDiameter - newD;
            } else if (edge === 'b') {
              newD = clampDiameter(ps.startDiameter + 2 * dy);
            } else if (edge === 'l') {
              newD = clampDiameter(ps.startDiameter - 2 * dx);
              newX = ps.startX + ps.startDiameter - newD;
            } else {
              newD = clampDiameter(ps.startDiameter + 2 * dx);
            }
          } else {
            let delta: number;
            if (c === 'br') delta = Math.max(dx, dy);
            else if (c === 'bl') delta = Math.max(-dx, dy);
            else if (c === 'tr') delta = Math.max(dx, -dy);
            else delta = Math.max(-dx, -dy);

            newD = clampDiameter(ps.startDiameter + delta);
            const actualDelta = newD - ps.startDiameter;
            if (c === 'tl') { newX -= actualDelta; newY -= actualDelta; }
            else if (c === 'tr') { newY -= actualDelta; }
            else if (c === 'bl') { newX -= actualDelta; }
          }

          const clamped = clampCirclePos(newX, newY, newD);

          // Anchor is the FIXED corner throughout the resize gesture
          // 'br'/'tr' → left edge is fixed, 'tl'/'bl' → right edge is fixed
          const snapCorner = isEdgeHandle(c) ? circleSnapCornerForEdge(c) : (c as 'tl' | 'tr' | 'bl' | 'br');
          const anchorX = (snapCorner === 'br' || snapCorner === 'tr')
            ? ps.startX
            : ps.startX + ps.startDiameter;
          // 'br'/'bl' → top edge is fixed, 'tl'/'tr' → bottom edge is fixed
          const anchorY = (snapCorner === 'br' || snapCorner === 'bl')
            ? ps.startY
            : ps.startY + ps.startDiameter;

          const resizeSnap = computeResizeSnap(
            clamped.x, clamped.y, newD,
            snapCorner,
            anchorX, anchorY,
            otherRects, canvasWidth, canvasHeight,
            minDiameter, maxDiameter,
          );

          if (resizeSnap.guides.length > 0) {
            const rsClamped = clampCirclePos(resizeSnap.x, resizeSnap.y, resizeSnap.diameter);
            setLiveX(rsClamped.x);
            setLiveY(rsClamped.y);
            setLiveDiameter(resizeSnap.diameter);
            onActiveGuides?.(resizeSnap.guides);
            onDragRect?.(circleToRect(rsClamped.x, rsClamped.y, resizeSnap.diameter));
          } else {
            setLiveX(clamped.x);
            setLiveY(clamped.y);
            setLiveDiameter(newD);
            onActiveGuides?.([]);
            onDragRect?.(circleToRect(clamped.x, clamped.y, newD));
          }
        }
      } else {
        // Rectangle (text) — move or resize
        if (ps.action === 'move') {
          const rawX = ps.startX + dx;
          const rawY = ps.startY + dy;
          const clamped = clampRectPos(rawX, rawY, ps.startWidth, ps.startHeight);
          const movingRect = nameToRect(clamped.x, clamped.y, ps.startWidth, ps.startHeight);
          const snap = applySnap(movingRect);
          const finalClamped = clampRectPos(snap.x, snap.y, ps.startWidth, ps.startHeight);
          setLiveX(finalClamped.x);
          setLiveY(finalClamped.y);
          onActiveGuides?.(snap.guides);
          onDragRect?.(nameToRect(finalClamped.x, finalClamped.y, ps.startWidth, ps.startHeight));
        } else if (isEdgeHandle(ps.corner)) {
          // Edge handle — resize one axis only, opposite edge stays fixed
          const c = ps.corner;
          let w = ps.startWidth, h = ps.startHeight, newX = ps.startX, newY = ps.startY;
          if (c === 't') {
            h = Math.max(minRectHeight, Math.min(maxRectHeight, ps.startHeight - dy));
            newY = ps.startY + ps.startHeight - h; // bottom edge fixed
          } else if (c === 'b') {
            h = Math.max(minRectHeight, Math.min(maxRectHeight, ps.startHeight + dy));
          } else if (c === 'l') {
            w = Math.max(minRectWidth, Math.min(maxRectWidth, ps.startWidth - dx));
            newX = ps.startX + ps.startWidth - w; // right edge fixed
          } else { // 'r'
            w = Math.max(minRectWidth, Math.min(maxRectWidth, ps.startWidth + dx));
          }
          // Canvas bounds: right/bottom edge must not exceed canvas
          if (newX + w > canvasWidth)  w = Math.max(minRectWidth,  canvasWidth  - newX);
          if (newY + h > canvasHeight) h = Math.max(minRectHeight, canvasHeight - newY);
          // Canvas bounds: left/top edge must not go below 0
          if (newX < 0) { w = Math.max(minRectWidth,  w + newX); newX = 0; }
          if (newY < 0) { h = Math.max(minRectHeight, h + newY); newY = 0; }
          setLiveX(newX); setLiveY(newY); setLiveWidth(w); setLiveHeight(h);
          onActiveGuides?.([]);
          onDragRect?.(nameToRect(newX, newY, w, h));
        } else {
          // Corner handle — opposite corner stays fixed
          const c = ps.corner as 'tl' | 'tr' | 'bl' | 'br';
          let rawW: number, rawH: number, newX: number, newY: number, w: number, h: number;
          if (c === 'tl') {
            rawW = ps.startWidth - dx; rawH = ps.startHeight - dy;
            ({ width: w, height: h } = clampRectSize(rawW, rawH));
            newX = ps.startX + ps.startWidth - w; newY = ps.startY + ps.startHeight - h;
          } else if (c === 'tr') {
            rawW = ps.startWidth + dx; rawH = ps.startHeight - dy;
            ({ width: w, height: h } = clampRectSize(rawW, rawH));
            newX = ps.startX; newY = ps.startY + ps.startHeight - h;
          } else if (c === 'bl') {
            rawW = ps.startWidth - dx; rawH = ps.startHeight + dy;
            ({ width: w, height: h } = clampRectSize(rawW, rawH));
            newX = ps.startX + ps.startWidth - w; newY = ps.startY;
          } else {
            rawW = ps.startWidth + dx; rawH = ps.startHeight + dy;
            ({ width: w, height: h } = clampRectSize(rawW, rawH));
            newX = ps.startX; newY = ps.startY;
          }
          // Canvas bounds: right/bottom edge must not exceed canvas
          if (newX + w > canvasWidth)  w = Math.max(minRectWidth,  canvasWidth  - newX);
          if (newY + h > canvasHeight) h = Math.max(minRectHeight, canvasHeight - newY);
          // Canvas bounds: left/top edge must not go below 0
          if (newX < 0) { w = Math.max(minRectWidth,  w + newX); newX = 0; }
          if (newY < 0) { h = Math.max(minRectHeight, h + newY); newY = 0; }
          setLiveX(newX); setLiveY(newY); setLiveWidth(w); setLiveHeight(h);
          onActiveGuides?.([]);
          onDragRect?.(nameToRect(newX, newY, w, h));
        }
      }
    },
    [type, safeScale, clampCirclePos, clampRectPos, clampDiameter, clampRectSize, onResizeDiameter, onRectChange, applySnap, onActiveGuides, onDragRect, otherRects, canvasWidth, canvasHeight, minDiameter, maxDiameter, minRectWidth, minRectHeight, maxRectWidth, maxRectHeight],
  );

  // ══════════════ POINTER UP ══════════════
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const ps = pointerState.current;
      if (!ps) return;

      const el = containerRef.current;
      if (el) el.releasePointerCapture(e.pointerId);
      pointerState.current = null;
      setInteracting(false);
      setIsResizing(false);
      onActiveGuides?.([]);
      onDragRect?.(null);

      if (type === 'circle') {
        if (onCircleChange) {
          onCircleChange(Math.round(liveX), Math.round(liveY), Math.round(liveDiameter));
        } else {
          onDrag(Math.round(liveX), Math.round(liveY));
          if (ps.action === 'resize' && onResizeDiameter) {
            onResizeDiameter(Math.round(liveDiameter));
          }
        }
      } else {
        if (onRectChange) {
          onRectChange(Math.round(liveX), Math.round(liveY), Math.round(liveWidth), Math.round(liveHeight));
        } else {
          onDrag(Math.round(liveX), Math.round(liveY));
        }
      }
    },
    [type, liveX, liveY, liveDiameter, liveWidth, liveHeight, onDrag, onResizeDiameter, onCircleChange, onRectChange, onActiveGuides, onDragRect],
  );

  // ══════════════ Computed visual values ══════════════
  const displayX = interacting ? liveX : x;
  const displayY = interacting ? liveY : y;
  const displayDiameter = type === 'circle' ? (interacting ? liveDiameter : height) : height;
  const displayWidth = type === 'rectangle' ? (interacting ? liveWidth : (width ?? height)) : (width ?? height);
  const displayHeight = type === 'rectangle' ? (interacting ? liveHeight : height) : height;
  const scaledWidth = displayWidth * safeScale;
  const scaledHeight = displayHeight * safeScale;

  // Build text shadow (for rectangle type)
  const scaledCombinedShadow = buildCombinedTextShadow(
    { ...textShadow, offsetX: textShadow.offsetX * safeScale, offsetY: textShadow.offsetY * safeScale, blur: textShadow.blur * safeScale },
    { ...textStroke, width: textStroke.width * safeScale },
  );

  const strokePad = textStroke.width;
  const shadowPad = Math.max(textShadow.blur + Math.max(Math.abs(textShadow.offsetX), Math.abs(textShadow.offsetY)), 0);
  const totalPad = Math.max(strokePad, shadowPad);
  const scaledPad = totalPad * safeScale;

  // ── Cursor for circle ──
  const circleCursor = interacting
    ? isResizing ? cornerCursor(pointerState.current?.corner ?? null) : 'grabbing'
    : hoveredCorner ? cornerCursor(hoveredCorner) : 'grab';

  // ══════════════ RENDER: CIRCLE ══════════════
  if (type === 'circle') {
    const scaledDisplaySize = displayDiameter * safeScale;

    return (
      <div
        ref={containerRef}
        data-design-layer="image"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { if (!pointerState.current) setHoveredCorner(null); }}
        className="group absolute"
        style={{
          left: displayX * safeScale,
          top: displayY * safeScale,
          width: scaledDisplaySize,
          height: scaledDisplaySize,
          cursor: circleCursor,
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* The visual shape — wrapped in motion.div for photo path animation */}
        {(() => {
          const preset = photoAnimation?.preset ?? 'none';
          const hasAnim = preset !== 'none';
          const shapeContent = (
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden"
              style={{
                border: photoStrokeWidth > 0 ? `${photoStrokeWidth * safeScale}px solid ${photoStrokeColor}` : 'none',
                borderRadius: photoShape === 'circle' ? '9999px' : `${photoCornerRadius * safeScale}px`,
                boxSizing: 'border-box',
                backgroundColor: previewPhoto
                  ? 'transparent'
                  : interacting ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              {previewPhoto ? (
                <img src={previewPhoto} alt="User Photo" className="w-full h-full object-cover pointer-events-none" draggable={false} />
              ) : (
                <div className="text-muted-foreground text-xs px-3 py-1.5 rounded-full text-center pointer-events-none">
                  {label}
                </div>
              )}
            </div>
          );
          if (!hasAnim) return shapeContent;
          return (
            <motion.div
              key={`${preset}-${photoAnimation?.playKey ?? 0}`}
              className="w-full h-full"
              initial={PHOTO_ANIM_INITIAL[preset]}
              animate={PHOTO_ANIM_FINAL[preset]}
              transition={{
                duration: photoAnimation?.duration ?? 2,
                // Keep this explicit so export renderer can match exactly.
                ease: [0.42, 0, 0.58, 1],
              }}
            >
              {shapeContent}
            </motion.div>
          );
        })()}

        {/* Corner handles */}
        {onResizeDiameter && (
          <>
            {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
              const isActive = hoveredCorner === corner || isResizing;
              return (
                <div
                  key={corner}
                  className={`absolute z-20 transition-all duration-150 ${
                    isActive || interacting
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'
                  }`}
                  style={{
                    top: corner.startsWith('t') ? -5 : undefined,
                    bottom: corner.startsWith('b') ? -5 : undefined,
                    left: corner.endsWith('l') ? -5 : undefined,
                    right: corner.endsWith('r') ? -5 : undefined,
                    width: 12, height: 12,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    className={`w-full h-full rounded-sm shadow-md border-2 bg-white transition-all duration-100 ${
                      hoveredCorner === corner ? 'scale-125' : ''
                    }`}
                    style={{
                      borderColor: hoveredCorner === corner ? SEL_HANDLE_FILL : SEL_HANDLE_BORDER_IDLE,
                      backgroundColor: hoveredCorner === corner ? SEL_HANDLE_FILL : 'white',
                    }}
                  />
                </div>
              );
            })}

            {/* Edge-midpoint handles (same pill style as the text box) */}
            {(['t', 'b', 'l', 'r'] as const).map((edge) => {
              const isH = edge === 't' || edge === 'b';
              const isActive = hoveredCorner === edge || isResizing;
              return (
                <div
                  key={edge}
                  className={`absolute z-20 transition-all duration-150 ${
                    isActive || interacting
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{
                    top:       edge === 't' ? -4  : edge === 'b' ? undefined : '50%',
                    bottom:    edge === 'b' ? -4  : undefined,
                    left:      edge === 'l' ? -4  : edge === 'r' ? undefined : '50%',
                    right:     edge === 'r' ? -4  : undefined,
                    transform: isH ? 'translateX(-50%)' : 'translateY(-50%)',
                    width:  isH ? 28 : 6,
                    height: isH ? 6  : 28,
                    borderRadius: 3,
                    background: hoveredCorner === edge ? SEL_HANDLE_FILL : 'white',
                    border: `1.5px solid ${hoveredCorner === edge ? SEL_HANDLE_FILL : SEL_HANDLE_BORDER_IDLE}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
                    pointerEvents: 'none',
                    transition: 'all 100ms ease',
                  }}
                />
              );
            })}

            {/* Size badge during resize */}
            {isResizing && (
              <div
                className="absolute left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md whitespace-nowrap z-30 shadow-lg backdrop-blur-sm text-[11px] font-mono"
                style={{
                  bottom: -30,
                  background: 'oklch(0.26 0.009 256 / 0.92)',
                  color: 'oklch(0.74 0.003 286)',
                  border: '1px solid oklch(0.355 0.012 258 / 0.5)',
                }}
              >
                {Math.round(liveDiameter)}px
              </div>
            )}
          </>
        )}

        {/* Selection outline */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-150"
          style={{
            borderRadius: photoShape === 'circle' ? '9999px' : `${photoCornerRadius * safeScale}px`,
            boxShadow: isSelected || interacting ? `0 0 0 2px ${SEL_HANDLE_RING}` : 'none',
          }}
        />
      </div>
    );
  }

  // ── Cursor for rectangle ──
  const rectCursor = interacting
    ? isResizing ? cornerCursor(pointerState.current?.corner ?? null) : 'grabbing'
    : hoveredCorner ? cornerCursor(hoveredCorner) : 'grab';

  // ══════════════ RENDER: RECTANGLE (text placeholder) ══════════════
  return (
    <div
      ref={containerRef}
      data-design-layer="text"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => { if (!pointerState.current) setHoveredCorner(null); }}
      className="group absolute"
      style={{
        left: displayX * safeScale,
        top: displayY * safeScale,
        width: scaledWidth,
        height: scaledHeight,
        cursor: rectCursor,
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Corner + edge resize handles */}
      {onRectChange && (isSelected || interacting) && (
        <>
          {/* ── 4 corner handles (square dots) ── */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
            const isActive = hoveredCorner === corner || isResizing;
            return (
              <div
                key={corner}
                className={`absolute z-20 transition-all duration-150 ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'
                }`}
                style={{
                  top:    corner.startsWith('t') ? -5 : undefined,
                  bottom: corner.startsWith('b') ? -5 : undefined,
                  left:   corner.endsWith('l')   ? -5 : undefined,
                  right:  corner.endsWith('r')   ? -5 : undefined,
                  width: 12, height: 12,
                  pointerEvents: 'none',
                }}
              >
                <div
                  className={`w-full h-full rounded-sm shadow-md border-2 bg-white transition-all duration-100 ${
                    hoveredCorner === corner ? 'scale-125' : ''
                  }`}
                  style={{
                    borderColor: hoveredCorner === corner ? SEL_HANDLE_FILL : SEL_HANDLE_BORDER_IDLE,
                    backgroundColor: hoveredCorner === corner ? SEL_HANDLE_FILL : 'white',
                  }}
                />
              </div>
            );
          })}

          {/* ── 4 edge handles (pill bars) ── */}
          {(['t', 'b', 'l', 'r'] as const).map((edge) => {
            const isH = edge === 't' || edge === 'b'; // horizontal pill
            const isActive = hoveredCorner === edge || isResizing;
            return (
              <div
                key={edge}
                className={`absolute z-20 transition-all duration-150 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{
                  top:       edge === 't' ? -4  : edge === 'b' ? undefined : '50%',
                  bottom:    edge === 'b' ? -4  : undefined,
                  left:      edge === 'l' ? -4  : edge === 'r' ? undefined : '50%',
                  right:     edge === 'r' ? -4  : undefined,
                  transform: isH ? 'translateX(-50%)' : 'translateY(-50%)',
                  width:  isH ? 28 : 6,
                  height: isH ? 6  : 28,
                  borderRadius: 3,
                  background: hoveredCorner === edge ? SEL_HANDLE_FILL : 'white',
                  border: `1.5px solid ${hoveredCorner === edge ? SEL_HANDLE_FILL : SEL_HANDLE_BORDER_IDLE}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
                  pointerEvents: 'none',
                  transition: 'all 100ms ease',
                }}
              />
            );
          })}

          {isResizing && (
            <div
              className="absolute left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md whitespace-nowrap z-30 shadow-lg backdrop-blur-sm text-[11px] font-mono"
              style={{
                bottom: -30,
                background: 'oklch(0.26 0.009 256 / 0.92)',
                color: 'oklch(0.74 0.003 286)',
                border: '1px solid oklch(0.355 0.012 258 / 0.5)',
              }}
            >
              {Math.round(displayWidth)} × {Math.round(displayHeight)} px
            </div>
          )}
        </>
      )}
      {/* Selection ring — sits on the outer box, text can overflow visually */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-150"
        style={{
          boxShadow: isSelected || interacting ? `0 0 0 1.5px ${SEL_HANDLE_RING_RECT}` : 'none',
        }}
      />
      {/* Text Content — vertically centred, not clipped (overflow:visible so stroke/shadow show) */}
      <div
        className="absolute inset-0 flex items-center"
        style={{
          padding: `${12 * safeScale}px ${scaledPad + 6}px`,
          justifyContent:
            textAlignment === 'left' ? 'flex-start'
            : textAlignment === 'right' ? 'flex-end'
            : 'center',
          overflow: 'visible',
        }}
      >
        <span
          className="relative z-10"
          style={{
            fontFamily: textFontFamily,
            color: textColor,
            fontWeight: fontWeight,
            fontSize: fontSize * safeScale,
            lineHeight: 'normal',
            textShadow: scaledCombinedShadow,
            textAlign: textAlignment,
            whiteSpace: 'nowrap',
            display: 'block',
            overflow: 'visible',
            letterSpacing: `${letterSpacing * safeScale}px`,
            WebkitFontSmoothing: 'antialiased' as any,
            MozOsxFontSmoothing: 'grayscale' as any,
            textRendering: 'optimizeLegibility',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
