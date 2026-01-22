import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

export type TextAlignment = 'left' | 'center' | 'right';

interface TextAlignmentSelectorProps {
  selectedAlignment: TextAlignment;
  onAlignmentChange: (alignment: TextAlignment) => void;
}

export function TextAlignmentSelector({ selectedAlignment, onAlignmentChange }: TextAlignmentSelectorProps) {
  const alignments: { value: TextAlignment; icon: typeof AlignLeft; label: string }[] = [
    { value: 'left', icon: AlignLeft, label: 'Left' },
    { value: 'center', icon: AlignCenter, label: 'Center' },
    { value: 'right', icon: AlignRight, label: 'Right' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <h3 className="font-bold text-gray-900">Text Alignment</h3>
      </div>
      <p className="text-xs text-gray-500">Align text within the box</p>
      
      <div className="grid grid-cols-3 gap-2">
        {alignments.map((alignment) => {
          const Icon = alignment.icon;
          return (
            <button
              key={alignment.value}
              onClick={() => onAlignmentChange(alignment.value)}
              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                selectedAlignment === alignment.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
            >
              <Icon 
                className={`w-5 h-5 ${
                  selectedAlignment === alignment.value ? 'text-blue-500' : 'text-gray-600'
                }`} 
              />
              <span className="text-xs font-semibold text-gray-900">{alignment.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
