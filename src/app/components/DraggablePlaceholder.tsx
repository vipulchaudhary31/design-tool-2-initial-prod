import { motion } from 'motion/react';
import { GripVertical } from 'lucide-react';
import { useRef, useState } from 'react';
import { renderImageStroke, type ImageStrokeStyle } from './ImageStrokeSelector';

interface DraggablePlaceholderProps {
  type: 'circle' | 'rectangle';
  x: number;
  y: number;
  width?: number;
  height: number;
  canvasScale: number;
  onDrag: (x: number, y: number) => void;
  onResize?: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  label: string;
  canvasWidth: number;
  canvasHeight: number;
  strokeStyle?: ImageStrokeStyle;
}

export function DraggablePlaceholder({
  type,
  x,
  y,
  width,
  height,
  canvasScale,
  onDrag,
  onResize,
  minWidth = 200,
  maxWidth = 800,
  label,
  canvasWidth,
  canvasHeight,
  strokeStyle
}: DraggablePlaceholderProps) {
  // Prevent division by zero errors
  const safeScale = canvasScale || 1;
  
  const scaledX = x * safeScale;
  const scaledY = y * safeScale;
  const scaledWidth = (width || height) * safeScale;
  const scaledHeight = height * safeScale;

  // Track temporary drag position
  const [isDragging, setIsDragging] = useState(false);
  const [tempOffset, setTempOffset] = useState({ x: 0, y: 0 });

  // Calculate drag constraints in scaled (screen) coordinates
  const dragConstraints = {
    left: -scaledX,
    right: (canvasWidth * safeScale) - scaledX - (type === 'circle' ? scaledHeight : scaledWidth),
    top: -scaledY,
    bottom: (canvasHeight * safeScale) - scaledY - scaledHeight
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setTempOffset({ x: 0, y: 0 });
  };

  const handleDrag = (_: any, info: any) => {
    setTempOffset({ x: info.offset.x, y: info.offset.y });
  };

  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false);
    setTempOffset({ x: 0, y: 0 });
    
    // info.offset is the cumulative offset from drag start in screen pixels
    // Convert screen pixels to canvas coordinates
    const deltaX = info.offset.x / safeScale;
    const deltaY = info.offset.y / safeScale;
    
    const newX = Math.max(0, Math.min(canvasWidth - (width || height), x + deltaX));
    const newY = Math.max(0, Math.min(canvasHeight - height, y + deltaY));
    
    onDrag(newX, newY);
  };

  // Store resize start width
  const resizeStartWidth = useRef(0);

  const handleResizeStart = () => {
    resizeStartWidth.current = width || 400;
  };

  const handleResizeDragEnd = (_: any, info: any) => {
    const newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, resizeStartWidth.current + info.offset.x / safeScale)
    );
    if (onResize) {
      onResize(newWidth);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragConstraints}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        position: 'absolute',
        left: scaledX,
        top: scaledY,
        width: type === 'circle' ? scaledHeight : scaledWidth,
        height: scaledHeight,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      className="group"
      animate={isDragging ? {} : { x: 0, y: 0 }}
      transition={{ type: 'tween', duration: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      {type === 'circle' ? (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
            isDragging 
              ? 'shadow-2xl scale-105' 
              : 'shadow-lg'
          }`}
          style={{
            border: strokeStyle && strokeStyle !== 'none' ? 'none' : '2px dashed white',
            backgroundColor: isDragging ? 'rgba(245, 158, 11, 0.6)' : 'rgba(255, 255, 255, 0.3)',
            ...((strokeStyle && strokeStyle !== 'none') ? renderImageStroke(strokeStyle, height, false) : {}),
          }}
        >
          <div className={`text-white text-xs font-bold px-2 py-1 rounded text-center backdrop-blur-sm ${
            isDragging ? 'bg-black/30' : 'bg-black/20'
          }`}>
            {label}
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <div
            className={`w-full h-full border-2 border-dashed border-white flex items-center justify-center rounded-lg transition-all ${
              isDragging 
                ? 'bg-amber-500/60 shadow-2xl ring-4 ring-amber-300 scale-105' 
                : 'bg-white/30 shadow-lg hover:bg-amber-400/40 hover:ring-2 hover:ring-amber-300'
            }`}
          >
            <div className={`text-white text-xs font-bold px-2 py-1 rounded text-center backdrop-blur-sm ${
              isDragging ? 'bg-black/30' : 'bg-black/20'
            }`}>
              {label}
            </div>
          </div>
          
          {onResize && (
            <motion.div
              drag="x"
              dragMomentum={false}
              dragElastic={0}
              onDragStart={handleResizeStart}
              onDragEnd={handleResizeDragEnd}
              animate={{ x: 0 }}
              transition={{ type: 'tween', duration: 0 }}
              className="absolute right-0 top-0 h-full w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ 
                right: Math.min(-8, -8 / safeScale),
                width: Math.max(16, 16 / safeScale)
              }}
            >
              <div className="w-1.5 h-12 bg-amber-400 rounded-full shadow-lg ring-2 ring-white" />
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}