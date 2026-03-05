import { X } from 'lucide-react';
import { Label } from '@/app/components/ui/label';

interface TagSelectorProps {
  title: string;
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  required?: boolean;
}

export function TagSelector({
  title,
  availableTags,
  selectedTags,
  onTagsChange,
  required = false,
}: TagSelectorProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          {title}
          {required && selectedTags.length === 0 && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {selectedTags.length > 0 && (
          <span className="text-[10px] text-primary">{selectedTags.length} selected</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {availableTags.map(tag => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                isSelected
                  ? 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/20'
                  : 'bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {tag}
              {isSelected && <X className="h-2.5 w-2.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
