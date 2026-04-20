import { useRef } from 'react';
import { Upload, ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { isRasterBackgroundFile } from '@/utils/isRasterBackgroundFile';

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  hasImage: boolean;
}

export function ImageUploader({ onImageUpload, hasImage }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isRasterBackgroundFile(file)) {
      toast.error('Unsupported file format', {
        description: 'Only JPEG, PNG, or WebP images are allowed.',
      });
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`File too large (${formatFileSize(file.size)})`, {
        description: 'Image files must be under 15 MB.',
      });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => onImageUpload(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.jfif,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

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
            <p className="text-xs text-muted-foreground mt-0.5">JPEG, PNG, or WebP</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 p-2.5 rounded-md bg-secondary/60">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-chart-2/15 text-chart-2">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground/80">Image loaded</p>
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
