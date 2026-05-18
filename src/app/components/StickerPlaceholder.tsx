import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

interface StickerHolder {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StickerPlaceholderProps {
  stickerImage: string;
  holder: StickerHolder;
  canvasScale: number;
  canvasWidth: number;
  canvasHeight: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange: (holder: StickerHolder) => void;
}

type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | null;

const HANDLE_SIZE = 12;
const HANDLE_FILL = 'oklch(0.768 0.1305 223.2)';
const HANDLE_BORDER = 'oklch(0.5 0.12 223)';
const OUTLINE = 'oklch(0.768 0.1305 223.2 / 0.9)';

function handleCursor(handle: ResizeHandle) {
  if (handle === 'tl' || handle === 'br') return 'nwse-resize';
  if (handle === 'tr' || handle === 'bl') return 'nesw-resize';
  if (handle === 't' || handle === 'b') return 'ns-resize';
  if (handle === 'l' || handle === 'r') return 'ew-resize';
  return 'grab';
}

function detectResizeHandle(localX: number, localY: number, width: number, height: number): ResizeHandle {
  const hit = 18;
  const nearLeft = localX <= hit;
  const nearRight = localX >= width - hit;
  const nearTop = localY <= hit;
  const nearBottom = localY >= height - hit;
  if (nearTop && nearLeft) return 'tl';
  if (nearTop && nearRight) return 'tr';
  if (nearBottom && nearLeft) return 'bl';
  if (nearBottom && nearRight) return 'br';
  if (nearTop) return 't';
  if (nearBottom) return 'b';
  if (nearLeft) return 'l';
  if (nearRight) return 'r';
  return null;
}

export function StickerPlaceholder({
  stickerImage,
  holder,
  canvasScale,
  canvasWidth,
  canvasHeight,
  isSelected = false,
  onSelect,
  onChange,
}: StickerPlaceholderProps) {
  const safeScale = canvasScale || 1;
  const ref = useRef<HTMLDivElement>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle>(null);
  const [liveHolder, setLiveHolder] = useState(holder);
  const [interacting, setInteracting] = useState(false);
  const pointerState = useRef<{
    action: 'move' | 'resize';
    handle: ResizeHandle;
    startPointerX: number;
    startPointerY: number;
    start: StickerHolder;
  } | null>(null);

  useEffect(() => {
    if (!interacting) setLiveHolder(holder);
  }, [holder, interacting]);

  const current = interacting ? liveHolder : holder;
  const scaledW = current.width * safeScale;
  const scaledH = current.height * safeScale;
  const aspect = Math.max(0.01, current.width / Math.max(current.height, 1));

  const clampHolder = useCallback((next: StickerHolder): StickerHolder => {
    const width = Math.max(40, Math.min(canvasWidth, next.width));
    const height = Math.max(40, Math.min(canvasHeight, next.height));
    return {
      x: Math.max(0, Math.min(canvasWidth - width, next.x)),
      y: Math.max(0, Math.min(canvasHeight - height, next.y)),
      width,
      height,
    };
  }, [canvasWidth, canvasHeight]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect?.();
    ref.current?.setPointerCapture(event.pointerId);
    const rect = ref.current?.getBoundingClientRect();
    const localX = rect ? event.clientX - rect.left : 0;
    const localY = rect ? event.clientY - rect.top : 0;
    const handle = detectResizeHandle(localX, localY, scaledW, scaledH);
    pointerState.current = {
      action: handle ? 'resize' : 'move',
      handle,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      start: current,
    };
    setInteracting(true);
  }, [current, onSelect, scaledH, scaledW]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!pointerState.current) {
      if (rect) setHoveredHandle(detectResizeHandle(event.clientX - rect.left, event.clientY - rect.top, scaledW, scaledH));
      return;
    }

    const state = pointerState.current;
    const dx = (event.clientX - state.startPointerX) / safeScale;
    const dy = (event.clientY - state.startPointerY) / safeScale;

    if (state.action === 'move') {
      setLiveHolder(clampHolder({
        ...state.start,
        x: state.start.x + dx,
        y: state.start.y + dy,
      }));
      return;
    }

    const signedDelta =
      state.handle === 'tl' ? Math.max(-dx, -dy * aspect)
        : state.handle === 'tr' ? Math.max(dx, -dy * aspect)
          : state.handle === 'bl' ? Math.max(-dx, dy * aspect)
            : state.handle === 't' ? -dy * aspect
              : state.handle === 'b' ? dy * aspect
                : state.handle === 'l' ? -dx
                  : state.handle === 'r' ? dx
                    : Math.max(dx, dy * aspect);
    const nextWidth = Math.max(40, state.start.width + signedDelta);
    const nextHeight = nextWidth / aspect;
    const nextX = state.handle === 'tl' || state.handle === 'bl' || state.handle === 'l'
      ? state.start.x + state.start.width - nextWidth
      : state.start.x;
    const nextY = state.handle === 'tl' || state.handle === 'tr' || state.handle === 't'
      ? state.start.y + state.start.height - nextHeight
      : state.start.y;
    setLiveHolder(clampHolder({ x: nextX, y: nextY, width: nextWidth, height: nextHeight }));
  }, [aspect, clampHolder, safeScale, scaledH, scaledW]);

  const finishPointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (pointerState.current) onChange(clampHolder(liveHolder));
    pointerState.current = null;
    setInteracting(false);
    try {
      ref.current?.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore stale captures when the browser has already released the pointer.
    }
  }, [clampHolder, liveHolder, onChange]);

  return (
    <div
      ref={ref}
      data-design-layer="sticker"
      className="group absolute"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerLeave={() => { if (!pointerState.current) setHoveredHandle(null); }}
      style={{
        left: current.x * safeScale,
        top: current.y * safeScale,
        width: scaledW,
        height: scaledH,
        cursor: interacting ? (pointerState.current?.action === 'resize' ? handleCursor(pointerState.current.handle) : 'grabbing') : handleCursor(hoveredHandle),
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <img src={stickerImage} alt="Sticker" className="h-full w-full pointer-events-none object-contain" draggable={false} />
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-150"
        style={{ boxShadow: isSelected || interacting ? `0 0 0 2px ${OUTLINE}` : 'none' }}
      />
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <div
          key={corner}
          className={`absolute z-20 transition-all duration-150 ${
            isSelected || interacting ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'
          }`}
          style={{
            top: corner.startsWith('t') ? -5 : undefined,
            bottom: corner.startsWith('b') ? -5 : undefined,
            left: corner.endsWith('l') ? -5 : undefined,
            right: corner.endsWith('r') ? -5 : undefined,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            pointerEvents: 'none',
          }}
        >
          <div
            className="h-full w-full rounded-sm border-2 bg-white transition-all duration-100"
            style={{
              borderColor: hoveredHandle === corner ? HANDLE_FILL : HANDLE_BORDER,
              backgroundColor: hoveredHandle === corner ? HANDLE_FILL : 'white',
            }}
          />
        </div>
      ))}
      {(['t', 'b', 'l', 'r'] as const).map((edge) => {
        const horizontal = edge === 't' || edge === 'b';
        const isActive = hoveredHandle === edge || interacting;
        return (
          <div
            key={edge}
            className={`absolute z-20 transition-all duration-150 ${
              isSelected || interacting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            style={{
              top: edge === 't' ? -4 : edge === 'b' ? undefined : '50%',
              bottom: edge === 'b' ? -4 : undefined,
              left: edge === 'l' ? -4 : edge === 'r' ? undefined : '50%',
              right: edge === 'r' ? -4 : undefined,
              transform: horizontal ? 'translateX(-50%)' : 'translateY(-50%)',
              width: horizontal ? 28 : 6,
              height: horizontal ? 6 : 28,
              borderRadius: 3,
              background: isActive ? HANDLE_FILL : 'white',
              border: `1.5px solid ${isActive ? HANDLE_FILL : HANDLE_BORDER}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
              transition: 'all 100ms ease',
            }}
          />
        );
      })}
    </div>
  );
}
