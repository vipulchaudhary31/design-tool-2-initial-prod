import { renderTextBackground } from "@/app/components/TextBackgroundSelector";
import type { TextBackgroundStyle } from "@/app/components/TextBackgroundSelector";
import { renderImageStroke } from "@/app/components/ImageStrokeSelector";
import type { ImageStrokeStyle } from "@/app/components/ImageStrokeSelector";
import type { TextAlignment } from "@/app/components/TextAlignmentSelector";

interface ImagePlaceholder {
  x: number;
  y: number;
  diameter: number;
}

interface NamePlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PreviewPanelProps {
  backgroundImage: string | null;
  imageHolder: ImagePlaceholder;
  nameHolder: NamePlaceholder;
  samplePhoto: string;
  sampleName: string;
  canvasWidth: number;
  canvasHeight: number;
  textBackgroundStyle: TextBackgroundStyle;
  imageStrokeStyle: ImageStrokeStyle;
  textAlignment: TextAlignment;
}

const PREVIEW_WIDTH = 270; // 1/4 of original width for preview

export function PreviewPanel({
  backgroundImage,
  imageHolder,
  nameHolder,
  samplePhoto,
  sampleName,
  canvasWidth,
  canvasHeight,
  textBackgroundStyle,
  imageStrokeStyle,
  textAlignment,
}: PreviewPanelProps) {
  const scale = PREVIEW_WIDTH / canvasWidth;

  if (!backgroundImage) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-5 h-5 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <h3 className="font-bold text-gray-900">
            Live Preview
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          See how users will view this template
        </p>
        <div
          className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-sm"
          style={{
            width: PREVIEW_WIDTH,
            height: canvasHeight * scale,
          }}
        >
          <div className="text-center px-4">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">No preview available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <h3 className="font-bold text-gray-900">
          Live Preview
        </h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        How users will see this template
      </p>

      <div
        className="relative"
        style={{ width: PREVIEW_WIDTH }}
      >
        <div
          className="relative bg-gray-900 overflow-hidden rounded-xl shadow-xl border-2 border-gray-300"
          style={{
            width: PREVIEW_WIDTH,
            height: canvasHeight * scale,
          }}
        >
          {/* Background Image */}
          <img
            src={backgroundImage}
            alt="Preview Background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* User Photo Placeholder */}
          <div
            className="absolute rounded-full overflow-hidden"
            style={{
              left: imageHolder.x * scale,
              top: imageHolder.y * scale,
              width: imageHolder.diameter * scale,
              height: imageHolder.diameter * scale,
              ...renderImageStroke(
                imageStrokeStyle,
                imageHolder.diameter * scale,
                true,
              ),
            }}
          >
            <img
              src={samplePhoto}
              alt="Sample User"
              className="w-full h-full object-cover"
            />
          </div>

          {/* User Name Placeholder */}
          <div
            className="absolute overflow-visible"
            style={{
              left: nameHolder.x * scale,
              top: nameHolder.y * scale,
              width: nameHolder.width * scale,
              height: nameHolder.height * scale,
            }}
          >
            {/* Text Background */}
            <div className="relative w-full h-full overflow-visible">
              {renderTextBackground(
                textBackgroundStyle,
                nameHolder.width * scale,
                nameHolder.height * scale,
                true,
              )}

              {/* Text Content */}
              <div
                className="relative w-full h-full flex items-center px-2"
                style={{
                  justifyContent:
                    textAlignment === "left"
                      ? "flex-start"
                      : textAlignment === "right"
                        ? "flex-end"
                        : "center",
                }}
              >
                <span
                  className="text-white relative z-10"
                  style={{
                    fontFamily: "'Noto Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 16,
                    textShadow:
                      textBackgroundStyle === "none"
                        ? "0 2px 4px rgba(0,0,0,0.5)"
                        : "none",
                    textAlign: textAlignment,
                  }}
                >
                  {sampleName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}