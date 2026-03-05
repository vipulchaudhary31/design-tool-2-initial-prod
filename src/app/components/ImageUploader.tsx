import { useRef } from 'react';
import { Upload, ImageIcon, Video, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string, mediaType: 'image' | 'video') => void;
  hasImage: boolean;
  mediaType?: 'image' | 'video';
}

export function ImageUploader({ onImageUpload, hasImage, mediaType = 'image' }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    const maxLabel = isVideo ? '50 MB' : '15 MB';
    if (file.size > maxSize) {
      toast.error(`File too large (${formatFileSize(file.size)})`, {
        description: `${isVideo ? 'Video' : 'Image'} files must be under ${maxLabel}.`,
      });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => onImageUpload(reader.result as string, isVideo ? 'video' : 'image');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />

      {!hasImage ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full group flex flex-col items-center gap-2.5 py-6 border border-dashed border-border rounded-md cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground/80">Upload Background</p>
            <p className="text-xs text-muted-foreground mt-0.5">Images or videos</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 p-2.5 rounded-md bg-secondary/60">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
            mediaType === 'video' ? 'bg-chart-5/15 text-chart-5' : 'bg-chart-2/15 text-chart-2'
          }`}>
            {mediaType === 'video' ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground/80">{mediaType === 'video' ? 'Video' : 'Image'} loaded</p>
            <p className="text-[11px] text-muted-foreground">Ready to design</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
