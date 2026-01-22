import { useState, useEffect } from 'react';
import { DraggablePlaceholder } from './DraggablePlaceholder';
import type { ImageStrokeStyle } from './ImageStrokeSelector';

interface PlaceholderPosition {
  x: number;
  y: number;
}

interface NamePlaceholder extends PlaceholderPosition {
  width: number;
  height: number;
}

interface ImagePlaceholder extends PlaceholderPosition {
  diameter: number;
}

interface DesignCanvasProps {
  backgroundImage: string | null;
  imageHolder: ImagePlaceholder;
  nameHolder: NamePlaceholder;
  onImageHolderChange: (pos: ImagePlaceholder) => void;
  onNameHolderChange: (pos: NamePlaceholder) => void;
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: string;
  imageStrokeStyle: ImageStrokeStyle;
  userName?: string;
}

const MAX_CANVAS_HEIGHT = 600;

export function DesignCanvas({
  backgroundImage,
  imageHolder,
  nameHolder,
  onImageHolderChange,
  onNameHolderChange,
  canvasWidth,
  canvasHeight,
  aspectRatio,
  imageStrokeStyle,
  userName = 'User Name'
}: DesignCanvasProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      const heightScale = MAX_CANVAS_HEIGHT / canvasHeight;
      const widthScale = (window.innerWidth * 0.5) / canvasWidth;
      setScale(Math.min(heightScale, widthScale));
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [canvasWidth, canvasHeight]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-semibold text-blue-900">
          {canvasWidth} × {canvasHeight}px <span className="text-blue-600 font-normal">({aspectRatio} portrait)</span>
        </p>
      </div>
      
      <div
        className="relative bg-gradient-to-br from-gray-200 to-gray-300 border-4 border-gray-400 overflow-hidden shadow-2xl rounded-lg"
        style={{
          width: canvasWidth * scale,
          height: canvasHeight * scale,
        }}
      >
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {!backgroundImage && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm px-4 text-center">
            <div>
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-medium">Upload a background image</p>
              <p className="text-xs text-gray-400 mt-1">to begin designing your template</p>
            </div>
          </div>
        )}

        {/* Always show placeholders so they're visible and movable at all times */}
        <DraggablePlaceholder
          type="circle"
          x={imageHolder.x}
          y={imageHolder.y}
          height={imageHolder.diameter}
          canvasScale={scale}
          label="User Photo"
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onDrag={(x, y) => onImageHolderChange({ ...imageHolder, x, y })}
          strokeStyle={imageStrokeStyle}
        />

        <DraggablePlaceholder
          type="rectangle"
          x={nameHolder.x}
          y={nameHolder.y}
          width={nameHolder.width}
          height={nameHolder.height}
          canvasScale={scale}
          label={userName}
          minWidth={200}
          maxWidth={800}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onDrag={(x, y) => onNameHolderChange({ ...nameHolder, x, y })}
          onResize={(width) => onNameHolderChange({ ...nameHolder, width })}
        />
      </div>
    </div>
  );
}