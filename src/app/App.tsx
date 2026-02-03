import { useState, useEffect } from 'react';
import { ImageUploader } from '@/app/components/ImageUploader';
import { ImageCropper } from '@/app/components/ImageCropper';
import { DesignCanvas } from '@/app/components/DesignCanvas';
import { TagSelector } from '@/app/components/TagSelector';
import { CategorySelector } from '@/app/components/CategorySelector';
import {
  TextBackgroundSelector,
  type TextBackgroundStyle,
} from '@/app/components/TextBackgroundSelector';
import {
  ImageStrokeSelector,
  type ImageStrokeStyle,
} from '@/app/components/ImageStrokeSelector';
import {
  TextAlignmentSelector,
  type TextAlignment,
} from '@/app/components/TextAlignmentSelector';
import { PreviewPanel } from '@/app/components/PreviewPanel';
import { ExportPanel } from '@/app/components/ExportPanel';
import { Toaster } from '@/app/components/ui/sonner';
import { toast } from 'sonner';

import Login from '@/app/Login';
import lokalLogo from '@/assets/7f52afd4f9acd98b14c7800f5a0a27def664508d.png';

interface ImagePlaceholder {
  x: number;
  y: number;
  diameter: number;
}

interface NamePlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
}

type AspectRatio = '3:4' | '9:16';

const CANVAS_WIDTH = 1080;

const getCanvasHeight = (aspectRatio: AspectRatio) =>
  aspectRatio === '3:4' ? 1440 : 1920;

const LANGUAGE_TAGS = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Bengali',
  'Gujarati',
  'Punjabi',
];

const SAMPLE_PHOTO =
  'https://images.unsplash.com/photo-1724435811349-32d27f4d5806?auto=format&w=1080';

export default function App() {
  /* ================= AUTH ================= */
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* ================= DESIGN STATE ================= */
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [secondaryCategory, setSecondaryCategory] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [textBackgroundStyle, setTextBackgroundStyle] =
    useState<TextBackgroundStyle>('none');
  const [imageStrokeStyle, setImageStrokeStyle] =
    useState<ImageStrokeStyle>('none');
  const [textAlignment, setTextAlignment] =
    useState<TextAlignment>('center');
  const [userName, setUserName] = useState('Rahul');
  const [rawImage, setRawImage] = useState<string | null>(null);

  const canvasHeight = getCanvasHeight(aspectRatio);
  const cropAspectRatio = aspectRatio === '3:4' ? 3 / 4 : 9 / 16;

  const [imageHolder, setImageHolder] = useState<ImagePlaceholder>({
    x: (CANVAS_WIDTH - 300) / 2,
    y: 200,
    diameter: 300,
  });

  const [nameHolder, setNameHolder] = useState<NamePlaceholder>({
    x: (CANVAS_WIDTH - 600) / 2,
    y: 550,
    width: 600,
    height: 100,
  });

  useEffect(() => {
    setImageHolder((p) => ({
      ...p,
      y: Math.min(p.y, canvasHeight - p.diameter),
    }));
    setNameHolder((p) => ({
      ...p,
      y: Math.min(p.y, canvasHeight - p.height),
    }));
  }, [aspectRatio, canvasHeight]);

  const handleExport = () => {
    const payload = {
      aspectRatio,
      primaryCategory,
      secondaryCategory,
      languages: selectedLanguages,
      backgroundImage,
      imagePlaceholder: {
        x: (imageHolder.x / CANVAS_WIDTH) * 100,
        y: (imageHolder.y / canvasHeight) * 100,
        diameter: (imageHolder.diameter / CANVAS_WIDTH) * 100,
      },
      namePlaceholder: {
        x: (nameHolder.x / CANVAS_WIDTH) * 100,
        y: (nameHolder.y / canvasHeight) * 100,
        width: (nameHolder.width / CANVAS_WIDTH) * 100,
        height: (nameHolder.height / canvasHeight) * 100,
      },
      textBackgroundStyle,
      imageStrokeStyle,
      textAlignment,
    };


    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${Date.now()}.json`
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Template exported successfully!');
  };

  /* ================= LOGIN GATE ================= */
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b shadow sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex justify-between">
          <div className="flex gap-4 items-center">
            <img src={lokalLogo} className="h-10 w-10" />
            <h1 className="text-xl font-bold">Template Studio</h1>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="text-sm font-semibold text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto p-6 grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-3 space-y-4">
          <ImageUploader
            onImageUpload={setRawImage}
            hasImage={!!rawImage}
          />

          {rawImage && (
            <ImageCropper
              rawImage={rawImage}
              aspectRatio={cropAspectRatio}
              onCropComplete={(img) => {
                setBackgroundImage(img);
                setRawImage(null);
              }}
              onClose={() => setRawImage(null)}
            />
          )}

          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="User name"
          />

          <CategorySelector
            primaryCategory={primaryCategory}
            secondaryCategory={secondaryCategory}
            onPrimaryCategoryChange={setPrimaryCategory}
            onSecondaryCategoryChange={setSecondaryCategory}
          />

          <TagSelector
              title="Languages"
              availableTags={LANGUAGE_TAGS}
              selectedTags={selectedLanguages}
              onTagsChange={setSelectedLanguages}
              required description={""}          />

          <ExportPanel
            backgroundImage={backgroundImage}
            imageHolder={imageHolder}
            nameHolder={nameHolder}
            primaryCategory={primaryCategory}
            secondaryCategory={secondaryCategory}
            selectedLanguages={selectedLanguages}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={canvasHeight}
            onExport={handleExport}
          />
        </div>

        {/* CENTER */}
        <div className="col-span-6">
          <DesignCanvas
            backgroundImage={backgroundImage}
            imageHolder={imageHolder}
            nameHolder={nameHolder}
            onImageHolderChange={setImageHolder}
            onNameHolderChange={setNameHolder}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={canvasHeight}
            aspectRatio={aspectRatio}
            imageStrokeStyle={imageStrokeStyle}
            userName={userName}
          />
        </div>

        {/* RIGHT */}
        <div className="col-span-3 space-y-4">
          <PreviewPanel
            backgroundImage={backgroundImage}
            imageHolder={imageHolder}
            nameHolder={nameHolder}
            samplePhoto={SAMPLE_PHOTO}
            sampleName={userName}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={canvasHeight}
            textBackgroundStyle={textBackgroundStyle}
            imageStrokeStyle={imageStrokeStyle}
            textAlignment={textAlignment}
          />

          <TextBackgroundSelector
            selectedStyle={textBackgroundStyle}
            onStyleChange={setTextBackgroundStyle}
          />
          <ImageStrokeSelector
            selectedStyle={imageStrokeStyle}
            onStyleChange={setImageStrokeStyle}
          />
          <TextAlignmentSelector
            selectedAlignment={textAlignment}
            onAlignmentChange={setTextAlignment}
          />
        </div>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}
