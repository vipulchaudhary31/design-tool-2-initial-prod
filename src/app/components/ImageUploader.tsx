import { useRef } from 'react';
import { Upload, ImageIcon, RefreshCw, Trash2, Film } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import {
  isRasterBackgroundFile,
  isVideoBackgroundFile,
  MAX_BACKGROUND_IMAGE_BYTES,
  MAX_BACKGROUND_VIDEO_BYTES,
} from '@/utils/isRasterBackgroundFile';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string, fileMeta?: { name?: string; mediaType?: 'image' | 'video' }) => void;
  hasImage: boolean;
  mediaType?: 'image' | 'video';
  onRemove?: () => void;
}

export function ImageUploader({ onImageUpload, hasImage, mediaType = 'image', onRemove }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processChosenFile = (file: File, inputEl: HTMLInputElement) => {
    const isImage = isRasterBackgroundFile(file);
    const isVideo = isVideoBackgroundFile(file);

    if (!isImage && !isVideo) {
      toast.error('Unsupported file format', {
        description: 'Accepted: JPG, JPEG, PNG, or MP4.',
      });
      inputEl.value = '';
      return;
    }
    const maxFileSize = isVideo ? MAX_BACKGROUND_VIDEO_BYTES : MAX_BACKGROUND_IMAGE_BYTES;
    if (file.size > maxFileSize) {
      toast.error(`File too large (${formatFileSize(file.size)})`, {
        description: isVideo ? 'Videos must be under 100 MB.' : 'Images must be under 5 MB.',
      });
      inputEl.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageUpload(reader.result as string, {
        name: file.name,
        mediaType: isVideo ? 'video' : 'image',
      });
    };
    reader.readAsDataURL(file);
    inputEl.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processChosenFile(file, e.target);
  };

  const openPick = () => fileInputRef.current?.click();

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.mp4,image/jpeg,image/png,video/mp4"
        onChange={handleFileChange}
        className="hidden"
      />

      {!hasImage ? (
        <button
          type="button"
          onClick={openPick}
          className="w-full group flex flex-col items-center gap-2.5 py-6 border border-dashed border-border rounded-md cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground/80">Upload Design</p>
            <p className="text-xs text-muted-foreground mt-0.5">Image max 5 MB · Video max 100 MB</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <label className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-secondary/40 px-3 text-xs text-foreground transition-colors hover:bg-secondary">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.mp4,image/jpeg,image/png,video/mp4"
              onChange={handleFileChange}
              className="hidden"
            />
            {mediaType === 'video' ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
            <RefreshCw className="h-3.5 w-3.5" />
            Replace design
          </label>
          {onRemove ? (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              type="button"
              aria-label="Remove design"
              onClick={onRemove}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
