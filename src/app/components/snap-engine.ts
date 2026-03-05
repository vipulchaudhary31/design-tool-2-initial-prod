// ─── Snap Engine ───────────────────────────────────────────────
// Pure utility for computing snap positions, guide lines, distance
// indicators, and resize-snap during layer manipulation.

export const SNAP_THRESHOLD = 5; // px in canvas coordinates
export const KEYBOARD_STEP = 1;
export const KEYBOARD_SHIFT_STEP = 8;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapGuide {
  axis: 'x' | 'y'; // 'x' → vertical line, 'y' → horizontal line
  position: number; // canvas-coordinate position of the line
  type: 'center' | 'edge' | 'cross';
}

/** Distance indicator line between two points along an axis */
export interface DistanceIndicator {
  axis: 'x' | 'y'; // 'x' → horizontal distance line, 'y' → vertical distance line
  from: number; // start (canvas coords on the axis)
  to: number; // end (canvas coords on the axis)
  offset: number; // perpendicular offset (where to draw the line)
  value: number; // distance in px
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

export interface ResizeSnapResult {
  diameter: number;
  x: number;
  y: number;
  guides: SnapGuide[];
}

/** Get all meaningful edges + center for a rect */
function edges(r: Rect) {
  return {
    left: r.x,
    right: r.x + r.width,
    top: r.y,
    bottom: r.y + r.height,
    cx: r.x + r.width / 2,
    cy: r.y + r.height / 2,
  };
}

interface Target {
  value: number;
  type: SnapGuide['type'];
}

/**
 * Compute snapped position for a moving rect, considering canvas bounds,
 * canvas center, and other layer edges/centers.
 */
export function computeSnap(
  moving: Rect,
  others: Rect[],
  canvasWidth: number,
  canvasHeight: number,
  threshold: number = SNAP_THRESHOLD,
): SnapResult {
  const me = edges(moving);
  const guides: SnapGuide[] = [];

  // ── X-axis targets ──
  const xTargets: Target[] = [
    { value: 0, type: 'edge' },
    { value: canvasWidth, type: 'edge' },
    { value: canvasWidth / 2, type: 'center' },
  ];
  for (const other of others) {
    const oe = edges(other);
    xTargets.push({ value: oe.left, type: 'cross' });
    xTargets.push({ value: oe.right, type: 'cross' });
    xTargets.push({ value: oe.cx, type: 'cross' });
  }

  // ── Y-axis targets ──
  const yTargets: Target[] = [
    { value: 0, type: 'edge' },
    { value: canvasHeight, type: 'edge' },
    { value: canvasHeight / 2, type: 'center' },
  ];
  for (const other of others) {
    const oe = edges(other);
    yTargets.push({ value: oe.top, type: 'cross' });
    yTargets.push({ value: oe.bottom, type: 'cross' });
    yTargets.push({ value: oe.cy, type: 'cross' });
  }

  // ── Find best X snap ──
  let bestDx = Infinity;
  let bestXTarget: Target | null = null;
  const myXEdges = [
    { value: me.left },
    { value: me.right },
    { value: me.cx },
  ];
  for (const target of xTargets) {
    for (const myEdge of myXEdges) {
      const diff = target.value - myEdge.value;
      if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(bestDx)) {
        bestDx = diff;
        bestXTarget = target;
      }
    }
  }

  // ── Find best Y snap ──
  let bestDy = Infinity;
  let bestYTarget: Target | null = null;
  const myYEdges = [
    { value: me.top },
    { value: me.bottom },
    { value: me.cy },
  ];
  for (const target of yTargets) {
    for (const myEdge of myYEdges) {
      const diff = target.value - myEdge.value;
      if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(bestDy)) {
        bestDy = diff;
        bestYTarget = target;
      }
    }
  }

  // ── Apply snaps ──
  let snapX = moving.x;
  let snapY = moving.y;

  if (bestXTarget && Math.abs(bestDx) < threshold) {
    snapX = moving.x + bestDx;
    guides.push({ axis: 'x', position: bestXTarget.value, type: bestXTarget.type });
  }

  if (bestYTarget && Math.abs(bestDy) < threshold) {
    snapY = moving.y + bestDy;
    guides.push({ axis: 'y', position: bestYTarget.value, type: bestYTarget.type });
  }

  return { x: snapX, y: snapY, guides };
}

// ═══════════════════════════════════════════════════════════════
// Resize snap — snaps the circle's center to canvas/layer centers
// ═══════════════════════════════════════════════════════════════

type Corner = 'tl' | 'tr' | 'bl' | 'br';

/**
 * During circle resize, try to snap the resulting center to canvas center
 * or other layer centers. The anchor is the opposite corner.
 */
export function computeResizeSnap(
  rawX: number,
  rawY: number,
  rawDiameter: number,
  corner: Corner,
  anchorX: number, // anchored corner X (in canvas coords)
  anchorY: number, // anchored corner Y (in canvas coords)
  others: Rect[],
  canvasWidth: number,
  canvasHeight: number,
  minD: number,
  maxD: number,
  threshold: number = SNAP_THRESHOLD,
): ResizeSnapResult {
  const guides: SnapGuide[] = [];

  // Current center after resize
  const cx = rawX + rawDiameter / 2;
  const cy = rawY + rawDiameter / 2;

  // Center targets
  const centerTargetsX: Target[] = [{ value: canvasWidth / 2, type: 'center' }];
  const centerTargetsY: Target[] = [{ value: canvasHeight / 2, type: 'center' }];
  for (const other of others) {
    const oe = edges(other);
    centerTargetsX.push({ value: oe.cx, type: 'cross' });
    centerTargetsY.push({ value: oe.cy, type: 'cross' });
  }

  let bestD = rawDiameter;
  let bestX = rawX;
  let bestY = rawY;
  let bestDiff = Infinity;

  // For each center target, compute what diameter would align the center.
  // The anchor is the FIXED edge position throughout the resize.
  //   'br'/'tr': anchorX = left edge, center.x = anchorX + d/2
  //   'tl'/'bl': anchorX = right edge, center.x = anchorX - d/2
  //   'br'/'bl': anchorY = top edge, center.y = anchorY + d/2
  //   'tl'/'tr': anchorY = bottom edge, center.y = anchorY - d/2

  const trySnapX = (targetCX: number, target: Target) => {
    let candidateD: number;
    let candidateX: number;

    if (corner === 'br' || corner === 'tr') {
      candidateD = 2 * (targetCX - anchorX);
      candidateX = anchorX;
    } else {
      candidateD = 2 * (anchorX - targetCX);
      candidateX = anchorX - candidateD;
    }

    candidateD = Math.max(minD, Math.min(maxD, candidateD));
    if (candidateD <= 0) return;

    // Recompute X from clamped diameter
    if (corner === 'tl' || corner === 'bl') {
      candidateX = anchorX - candidateD;
    }

    const diff = Math.abs(candidateD - rawDiameter);
    if (diff < threshold * 2 && diff < bestDiff) {
      bestDiff = diff;
      bestD = candidateD;
      bestX = candidateX;
      bestY = (corner === 'br' || corner === 'bl') ? anchorY : anchorY - candidateD;
      // Clear prior guides and add this one
      guides.length = 0;
      guides.push({ axis: 'x', position: targetCX, type: target.type });
    }
  };

  const trySnapY = (targetCY: number, target: Target) => {
    let candidateD: number;
    let candidateY: number;

    if (corner === 'br' || corner === 'bl') {
      candidateD = 2 * (targetCY - anchorY);
      candidateY = anchorY;
    } else {
      candidateD = 2 * (anchorY - targetCY);
      candidateY = anchorY - candidateD;
    }

    candidateD = Math.max(minD, Math.min(maxD, candidateD));
    if (candidateD <= 0) return;

    if (corner === 'tl' || corner === 'tr') {
      candidateY = anchorY - candidateD;
    }

    const diff = Math.abs(candidateD - rawDiameter);
    if (diff < threshold * 2 && diff < bestDiff) {
      bestDiff = diff;
      bestD = candidateD;
      bestY = candidateY;
      bestX = (corner === 'br' || corner === 'tr') ? anchorX : anchorX - candidateD;
      guides.length = 0;
      guides.push({ axis: 'y', position: targetCY, type: target.type });
    }
  };

  for (const t of centerTargetsX) trySnapX(t.value, t);
  for (const t of centerTargetsY) trySnapY(t.value, t);

  // If no snap was found, keep original
  if (bestD === rawDiameter) {
    return { diameter: rawDiameter, x: rawX, y: rawY, guides: [] };
  }

  return { diameter: bestD, x: bestX, y: bestY, guides };
}

// ═══════════════════════════════════════════════════════════════
// Distance indicators — edge distances to canvas and gap between layers
// ═══════════════════════════════════════════════════════════════

export function computeDistances(
  moving: Rect,
  others: Rect[],
  canvasWidth: number,
  canvasHeight: number,
): DistanceIndicator[] {
  const me = edges(moving);
  const indicators: DistanceIndicator[] = [];

  // Distances to canvas edges
  const leftDist = me.left;
  const rightDist = canvasWidth - me.right;
  const topDist = me.top;
  const bottomDist = canvasHeight - me.bottom;

  // Horizontal distances (drawn at the vertical center of the layer)
  const midY = me.cy;

  if (leftDist > 1) {
    indicators.push({
      axis: 'x',
      from: 0,
      to: me.left,
      offset: midY,
      value: Math.round(leftDist),
    });
  }
  if (rightDist > 1) {
    indicators.push({
      axis: 'x',
      from: me.right,
      to: canvasWidth,
      offset: midY,
      value: Math.round(rightDist),
    });
  }

  // Vertical distances (drawn at the horizontal center of the layer)
  const midX = me.cx;

  if (topDist > 1) {
    indicators.push({
      axis: 'y',
      from: 0,
      to: me.top,
      offset: midX,
      value: Math.round(topDist),
    });
  }
  if (bottomDist > 1) {
    indicators.push({
      axis: 'y',
      from: me.bottom,
      to: canvasHeight,
      offset: midX,
      value: Math.round(bottomDist),
    });
  }

  // Gap between layers
  for (const other of others) {
    const oe = edges(other);

    // Vertical gap (moving is above or below)
    if (me.bottom < oe.top) {
      // Moving is above other — vertical gap
      const gap = oe.top - me.bottom;
      const gapMidX = (Math.max(me.left, oe.left) + Math.min(me.right, oe.right)) / 2;
      if (gap > 1 && gapMidX === gapMidX) { // NaN check
        indicators.push({
          axis: 'y',
          from: me.bottom,
          to: oe.top,
          offset: gapMidX,
          value: Math.round(gap),
        });
      }
    } else if (oe.bottom < me.top) {
      // Moving is below other — vertical gap
      const gap = me.top - oe.bottom;
      const gapMidX = (Math.max(me.left, oe.left) + Math.min(me.right, oe.right)) / 2;
      if (gap > 1 && gapMidX === gapMidX) {
        indicators.push({
          axis: 'y',
          from: oe.bottom,
          to: me.top,
          offset: gapMidX,
          value: Math.round(gap),
        });
      }
    }

    // Horizontal gap
    if (me.right < oe.left) {
      const gap = oe.left - me.right;
      const gapMidY = (Math.max(me.top, oe.top) + Math.min(me.bottom, oe.bottom)) / 2;
      if (gap > 1 && gapMidY === gapMidY) {
        indicators.push({
          axis: 'x',
          from: me.right,
          to: oe.left,
          offset: gapMidY,
          value: Math.round(gap),
        });
      }
    } else if (oe.right < me.left) {
      const gap = me.left - oe.right;
      const gapMidY = (Math.max(me.top, oe.top) + Math.min(me.bottom, oe.bottom)) / 2;
      if (gap > 1 && gapMidY === gapMidY) {
        indicators.push({
          axis: 'x',
          from: oe.right,
          to: me.left,
          offset: gapMidY,
          value: Math.round(gap),
        });
      }
    }
  }

  return indicators;
}

/** Build a Rect from the image (circle) placeholder */
export function circleToRect(x: number, y: number, diameter: number): Rect {
  return { x, y, width: diameter, height: diameter };
}

/** Build a Rect from the name (text) placeholder */
export function nameToRect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}