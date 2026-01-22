export type ImageStrokeStyle = 
  | 'none'
  | 'simple'
  | 'double'
  | 'gradient'
  | 'glow'
  | 'thick'
  | 'ring';

interface ImageStrokeSelectorProps {
  selectedStyle: ImageStrokeStyle;
  onStyleChange: (style: ImageStrokeStyle) => void;
}

const strokeStyles: { value: ImageStrokeStyle; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'No border' },
  { value: 'simple', label: 'Simple', description: 'Clean white border' },
  { value: 'double', label: 'Double', description: 'Double ring effect' },
  { value: 'gradient', label: 'Gradient', description: 'Gradient border' },
  { value: 'glow', label: 'Glow', description: 'Soft glow effect' },
  { value: 'thick', label: 'Thick', description: 'Bold border' },
  { value: 'ring', label: 'Ring', description: 'Offset ring' },
];

export function ImageStrokeSelector({ selectedStyle, onStyleChange }: ImageStrokeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="font-bold text-gray-900">Photo Border Style</h3>
      </div>
      <p className="text-xs text-gray-500">Choose border style for user photo</p>
      
      <div className="grid grid-cols-2 gap-2">
        {strokeStyles.map((style) => (
          <button
            key={style.value}
            onClick={() => onStyleChange(style.value)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedStyle === style.value
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">{style.label}</span>
              {selectedStyle === style.value && (
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-500">{style.description}</p>
            
            {/* Preview Circle */}
            <div className="mt-2 flex justify-center">
              {renderStrokePreview(style.value)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function renderStrokePreview(style: ImageStrokeStyle) {
  const baseClasses = "w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400";
  
  switch (style) {
    case 'none':
      return <div className={baseClasses} />;
    
    case 'simple':
      return <div className={`${baseClasses} border-3 border-white`} />;
    
    case 'double':
      return (
        <div className="relative">
          <div className={`${baseClasses} border-2 border-white ring-2 ring-purple-400`} />
        </div>
      );
    
    case 'gradient':
      return (
        <div className="relative">
          <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 p-[3px]">
            <div className={baseClasses} />
          </div>
        </div>
      );
    
    case 'glow':
      return <div className={`${baseClasses} border-2 border-white shadow-lg shadow-purple-400/50`} />;
    
    case 'thick':
      return <div className={`${baseClasses} border-[6px] border-white`} />;
    
    case 'ring':
      return (
        <div className="relative">
          <div className={`${baseClasses} border-3 border-white`} />
          <div className="absolute inset-0 rounded-full border-2 border-purple-400 scale-110" />
        </div>
      );
    
    default:
      return <div className={baseClasses} />;
  }
}

// Helper function to apply stroke style to actual image elements
export function renderImageStroke(
  style: ImageStrokeStyle,
  diameter: number,
  isPreview: boolean = false
) {
  const scale = isPreview ? 1 : 1;
  const borderWidth = isPreview ? 3 : 8;
  const thickBorderWidth = isPreview ? 6 : 16;
  
  switch (style) {
    case 'none':
      return {};
    
    case 'simple':
      return {
        border: `${borderWidth}px solid white`,
      };
    
    case 'double':
      return {
        border: `${borderWidth - 1}px solid white`,
        boxShadow: `0 0 0 ${borderWidth}px rgba(168, 85, 247, 0.4)`,
      };
    
    case 'gradient':
      return {
        border: `${borderWidth}px solid transparent`,
        backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #a855f7, #ec4899, #f59e0b)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      };
    
    case 'glow':
      return {
        border: `${borderWidth - 1}px solid white`,
        boxShadow: `0 0 ${isPreview ? 16 : 32}px rgba(168, 85, 247, 0.6)`,
      };
    
    case 'thick':
      return {
        border: `${thickBorderWidth}px solid white`,
      };
    
    case 'ring':
      return {
        border: `${borderWidth}px solid white`,
        boxShadow: `0 0 0 ${isPreview ? 8 : 16}px rgba(168, 85, 247, 0.4)`,
      };
    
    default:
      return {};
  }
}