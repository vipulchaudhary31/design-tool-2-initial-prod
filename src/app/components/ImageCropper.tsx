import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';

interface ImageCropperProps {
  rawImage: string;
  aspectRatio: number;
  onCropComplete: (croppedImageUrl: string) => void;
  onClose: () => void;
}

export function ImageCropper({ rawImage, aspectRatio, onCropComplete, onClose }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    
    try {
      const img = new Image();
      img.src = rawImage;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas size to the cropped area size
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the cropped image
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert canvas to blob and then to data URL
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsProcessing(false);
          return;
        }
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onCropComplete(base64data);
          setIsProcessing(false);
        };
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Crop Image</h2>
          <p className="text-sm text-gray-600">
            Adjust the image to fit your selected aspect ratio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={createCroppedImage}
            className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 border-2 border-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Apply Crop'}
          </button>
        </div>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative">
        <Cropper
          image={rawImage}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteCallback}
          onZoomChange={onZoomChange}
        />
      </div>

      {/* Zoom Control */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
}