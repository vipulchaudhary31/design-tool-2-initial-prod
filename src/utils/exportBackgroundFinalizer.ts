import { NAME_STRIP_HEIGHT_PX, nameStripBackgroundHex } from '@/utils/nameStripStyle';
import {
  normalizeBackgroundUploadContentType,
  type BackgroundContentType,
} from '@/utils/isRasterBackgroundFile';

const DESIGN_REFERENCE_WIDTH = 1080;

export interface ExportFinalizationStatus {
  label: string;
  detail?: string;
  progress: number;
}

interface FinalizeBackgroundOptions {
  backgroundSource: string;
  backgroundMediaType: 'image' | 'video';
  backgroundDesignHeightPx: number;
  nameLayout: 'strip' | 'overlay';
  dominantColorHex?: string | null;
  stickerImage?: string | null;
  stickerHolder?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  onStatus?: (status: ExportFinalizationStatus) => void;
}

interface FinalizedBackgroundResult {
  blob: Blob;
  contentType: BackgroundContentType;
  didFinalizeOnDevice: boolean;
}

type DrawCapableVideoSample = {
  draw: (
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    sx: number,
    sy: number,
    sWidth: number,
    sHeight: number,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
  ) => void;
  displayWidth: number;
  displayHeight: number;
};

function emitStatus(
  onStatus: FinalizeBackgroundOptions['onStatus'],
  progress: number,
  label: string,
  detail?: string,
) {
  onStatus?.({
    progress: Math.max(0, Math.min(100, progress)),
    label,
    detail,
  });
}

function stripHeightForWidth(widthPx: number, nameLayout: 'strip' | 'overlay') {
  const stripHeight = nameLayout === 'strip'
    ? Math.max(1, Math.round((widthPx * NAME_STRIP_HEIGHT_PX) / DESIGN_REFERENCE_WIDTH))
    : 0;
  return {
    stripHeight,
  };
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not initialize background renderer.');
  return ctx;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: BackgroundContentType,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not encode the finalized background.'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load the background image.'));
    img.src = src;
  });
}

async function loadSourceBlob(backgroundSource: string): Promise<Blob> {
  const response = await fetch(backgroundSource);
  if (!response.ok) {
    throw new Error('Failed to read the selected background.');
  }
  return response.blob();
}

function drawStripBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  stripY: number,
  stripHeight: number,
  dominantColorHex: string | null | undefined,
) {
  if (stripHeight <= 0) return;
  ctx.fillStyle = nameStripBackgroundHex(dominantColorHex);
  ctx.fillRect(0, stripY, width, stripHeight);
}

function hasStickerOverlay(options: FinalizeBackgroundOptions) {
  return !!(
    options.stickerImage
    && options.stickerHolder
    && Number.isFinite(options.stickerHolder.x)
    && Number.isFinite(options.stickerHolder.y)
    && Number.isFinite(options.stickerHolder.width)
    && Number.isFinite(options.stickerHolder.height)
    && options.stickerHolder.width > 0
    && options.stickerHolder.height > 0
  );
}

function drawStickerOverlay(
  ctx: CanvasRenderingContext2D,
  stickerImage: HTMLImageElement,
  stickerHolder: NonNullable<FinalizeBackgroundOptions['stickerHolder']>,
  outputWidth: number,
  outputBackgroundHeight: number,
  backgroundDesignHeightPx: number,
) {
  const designHeight = Math.max(backgroundDesignHeightPx, 1);
  const drawX = (stickerHolder.x / DESIGN_REFERENCE_WIDTH) * outputWidth;
  const drawY = (stickerHolder.y / designHeight) * outputBackgroundHeight;
  const drawWidth = (stickerHolder.width / DESIGN_REFERENCE_WIDTH) * outputWidth;
  const drawHeight = (stickerHolder.height / designHeight) * outputBackgroundHeight;

  ctx.drawImage(stickerImage, drawX, drawY, drawWidth, drawHeight);
}

async function finalizeImageBackground(
  backgroundSource: string,
  backgroundDesignHeightPx: number,
  dominantColorHex: string | null | undefined,
  stickerImageSource: string | null | undefined,
  stickerHolder: FinalizeBackgroundOptions['stickerHolder'],
  includeStrip: boolean,
  onStatus?: FinalizeBackgroundOptions['onStatus'],
): Promise<FinalizedBackgroundResult> {
  emitStatus(onStatus, 12, 'Working…', 'Preparing your background.');

  const [image, stickerImage] = await Promise.all([
    loadImageElement(backgroundSource),
    stickerImageSource && stickerHolder ? loadImageElement(stickerImageSource) : Promise.resolve(null),
  ]);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const { stripHeight } = stripHeightForWidth(sourceWidth, includeStrip ? 'strip' : 'overlay');
  const totalHeight = sourceHeight + stripHeight;
  const canvas = createCanvas(sourceWidth, totalHeight);
  const ctx = getCanvasContext(canvas);

  emitStatus(onStatus, 38, 'Working…', 'Applying your design.');

  ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  if (includeStrip) {
    drawStripBackground(ctx, sourceWidth, sourceHeight, stripHeight, dominantColorHex);
  }
  if (stickerImage && stickerHolder) {
    drawStickerOverlay(
      ctx,
      stickerImage,
      stickerHolder,
      sourceWidth,
      sourceHeight,
      backgroundDesignHeightPx,
    );
  }

  emitStatus(onStatus, 68, 'Working…', 'Finishing the image.');
  const blob = await canvasToBlob(canvas, 'image/png');

  return {
    blob,
    contentType: 'image/png',
    didFinalizeOnDevice: true,
  };
}

function estimateTargetVideoBitrate(
  inputBytes: number,
  durationSeconds: number,
  sourceHeight: number,
  totalHeight: number,
  averageBitrate: number | null,
): number {
  const baseBitrate = averageBitrate && averageBitrate > 0
    ? averageBitrate
    : (Number.isFinite(durationSeconds) && durationSeconds > 0
        ? Math.round((inputBytes * 8) / durationSeconds)
        : 8_000_000);

  const scaled = Math.ceil(baseBitrate * (totalHeight / Math.max(sourceHeight, 1)));
  if (!Number.isFinite(scaled) || scaled <= 0) {
    return 8_000_000;
  }
  return scaled;
}

async function getVideoMetadata(backgroundSource: string): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => resolve({
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
    });
    video.onerror = () => reject(new Error('Failed to load the background video.'));
    video.src = backgroundSource;
  });
}

function unsupportedVideoExportMessage() {
  return 'Video export is not available in this browser yet. Please use the latest Safari or Chrome on iPhone/iPad, Chrome on Android, or Chrome/Edge on desktop.';
}

function normalizeVideoExportError(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error(unsupportedVideoExportMessage());
  }

  const message = error.message.toLowerCase();
  const isSupportFailure =
    message.includes('cannot decode')
    || message.includes('cannot encode')
    || message.includes('could not be finalized in this browser')
    || message.includes('video backgrounds yet')
    || message.includes('no_encodable_target_codec');

  if (isSupportFailure) {
    return new Error(unsupportedVideoExportMessage());
  }

  return error;
}

async function finalizeVideoBackground(
  sourceBlob: Blob,
  backgroundSource: string,
  backgroundDesignHeightPx: number,
  dominantColorHex: string | null | undefined,
  stickerImageSource: string | null | undefined,
  stickerHolder: FinalizeBackgroundOptions['stickerHolder'],
  includeStrip: boolean,
  onStatus?: FinalizeBackgroundOptions['onStatus'],
): Promise<FinalizedBackgroundResult> {
  if (
    !window.isSecureContext
    || typeof window.VideoEncoder === 'undefined'
    || typeof window.VideoDecoder === 'undefined'
  ) {
    throw new Error(unsupportedVideoExportMessage());
  }

  emitStatus(
    onStatus,
    10,
    'Working…',
    'Preparing your video.',
  );

  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    canEncodeVideo,
    Conversion,
    Input,
    Mp4OutputFormat,
    Output,
    getFirstEncodableVideoCodec,
  } = await import('mediabunny');

  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(sourceBlob, {
      maxCacheSize: 4 * 1024 * 1024,
    }),
  });

  try {
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new Error('Could not read the uploaded video track.');
    }

    const canDecode = await videoTrack.canDecode();
    if (!canDecode) {
      throw new Error('This browser cannot decode the selected video for strip finalization.');
    }

    const [videoMetadata, stickerImage] = await Promise.all([
      getVideoMetadata(backgroundSource),
      stickerImageSource && stickerHolder ? loadImageElement(stickerImageSource) : Promise.resolve(null),
    ]);
    const { duration, width: sourceWidth, height: sourceHeight } = videoMetadata;
    const { stripHeight } = stripHeightForWidth(sourceWidth, includeStrip ? 'strip' : 'overlay');
    const totalHeight = sourceHeight + stripHeight;
    const inputCodec = await videoTrack.getCodec();
    const averageBitrate = await videoTrack.getAverageBitrate();
    const targetBitrate = estimateTargetVideoBitrate(
      sourceBlob.size,
      duration,
      sourceHeight,
      totalHeight,
      averageBitrate,
    );

    const preferredCodec = inputCodec && await canEncodeVideo(inputCodec, {
      width: sourceWidth,
      height: totalHeight,
      bitrate: targetBitrate,
    })
      ? inputCodec
      : null;

    const codec = preferredCodec ?? await getFirstEncodableVideoCodec(['avc', 'hevc'], {
      width: sourceWidth,
      height: totalHeight,
      bitrate: targetBitrate,
    });

    if (!codec) {
      throw new Error('This browser cannot encode MP4 video for the finalized strip background.');
    }

    emitStatus(
      onStatus,
      18,
      'Working…',
      'Applying your design.',
    );

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: false }),
      target: new BufferTarget(),
    });

    let workingCanvas: HTMLCanvasElement | null = null;
    let workingCtx: CanvasRenderingContext2D | null = null;

    const conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      video: {
        codec,
        bitrate: targetBitrate,
        forceTranscode: true,
        hardwareAcceleration: 'prefer-hardware',
        processedWidth: sourceWidth,
        processedHeight: totalHeight,
        process: (sample: DrawCapableVideoSample) => {
          if (!workingCanvas || !workingCtx) {
            workingCanvas = createCanvas(sourceWidth, totalHeight);
            workingCtx = getCanvasContext(workingCanvas);
          }

          workingCtx.clearRect(0, 0, sourceWidth, totalHeight);
          sample.draw(
            workingCtx,
            0,
            0,
            sample.displayWidth,
            sample.displayHeight,
            0,
            0,
            sourceWidth,
            sourceHeight,
          );
          if (includeStrip) {
            drawStripBackground(workingCtx, sourceWidth, sourceHeight, stripHeight, dominantColorHex);
          }
          if (stickerImage && stickerHolder) {
            drawStickerOverlay(
              workingCtx,
              stickerImage,
              stickerHolder,
              sourceWidth,
              sourceHeight,
              backgroundDesignHeightPx,
            );
          }
          return workingCanvas;
        },
      },
      showWarnings: false,
    });

    if (!conversion.isValid) {
      throw new Error('The selected video could not be finalized in this browser.');
    }

    conversion.onProgress = (progress) => {
      emitStatus(
        onStatus,
        18 + progress * 60,
        'Working…',
        'Finishing the video.',
      );
    };

    await conversion.execute();

    const buffer = output.target.buffer;
    if (!buffer) {
      throw new Error('The finalized video could not be assembled.');
    }

    emitStatus(onStatus, 80, 'Working…', 'Saving your video.');

    return {
      blob: new Blob([buffer], { type: 'video/mp4' }),
      contentType: 'video/mp4',
      didFinalizeOnDevice: true,
    };
  } catch (error) {
    throw normalizeVideoExportError(error);
  } finally {
    input.dispose();
  }
}

export async function finalizeBackgroundForExport({
  backgroundSource,
  backgroundMediaType,
  backgroundDesignHeightPx,
  nameLayout,
  dominantColorHex,
  stickerImage,
  stickerHolder,
  onStatus,
}: FinalizeBackgroundOptions): Promise<FinalizedBackgroundResult> {
  emitStatus(onStatus, 4, 'Getting ready', 'Preparing your background.');

  const sourceBlob = await loadSourceBlob(backgroundSource);
  const normalizedContentType = normalizeBackgroundUploadContentType(sourceBlob, backgroundSource);
  const includeStrip = nameLayout === 'strip';
  const includeSticker = hasStickerOverlay({
    backgroundSource,
    backgroundMediaType,
    backgroundDesignHeightPx,
    nameLayout,
    dominantColorHex,
    stickerImage,
    stickerHolder,
    onStatus,
  });

  if (!includeStrip && !includeSticker) {
    return {
      blob: sourceBlob.type === normalizedContentType
        ? sourceBlob
        : new Blob([await sourceBlob.arrayBuffer()], { type: normalizedContentType }),
      contentType: normalizedContentType,
      didFinalizeOnDevice: false,
    };
  }

  if (backgroundMediaType === 'video') {
    return finalizeVideoBackground(
      sourceBlob,
      backgroundSource,
      backgroundDesignHeightPx,
      dominantColorHex,
      includeSticker ? stickerImage ?? null : null,
      includeSticker ? stickerHolder ?? null : null,
      includeStrip,
      onStatus,
    );
  }

  return finalizeImageBackground(
    backgroundSource,
    backgroundDesignHeightPx,
    dominantColorHex,
    includeSticker ? stickerImage ?? null : null,
    includeSticker ? stickerHolder ?? null : null,
    includeStrip,
    onStatus,
  );
}
