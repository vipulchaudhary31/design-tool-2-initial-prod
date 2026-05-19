/**
 * Persist design workspace to localStorage so refresh keeps in-progress work.
 * Scoped blob data can hit quota on very large images; callers handle failures.
 */

import type { TextStyle } from '@/app/components/TextStyleEditor';
import { normalizePhotoShape, type PhotoShape } from '@/app/photoShapes';
import { defaultScheduleDateKey } from '@/utils/postSchedule';

const STORAGE_KEY = 'poster-studio-session-v1';
const SCHEMA_VERSION = 1;

export interface ImagePlaceholderPersisted {
  x: number;
  y: number;
  diameter: number;
}

export interface NamePlaceholderPersisted {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StickerHolderPersisted {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PosterStudioSessionPayload {
  v: typeof SCHEMA_VERSION;
  backgroundImage: string | null;
  backgroundMediaType: 'image' | 'video';
  imageDimensions: { width: number; height: number } | null;
  isProfileTemplate: boolean;
  selectedTags: string[];
  selectedLanguages: string[];
  userName: string;
  userPhoto: string | null;
  stickerImage: string | null;
  stickerHolder: StickerHolderPersisted;
  photoShape: PhotoShape;
  photoCornerRadius: number;
  photoHasBackground: boolean;
  photoStrokeWidth: number;
  photoStrokeColor: string;
  photoBlurBorders: boolean;
  isDarkMode: boolean;
  textStyle: TextStyle;
  imageHolder: ImagePlaceholderPersisted;
  nameHolder: NamePlaceholderPersisted;
  postName: string;
  postLiveImmediately: boolean;
  postScheduleDateKey: string;
  postScheduleTimeHm: string;
  nameLayout: 'strip' | 'overlay';
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object';
}

function parsePayload(raw: string): PosterStudioSessionPayload | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!isRecord(data) || data.v !== SCHEMA_VERSION) return null;

    const str = (k: string) =>
      typeof data[k] === 'string' ? (data[k] as string) : null;
    const strOrNull = (k: string) =>
      data[k] === null ? null : typeof data[k] === 'string' ? (data[k] as string) : null;

    if (typeof data.isProfileTemplate !== 'boolean') return null;
    if (!Array.isArray(data.selectedTags) || !data.selectedTags.every(t => typeof t === 'string')) return null;
    if (!Array.isArray(data.selectedLanguages) || !data.selectedLanguages.every(t => typeof t === 'string')) return null;

    const id = data.imageDimensions;
    const dims =
      id !== null &&
      isRecord(id) &&
      typeof id.width === 'number' &&
      typeof id.height === 'number'
        ? { width: id.width as number, height: id.height as number }
        : null;

    const textStyle = data.textStyle;
    if (!isRecord(textStyle)) return null;

    const ih = data.imageHolder;
    const nh = data.nameHolder;
    const sticker = data.stickerHolder;
    if (
      !isRecord(ih) ||
      typeof ih.x !== 'number' ||
      typeof ih.y !== 'number' ||
      typeof ih.diameter !== 'number' ||
      !isRecord(nh) ||
      typeof nh.x !== 'number' ||
      typeof nh.y !== 'number' ||
      typeof nh.width !== 'number' ||
      typeof nh.height !== 'number'
    )
      return null;

    const ph = normalizePhotoShape(data.photoShape);
    const stickerHolder =
      isRecord(sticker) &&
      typeof sticker.x === 'number' &&
      typeof sticker.y === 'number' &&
      typeof sticker.width === 'number' &&
      typeof sticker.height === 'number'
        ? {
            x: sticker.x as number,
            y: sticker.y as number,
            width: sticker.width as number,
            height: sticker.height as number,
          }
        : { x: 420, y: 260, width: 240, height: 240 };

    const tsShadow = textStyle.textShadow;
    const tsStroke = textStyle.textStroke;
    if (
      typeof textStyle.color !== 'string' ||
      typeof textStyle.fontSize !== 'number' ||
      typeof textStyle.fontWeight !== 'number' ||
      typeof textStyle.letterSpacing !== 'number' ||
      typeof textStyle.textAlignment !== 'string' ||
      typeof textStyle.maxWidthPercent !== 'number' ||
      !isRecord(tsShadow) ||
      typeof tsShadow.offsetX !== 'number' ||
      typeof tsShadow.offsetY !== 'number' ||
      typeof tsShadow.blur !== 'number' ||
      typeof tsShadow.color !== 'string' ||
      typeof tsShadow.opacity !== 'number' ||
      !isRecord(tsStroke) ||
      typeof tsStroke.width !== 'number' ||
      typeof tsStroke.color !== 'string'
    )
      return null;

    const textStyleParsed: TextStyle = {
      color: textStyle.color as string,
      fontSize: textStyle.fontSize as number,
      fontWeight: textStyle.fontWeight as number,
      letterSpacing: textStyle.letterSpacing as number,
      textShadow: {
        offsetX: tsShadow.offsetX as number,
        offsetY: tsShadow.offsetY as number,
        blur: tsShadow.blur as number,
        color: tsShadow.color as string,
        opacity: tsShadow.opacity as number,
      },
      textStroke: {
        width: tsStroke.width as number,
        color: tsStroke.color as string,
      },
      textAlignment:
        textStyle.textAlignment === 'left' ||
        textStyle.textAlignment === 'center' ||
        textStyle.textAlignment === 'right'
          ? textStyle.textAlignment
          : 'center',
      maxWidthPercent: textStyle.maxWidthPercent as number,
    };

    const postScheduleDateKey =
      typeof data.postScheduleDateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.postScheduleDateKey)
        ? data.postScheduleDateKey
        : defaultScheduleDateKey();
    const postScheduleTimeHm =
      typeof data.postScheduleTimeHm === 'string' && /^\d{2}:\d{2}$/.test(data.postScheduleTimeHm)
        ? data.postScheduleTimeHm
        : '';

    return {
      v: SCHEMA_VERSION,
      backgroundImage: strOrNull('backgroundImage'),
      backgroundMediaType: data.backgroundMediaType === 'video' ? 'video' : 'image',
      imageDimensions: dims,
      isProfileTemplate: data.isProfileTemplate as boolean,
      selectedTags: data.selectedTags as string[],
      selectedLanguages: data.selectedLanguages as string[],
      userName: str('userName') ?? '',
      userPhoto: strOrNull('userPhoto'),
      stickerImage: strOrNull('stickerImage'),
      stickerHolder,
      photoShape: ph,
      photoCornerRadius: typeof data.photoCornerRadius === 'number' ? data.photoCornerRadius : 16,
      photoHasBackground: typeof data.photoHasBackground === 'boolean' ? data.photoHasBackground : false,
      photoStrokeWidth: typeof data.photoStrokeWidth === 'number' ? data.photoStrokeWidth : 0,
      photoStrokeColor: typeof data.photoStrokeColor === 'string' ? data.photoStrokeColor : '#FFFFFF',
      photoBlurBorders: typeof data.photoBlurBorders === 'boolean' ? data.photoBlurBorders : false,
      isDarkMode: typeof data.isDarkMode === 'boolean' ? data.isDarkMode : true,
      textStyle: textStyleParsed,
      imageHolder: { x: ih.x as number, y: ih.y as number, diameter: ih.diameter as number },
      nameHolder: {
        x: nh.x as number,
        y: nh.y as number,
        width: nh.width as number,
        height: nh.height as number,
      },
      postName: typeof data.postName === 'string' ? data.postName : '',
      postLiveImmediately: typeof data.postLiveImmediately === 'boolean' ? data.postLiveImmediately : false,
      postScheduleDateKey,
      postScheduleTimeHm,
      nameLayout: data.nameLayout === 'overlay' ? 'overlay' : 'strip',
    };
  } catch {
    return null;
  }
}

export function loadPosterStudioSession(): PosterStudioSessionPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parsePayload(raw);
  } catch {
    return null;
  }
}

export function savePosterStudioSession(payload: PosterStudioSessionPayload): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const body: PosterStudioSessionPayload = { ...payload, v: SCHEMA_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(body));
    return true;
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.code === 22 || e.code === 18 || e.name === 'QuotaExceededError')
    ) {
      return false;
    }
    return false;
  }
}

export function clearPosterStudioSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
