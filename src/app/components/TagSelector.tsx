import { X } from 'lucide-react';

interface TagSelectorProps {
  title: string;
  description: string;
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  required?: boolean;
}

export function TagSelector({ 
  title,
  description,
  availableTags,
  selectedTags, 
  onTagsChange,
  required = false
}: TagSelectorProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-gray-900 mb-1 block uppercase tracking-wide">
          {title} {required && selectedTags.length === 0 && <span className="text-red-500">*</span>}
        </label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-all duration-150 ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md hover:bg-amber-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              {tag}
              {isSelected && <X className="h-3 w-3" />}
            </button>
          );
        })}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <div className="flex-shrink-0 w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-amber-700 font-bold text-[10px]">{selectedTags.length}</span>
          </div>
          <span className="text-gray-600 font-medium">
            {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}
    </div>
  );
}