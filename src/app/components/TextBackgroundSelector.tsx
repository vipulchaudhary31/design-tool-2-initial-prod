import { Palette } from 'lucide-react';

export type TextBackgroundStyle = 
  | 'none'
  | 'solid'
  | 'gradient'
  | 'ribbon'
  | 'badge'
  | 'outline'
  | 'blur'
  | 'shadow';

interface StyleOption {
  id: TextBackgroundStyle;
  label: string;
  preview: React.ReactNode;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'none',
    label: 'None',
    preview: (
      <div className="h-8 flex items-center justify-center text-[10px] font-semibold text-gray-400">
        No BG
      </div>
    ),
  },
  {
    id: 'solid',
    label: 'Solid',
    preview: (
      <div className="h-8 flex items-center justify-center">
        <div className="w-full h-5 bg-black/70 rounded flex items-center justify-center">
          <span className="text-[9px] font-semibold text-white">Text</span>
        </div>
      </div>
    ),
  },
  {
    id: 'gradient',
    label: 'Gradient',
    preview: (
      <div className="h-8 flex items-center justify-center">
        <div className="w-full h-5 bg-gradient-to-r from-black/70 via-black/50 to-black/70 rounded flex items-center justify-center">
          <span className="text-[9px] font-semibold text-white">Text</span>
        </div>
      </div>
    ),
  },
  {
    id: 'ribbon',
    label: 'Ribbon',
    preview: (
      <div className="h-8 flex items-center justify-center">
        <div className="relative w-full h-5 bg-amber-500 flex items-center justify-center">
          <div className="absolute -left-1 top-0 w-0 h-0 border-t-[10px] border-t-transparent border-r-[8px] border-r-amber-700 border-b-[10px] border-b-transparent" />
          <div className="absolute -right-1 top-0 w-0 h-0 border-t-[10px] border-t-transparent border-l-[8px] border-l-amber-700 border-b-[10px] border-b-transparent" />
          <span className="text-[9px] font-bold text-white">Text</span>
        </div>
      </div>
    ),
  },
  {
    id: 'badge',
    label: 'Badge',
    preview: (
      <div className="h-8 flex items-center justify-center">
        <div className="px-3 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          <span className="text-[9px] font-bold text-white">Text</span>
        </div>
      </div>
    ),
  },
  {
    id: 'outline',
    label: 'Outline',
    preview: (
      <div className="h-8 flex items-center justify-center">
        <div className="w-full h-5 border-2 border-white rounded flex items-center justify-center bg-black/20">
          <span className="text-[9px] font-bold text-white">Text</span>
        </div>
      </div>
    ),
  },
  {
    id: 'blur',
    label: 'Blur',
    preview: (
      <div className="h-8 flex items-center justify-center">
        <div className="relative w-full h-5 flex items-center justify-center overflow-hidden rounded">
          <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
          <span className="relative text-[9px] font-bold text-white">Text</span>
        </div>
      </div>
    ),
  },
  {
    id: 'shadow',
    label: 'Shadow',
    preview: (
      <div className="h-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-black/50 blur-md rounded" />
          <span className="relative text-[9px] font-bold text-white">Text</span>
        </div>
      </div>
    ),
  },
];

interface TextBackgroundSelectorProps {
  selectedStyle: TextBackgroundStyle;
  onStyleChange: (style: TextBackgroundStyle) => void;
}

export function TextBackgroundSelector({
  selectedStyle,
  onStyleChange,
}: TextBackgroundSelectorProps) {
  return (
    <div>
      <div className="flex items-start gap-2 mb-3">
        <Palette className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-xs font-bold text-gray-900">Text Background Style</h3>
          <p className="text-xs text-gray-500 mt-0.5">Choose a decorative container for the name</p>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {STYLE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onStyleChange(option.id)}
            className={`p-2 border-2 rounded-lg transition-all duration-200 ${
              selectedStyle === option.id
                ? 'bg-amber-50 border-amber-500 shadow-sm'
                : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
          >
            <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded mb-1.5 p-1">
              {option.preview}
            </div>
            <div className={`text-[10px] font-semibold text-center ${
              selectedStyle === option.id ? 'text-amber-900' : 'text-gray-700'
            }`}>
              {option.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Helper function to render the background style
export const renderTextBackground = (
  style: TextBackgroundStyle,
  width: number,
  height: number,
  isPreview: boolean = false
) => {
  switch (style) {
    case 'none':
      return null;
      
    case 'solid':
      return (
        <div
          className="absolute inset-0 bg-black/70 rounded-lg"
          style={{ width, height }}
        />
      );
      
    case 'gradient':
      return (
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70 rounded-lg"
          style={{ width, height }}
        />
      );
      
    case 'ribbon':
      return (
        <div className="absolute inset-0" style={{ width, height }}>
          <div className="relative w-full h-full bg-amber-500">
            <div 
              className="absolute top-0 border-t-transparent border-r-amber-700 border-b-transparent"
              style={{ 
                left: '-8px',
                borderTopWidth: height / 2,
                borderRightWidth: '16px',
                borderBottomWidth: height / 2,
              }}
            />
            <div 
              className="absolute top-0 border-t-transparent border-l-amber-700 border-b-transparent"
              style={{ 
                right: '-8px',
                borderTopWidth: height / 2,
                borderLeftWidth: '16px',
                borderBottomWidth: height / 2,
              }}
            />
          </div>
        </div>
      );
      
    case 'badge':
      return (
        <div
          className="absolute bg-amber-500 border-4 border-white shadow-lg"
          style={{ 
            width, 
            height,
            borderRadius: height / 2,
            left: 0,
            top: 0,
          }}
        />
      );
      
    case 'outline':
      return (
        <div
          className="absolute border-4 border-white rounded-lg bg-black/20"
          style={{ width, height }}
        />
      );
      
    case 'blur':
      return (
        <div
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{ width, height }}
        >
          <div className="absolute inset-0 bg-white/20 backdrop-blur-md" />
        </div>
      );
      
    case 'shadow':
      return (
        <>
          <div
            className="absolute bg-black/50 blur-xl"
            style={{ 
              width: width * 0.9,
              height: height * 0.9,
              left: width * 0.05,
              top: height * 0.05,
              borderRadius: '8px',
            }}
          />
        </>
      );
      
    default:
      return null;
  }
};