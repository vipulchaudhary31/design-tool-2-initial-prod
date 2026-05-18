export const PHOTO_SHAPE_OPTIONS = [
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
  { value: 'heart', label: 'Heart' },
  { value: 'oval', label: 'Oval' },
  { value: 'flower', label: 'Flower' },
  { value: 'pin', label: 'Pin' },
  { value: 'dome', label: 'Dome' },
] as const;

export type PhotoShape = typeof PHOTO_SHAPE_OPTIONS[number]['value'];

const PHOTO_SHAPE_SET = new Set<string>(PHOTO_SHAPE_OPTIONS.map((shape) => shape.value));

export function normalizePhotoShape(value: unknown): PhotoShape {
  return typeof value === 'string' && PHOTO_SHAPE_SET.has(value) ? (value as PhotoShape) : 'circle';
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundedSquarePath(radiusPercent: number) {
  const r = clamp(radiusPercent, 0, 50);
  return [
    `M${r} 0`,
    `H${100 - r}`,
    `Q100 0 100 ${r}`,
    `V${100 - r}`,
    `Q100 100 ${100 - r} 100`,
    `H${r}`,
    `Q0 100 0 ${100 - r}`,
    `V${r}`,
    `Q0 0 ${r} 0`,
    'Z',
  ].join(' ');
}

function flowerPath() {
  const points: string[] = [];
  const petals = 8;
  const steps = 96;
  for (let i = 0; i <= steps; i += 1) {
    const angle = (Math.PI * 2 * i) / steps - Math.PI / 2;
    const wave = (1 + Math.cos(petals * angle)) / 2;
    const radius = 37 + wave * 13;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  points.push('Z');
  return points.join(' ');
}

export function getPhotoShapePath(shape: PhotoShape, cornerRadiusPercent = 0) {
  switch (shape) {
    case 'square':
      return roundedSquarePath(cornerRadiusPercent);
    case 'heart':
      return 'M50 98 C20 75 0 56 0 31 C0 12 14 0 33 0 C42 0 48 5 50 12 C52 5 58 0 67 0 C86 0 100 12 100 31 C100 56 80 75 50 98 Z';
    case 'oval':
      return 'M50 0 C73 0 88 17 92 40 C97 70 78 100 50 100 C22 100 3 70 8 40 C12 17 27 0 50 0 Z';
    case 'flower':
      return flowerPath();
    case 'pin':
      return 'M50 100 C50 100 5 60 5 31 C5 12 22 0 50 0 C78 0 95 12 95 31 C95 60 50 100 50 100 Z';
    case 'dome':
      return 'M0 100 L0 44 C0 17 20 0 50 0 C80 0 100 17 100 44 L100 100 Z';
    case 'circle':
    default:
      return 'M50 0 A50 50 0 1 1 49.99 0 Z';
  }
}

export function photoShapeNeedsCornerRadius(shape: PhotoShape) {
  return shape === 'square';
}

export function getPhotoShapeMaskUrl(shape: PhotoShape, cornerRadiusPercent: number, feathered: boolean) {
  const path = getPhotoShapePath(shape, cornerRadiusPercent);
  const filter = feathered
    ? '<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>'
    : '';
  const filterAttr = feathered ? ' filter="url(#soft)"' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${filter}<path d="${path}" fill="white"${filterAttr}/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
