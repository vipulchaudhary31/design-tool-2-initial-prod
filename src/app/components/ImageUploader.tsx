import { useRef } from 'react';
import { Upload, Image } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  hasImage: boolean;
}

export function ImageUploader({ onImageUpload, hasImage }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onImageUpload(base64String);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {!hasImage && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="group relative p-8 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all duration-200"
        >
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="h-7 w-7 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Upload Background</p>
            <p className="text-xs text-gray-500">
              Any size accepted - you'll crop it next
            </p>
          </div>
        </div>
      )}
      
      {hasImage && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Image className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">Image Loaded</p>
              <p className="text-xs text-green-700">Ready to design</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-green-300 hover:bg-green-100 hover:border-green-400"
          >
            Replace
          </Button>
        </div>
      )}
    </div>
  );
}