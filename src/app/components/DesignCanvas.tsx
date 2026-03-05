import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DraggablePlaceholder } from './DraggablePlaceholder';
import type { TextAlignment, TextShadow, TextStroke } from './TextStyleEditor';
import { buildCombinedTextShadow } from './TextStyleEditor';
import { circleToRect, nameToRect, computeDistances, KEYBOARD_STEP, KEYBOARD_SHIFT_STEP } from './snap-engine';
import type { Rect, SnapGuide, DistanceIndicator } from './snap-engine';
import { Eye, Pencil, Upload } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

interface NamePlaceholder { x: number; y: number; width: number; height: number; }
interface ImagePlaceholder { x: number; y: number; diameter: number; }

interface DesignCanvasProps {
  backgroundImage: string | null;
  imageHolder: ImagePlaceholder;
  nameHolder: NamePlaceholder;
  onImageHolderChange: (pos: ImagePlaceholder) => void;
  onNameHolderChange: (pos: NamePlaceholder) => void;
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: string;
  userName?: string;
  fontSize?: number;
  fontWeight?: number;
  textColor?: string;
  textShadow?: TextShadow;
  textStroke?: TextStroke;
  userPhoto?: string | null;
  samplePhoto?: string;
  /** When false, preview attempts to show subject cutout (transparent background). */
  photoHasBackground?: boolean;
  mediaType?: 'image' | 'video';
  textAlignment?: TextAlignment;
  letterSpacing?: number;
  photoShape?: 'circle' | 'square';
  photoCornerRadius?: number;
  photoStrokeWidth?: number;
  photoStrokeColor?: string;
  onImageUpload?: (imageUrl: string, mediaType: 'image' | 'video') => void;
  allowedCanvasSizes?: { height: number; label: string }[];
}

const MAX_CANVAS_HEIGHT = 600;

// ── Snap & distance visual tokens (on-brand with dark theme) ──
// Primary blue from the theme: oklch(0.768 0.1305 223.2)
const SNAP_PRIMARY = 'oklch(0.768 0.1305 223.2)'; // bright blue — center/edge snaps
const SNAP_CROSS = 'oklch(0.65 0.09 280)'; // muted violet — cross-layer snaps
const DIST_LINE = 'oklch(0.55 0.04 260)'; // subtle slate — distance lines
const DIST_LABEL_BG = 'oklch(0.26 0.009 256 / 0.92)'; // card bg
const DIST_LABEL_FG = 'oklch(0.74 0.003 286)'; // muted foreground
const DIST_LABEL_BORDER = 'oklch(0.355 0.012 258 / 0.5)'; // border ring

export function DesignCanvas({
  backgroundImage,
  imageHolder,
  nameHolder,
  onImageHolderChange,
  onNameHolderChange,
  canvasWidth,
  canvasHeight,
  userName = 'User Name',
  fontSize = 48,
  fontWeight = 600,
  textColor = '#FFFFFF',
  textShadow = { offsetX: 0, offsetY: 0, blur: 0, color: '#000000', opacity: 0 },
  textStroke = { width: 0, color: '#000000' },
  userPhoto = null,
  samplePhoto,
  photoHasBackground = true,
  mediaType = 'image',
  textAlignment = 'center',
  letterSpacing = 0,
  photoShape = 'circle',
  photoCornerRadius = 16,
  photoStrokeWidth = 0,
  photoStrokeColor = '#000000',
  onImageUpload,
  allowedCanvasSizes,
}: DesignCanvasProps) {
  const [scale, setScale] = useState(1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<'image' | 'text' | null>(null);
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const [dragRect, setDragRect] = useState<Rect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Refs for keyboard handler (avoids stale closures) ──
  const imageHolderRef = useRef(imageHolder);
  imageHolderRef.current = imageHolder;
  const nameHolderRef = useRef(nameHolder);
  nameHolderRef.current = nameHolder;
  const selectedLayerRef = useRef(selectedLayer);
  selectedLayerRef.current = selectedLayer;
  const canvasWidthRef = useRef(canvasWidth);
  canvasWidthRef.current = canvasWidth;
  const canvasHeightRef = useRef(canvasHeight);
  canvasHeightRef.current = canvasHeight;
  const onImageHolderChangeRef = useRef(onImageHolderChange);
  onImageHolderChangeRef.current = onImageHolderChange;
  const onNameHolderChangeRef = useRef(onNameHolderChange);
  onNameHolderChangeRef.current = onNameHolderChange;

  useEffect(() => {
    const calc = () => {
      const hs = MAX_CANVAS_HEIGHT / canvasHeight;
      const cw = containerRef.current?.clientWidth ?? window.innerWidth * 0.5;
      const ws = cw / canvasWidth;
      setScale(Math.min(hs, ws));
    };
    calc();
    const el = containerRef.current;
    let ro: ResizeObserver | null = null;
    if (el) { ro = new ResizeObserver(calc); ro.observe(el); }
    window.addEventListener('resize', calc);
    return () => { window.removeEventListener('resize', calc); ro?.disconnect(); };
  }, [canvasWidth, canvasHeight]);

  // ══════════════ KEYBOARD HANDLER (single, stable) ══════════════
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const sel = selectedLayerRef.current;
      if (!sel) return;

      if (e.key === 'Escape') {
        setSelectedLayer(null);
        return;
      }

      const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!arrows.includes(e.key)) return;
      e.preventDefault();

      const step = e.shiftKey ? KEYBOARD_SHIFT_STEP : KEYBOARD_STEP;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      const cw = canvasWidthRef.current;
      const ch = canvasHeightRef.current;

      if (sel === 'image') {
        const ih = imageHolderRef.current;
        const newX = Math.round(Math.max(0, Math.min(cw - ih.diameter, ih.x + dx)));
        const newY = Math.round(Math.max(0, Math.min(ch - ih.diameter, ih.y + dy)));
        onImageHolderChangeRef.current({ ...ih, x: newX, y: newY });
      } else {
        const nh = nameHolderRef.current;
        // Text layer is Y-only (X locked)
        const newX = nh.x;
        const newY = Math.round(Math.max(0, Math.min(ch - nh.height, nh.y + dy)));
        onNameHolderChangeRef.current({ ...nh, x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Stable — reads from refs

  const previewPhoto = userPhoto || samplePhoto;

  const scaledCombinedShadow = buildCombinedTextShadow(
    { ...textShadow, offsetX: textShadow.offsetX * scale, offsetY: textShadow.offsetY * scale, blur: textShadow.blur * scale },
    { ...textStroke, width: textStroke.width * scale },
  );

  const strokePad = textStroke.width;
  const shadowPad = Math.max(textShadow.blur + Math.max(Math.abs(textShadow.offsetX), Math.abs(textShadow.offsetY)), 0);
  const scaledPad = Math.max(strokePad, shadowPad) * scale;

  // ── Build "other rects" for each layer's snapping ──
  const imageRect = useMemo(
    () => circleToRect(imageHolder.x, imageHolder.y, imageHolder.diameter),
    [imageHolder.x, imageHolder.y, imageHolder.diameter],
  );
  const textRect = useMemo(
    () => nameToRect(nameHolder.x, nameHolder.y, nameHolder.width, nameHolder.height),
    [nameHolder.x, nameHolder.y, nameHolder.width, nameHolder.height],
  );

  const otherRectsForImage = useMemo(() => [textRect], [textRect]);
  const otherRectsForText = useMemo(() => [imageRect], [imageRect]);

  // ── Guide handlers ──
  const handleImageGuides = useCallback((guides: SnapGuide[]) => setActiveGuides(guides), []);
  const handleTextGuides = useCallback((guides: SnapGuide[]) => setActiveGuides(guides), []);

  // ── Drag rect handlers (for distance indicators) ──
  const handleImageDragRect = useCallback((rect: Rect | null) => setDragRect(rect), []);
  const handleTextDragRect = useCallback((rect: Rect | null) => setDragRect(rect), []);

  // ── Compute distance indicators during drag ──
  const distanceIndicators = useMemo<DistanceIndicator[]>(() => {
    if (!dragRect) return [];
    const others = selectedLayer === 'image' ? [textRect] : [imageRect];
    return computeDistances(dragRect, others, canvasWidth, canvasHeight);
  }, [dragRect, selectedLayer, textRect, imageRect, canvasWidth, canvasHeight]);

  // ── Deselect when clicking canvas background ──
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedLayer(null);
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      if (file.type.startsWith('image/')) {
        if (file.size > MAX_IMAGE_SIZE) { toast.error('Image size exceeds the maximum limit of 15MB.'); return; }
        onImageUpload?.(imageUrl, 'image');
      } else if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_SIZE) { toast.error('Video size exceeds the maximum limit of 50MB.'); return; }
        onImageUpload?.(imageUrl, 'video');
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  // ── Render snap guide lines + distance indicators as SVG overlay ──
  const renderOverlay = () => {
    const hasGuides = activeGuides.length > 0;
    const hasDistances = distanceIndicators.length > 0;
    if (!hasGuides && !hasDistances) return null;

    const w = canvasWidth * scale;
    const h = canvasHeight * scale;

    // Shadow color for contrast on light poster backgrounds
    const SHADOW = 'rgba(0,0,0,0.4)';

    return (
      <svg
        className="absolute inset-0 pointer-events-none z-50"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ overflow: 'visible' }}
      >
        {/* Snap guide lines — shadow + colored pair */}
        {activeGuides.map((guide, i) => {
          const color = guide.type === 'cross' ? SNAP_CROSS : SNAP_PRIMARY;
          const pos = guide.position * scale;

          if (guide.axis === 'x') {
            return (
              <g key={`sg-${i}`}>
                <line x1={pos} y1={0} x2={pos} y2={h}
                  stroke={SHADOW} strokeWidth={3} strokeDasharray="4 3" opacity={0.5} />
                <line x1={pos} y1={0} x2={pos} y2={h}
                  stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.9} />
              </g>
            );
          } else {
            return (
              <g key={`sg-${i}`}>
                <line x1={0} y1={pos} x2={w} y2={pos}
                  stroke={SHADOW} strokeWidth={3} strokeDasharray="4 3" opacity={0.5} />
                <line x1={0} y1={pos} x2={w} y2={pos}
                  stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.9} />
              </g>
            );
          }
        })}

        {/* Distance indicators */}
        {distanceIndicators.map((di, i) => {
          if (di.value < 4) return null; // skip tiny distances

          if (di.axis === 'x') {
            // Horizontal distance line
            const y = di.offset * scale;
            const x1 = di.from * scale;
            const x2 = di.to * scale;
            const midX = (x1 + x2) / 2;
            const labelW = String(di.value).length * 7 + 10;

            return (
              <g key={`di-${i}`}>
                {/* Shadow strokes for light-bg contrast */}
                <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={SHADOW} strokeWidth={3} opacity={0.35} />
                <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={SHADOW} strokeWidth={3} opacity={0.35} />
                <line x1={x1} y1={y} x2={x2} y2={y} stroke={SHADOW} strokeWidth={3} opacity={0.25} />
                {/* End caps */}
                <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={DIST_LINE} strokeWidth={1} opacity={0.9} />
                <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={DIST_LINE} strokeWidth={1} opacity={0.9} />
                {/* Line */}
                <line x1={x1} y1={y} x2={x2} y2={y} stroke={DIST_LINE} strokeWidth={1} opacity={0.7} />
                {/* Label */}
                <rect x={midX - labelW / 2} y={y - 9} width={labelW} height={16} rx={3} fill={DIST_LABEL_BG} stroke={DIST_LABEL_BORDER} strokeWidth={1} />
                <text x={midX} y={y + 3} textAnchor="middle" fill={DIST_LABEL_FG} fontSize={9} fontFamily="monospace">
                  {di.value}
                </text>
              </g>
            );
          } else {
            // Vertical distance line
            const x = di.offset * scale;
            const y1 = di.from * scale;
            const y2 = di.to * scale;
            const midY = (y1 + y2) / 2;
            const labelW = String(di.value).length * 7 + 10;

            return (
              <g key={`di-${i}`}>
                {/* Shadow strokes for light-bg contrast */}
                <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} stroke={SHADOW} strokeWidth={3} opacity={0.35} />
                <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} stroke={SHADOW} strokeWidth={3} opacity={0.35} />
                <line x1={x} y1={y1} x2={x} y2={y2} stroke={SHADOW} strokeWidth={3} opacity={0.25} />
                {/* End caps */}
                <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} stroke={DIST_LINE} strokeWidth={1} opacity={0.9} />
                <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} stroke={DIST_LINE} strokeWidth={1} opacity={0.9} />
                {/* Line */}
                <line x1={x} y1={y1} x2={x} y2={y2} stroke={DIST_LINE} strokeWidth={1} opacity={0.7} />
                {/* Label */}
                <rect x={x - labelW / 2} y={midY - 9} width={labelW} height={16} rx={3} fill={DIST_LABEL_BG} stroke={DIST_LABEL_BORDER} strokeWidth={1} />
                <text x={x} y={midY + 3} textAnchor="middle" fill={DIST_LABEL_FG} fontSize={9} fontFamily="monospace">
                  {di.value}
                </text>
              </g>
            );
          }
        })}
      </svg>
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full outline-none">
      {/* Mode toggle */}
      {backgroundImage && (
        <div className="mb-3 flex items-center gap-1">
          <Button
            variant={!isPreviewMode ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setIsPreviewMode(false)}
          >
            <Pencil className="w-3 h-3" /> Editor
          </Button>
          <Button
            variant={isPreviewMode ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setIsPreviewMode(true)}
          >
            <Eye className="w-3 h-3" /> Preview
          </Button>
        </div>
      )}

      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="relative rounded-md"
        style={{
          width: canvasWidth * scale,
          height: canvasHeight * scale,
          boxShadow: backgroundImage ? '0 0 0 1px rgba(0,0,0,0.08), 0 20px 60px rgba(0,0,0,0.25)' : undefined,
          background: backgroundImage ? undefined : 'var(--card)',
          border: backgroundImage ? undefined : '1px dashed var(--border)',
        }}
      >
        {/* Background media — clipped separately so layer badges can overflow */}
        <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
          {backgroundImage && mediaType === 'video' && (
            <video src={backgroundImage} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline />
          )}
          {backgroundImage && mediaType === 'image' && (
            <img src={backgroundImage} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
        {!backgroundImage && (
          <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-primary/5 transition-all group">
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors">Upload a Background to start</p>
            </div>
          </label>
        )}

        {/* ── EDITOR ── */}
        {!isPreviewMode && backgroundImage && (
          <>
            <DraggablePlaceholder
              type="circle"
              x={imageHolder.x} y={imageHolder.y} height={imageHolder.diameter}
              canvasScale={scale} label="User Photo"
              canvasWidth={canvasWidth} canvasHeight={canvasHeight}
              onDrag={(x, y) => onImageHolderChange({ ...imageHolder, x, y })}
              onResizeDiameter={(d) => onImageHolderChange({ ...imageHolder, diameter: d })}
              onCircleChange={(x, y, d) => onImageHolderChange({ x, y, diameter: d })}
              minDiameter={300} maxDiameter={900}
              userPhoto={userPhoto} photoShape={photoShape} photoCornerRadius={photoCornerRadius}
              photoStrokeWidth={photoStrokeWidth} photoStrokeColor={photoStrokeColor}
              isSelected={selectedLayer === 'image'}
              onSelect={() => setSelectedLayer('image')}
              otherRects={otherRectsForImage}
              onActiveGuides={handleImageGuides}
              onDragRect={handleImageDragRect}
            />
            <DraggablePlaceholder
              type="rectangle"
              x={nameHolder.x} y={nameHolder.y} width={nameHolder.width} height={nameHolder.height}
              canvasScale={scale} label={userName} fontSize={fontSize} fontWeight={fontWeight}
              textColor={textColor} textShadow={textShadow} textStroke={textStroke}
              canvasWidth={canvasWidth} canvasHeight={canvasHeight}
              onDrag={(x, y) => onNameHolderChange({ ...nameHolder, x, y })}
              onRectChange={(x, y, w, h) => onNameHolderChange({ x, y, width: w, height: h })}
              minRectWidth={Math.round(canvasWidth * 0.50)} maxRectWidth={canvasWidth}
              minRectHeight={fontSize + 24} maxRectHeight={Math.round(canvasHeight * 0.12)}
              textAlignment={textAlignment} letterSpacing={letterSpacing}
              isSelected={selectedLayer === 'text'}
              onSelect={() => setSelectedLayer('text')}
              otherRects={otherRectsForText}
              onActiveGuides={handleTextGuides}
              onDragRect={handleTextDragRect}
            />

            {/* Snap guide + distance overlay */}
            {renderOverlay()}
          </>
        )}

        {/* ── PREVIEW ── */}
        {isPreviewMode && backgroundImage && (
          <>
            <div className="absolute" style={{ left: imageHolder.x * scale, top: imageHolder.y * scale }}>
              <div className="overflow-hidden" style={{
                width: imageHolder.diameter * scale, height: imageHolder.diameter * scale,
                borderRadius: photoShape === 'circle' ? '9999px' : `${photoCornerRadius * scale}px`,
                borderWidth: photoStrokeWidth > 0 ? photoStrokeWidth * scale : undefined,
                borderColor: photoStrokeWidth > 0 ? photoStrokeColor : undefined,
                borderStyle: photoStrokeWidth > 0 ? 'solid' : undefined,
                boxSizing: 'border-box',
              }}>
                {previewPhoto ? (
                  <img src={previewPhoto} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/30 flex items-center justify-center">
                    <span className="text-white text-xs">Photo</span>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute" style={{
              left: nameHolder.x * scale, top: nameHolder.y * scale,
              width: nameHolder.width * scale, height: nameHolder.height * scale,
            }}>
              <div className="relative w-full h-full flex items-center" style={{
                padding: `${12 * scale}px ${scaledPad + 6}px`,
                justifyContent: textAlignment === 'left' ? 'flex-start' : textAlignment === 'right' ? 'flex-end' : 'center',
              }}>
                <span className="relative z-10" style={{
                  fontFamily: "'Noto Sans', sans-serif",
                  color: textColor, fontWeight, fontSize: fontSize * scale, lineHeight: 1,
                  textShadow: scaledCombinedShadow, textAlign: textAlignment,
                  maxWidth: '100%', whiteSpace: 'nowrap', display: 'block',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: `${letterSpacing * scale}px`,
                  WebkitFontSmoothing: 'antialiased' as any,
                  MozOsxFontSmoothing: 'grayscale' as any,
                  textRendering: 'optimizeLegibility',
                }}>
                  {userName}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}