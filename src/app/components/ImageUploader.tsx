import { useRef } from 'react';
import { Upload, ImageIcon, Film, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { isRasterBackgroundFile, isVideoBackgroundFile } from '@/utils/isRasterBackgroundFile';

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string, fileMeta?: { name?: string; mediaType?: 'image' | 'video' }) => void;
  hasImage: boolean;
  mediaType?: 'image' | 'video';
}

export function ImageUploader({ onImageUpload, hasImage, mediaType = 'image' }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processChosenFile = (file: File, inputEl: HTMLInputElement) => {
    const isImage = isRasterBackgroundFile(file);
    const isVideo = isVideoBackgroundFile(file);

    if (!isImage && !isVideo) {
      toast.error('Unsupported file format', {
        description: 'Only JPEG, PNG, WebP images or MP4 videos are allowed.',
      });
      inputEl.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large (${formatFileSize(file.size)})`, {
        description: 'Files must be under 15 MB.',
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
        accept=".jpg,.jpeg,.jfif,.png,.webp,.mp4,image/jpeg,image/png,image/webp,video/mp4"
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
            <p className="text-sm text-foreground/80">Upload Background</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPEG, PNG, WebP or MP4 · max 15 MB</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 p-2.5 rounded-md bg-secondary/45">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-primary/[0.055] text-primary/75">
            {mediaType === 'video' ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground/80">{mediaType === 'video' ? 'Video loaded' : 'Image loaded'}</p>
            <p className="text-[11px] text-muted-foreground">Ready to design</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            type="button"
            title="Change background"
            onClick={openPick}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
