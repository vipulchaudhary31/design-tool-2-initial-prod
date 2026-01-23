import { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, Wand2, Download, SkipForward } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  thumbnail: string;
}

interface ConceptGeneratorProps {
  onImageSelect: (imageUrl: string, concept: string) => void;
  onSkip: () => void;
}

type AspectRatio = '3:4' | '9:16';
type ImageStyle =
  | 'Realistic photography'
  | 'Cinematic realism'
  | 'Digital illustration'
  | 'Hand-painted art style'
  | 'Minimalist conceptual art'
  | 'Hyper-realistic'
  | 'Watercolor illustration'
  | 'Other';

export function ConceptGenerator({ onImageSelect, onSkip }: ConceptGeneratorProps) {
  const [concept, setConcept] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Configuration states
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('Realistic photography');
  const [customStyle, setCustomStyle] = useState('');
  const [useSystemPrompt, setUseSystemPrompt] = useState(true);
  const [imageCount, setImageCount] = useState(4);

  const handleGenerate = async () => {
    // Validation
    if (useSystemPrompt && !concept.trim()) {
      setError('Please enter a concept');
      return;
    }

    if (!useSystemPrompt && !customPrompt.trim()) {
      setError('Please enter a custom prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setSelectedImage(null);

    try {
      const finalStyle = imageStyle === 'Other' ? customStyle : imageStyle;

      // Call backend API to generate images
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useSystemPrompt,
          concept: useSystemPrompt ? concept : undefined,
          customPrompt: !useSystemPrompt ? customPrompt : undefined,
          imageStyle: finalStyle,
          aspectRatio,
          count: imageCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate images');
      }

      const data = await response.json();
      setGeneratedImages(data.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProceed = () => {
    if (selectedImage) {
      onImageSelect(selectedImage, useSystemPrompt ? concept : customPrompt);
    }
  };

  const handleDownload = async (imageUrl: string, imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template-bg-${imageId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(imageUrl, '_blank');
    }
  };

  const canGenerate = useSystemPrompt
    ? concept.trim().length > 0 && (imageStyle !== 'Other' || customStyle.trim().length > 0)
    : customPrompt.trim().length > 0;

  return (
    <div className="min-h-[calc(100vh-100px)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header - All in one row */}
        <div className="flex items-center justify-between mb-8 gap-4">
          {/* Left: Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex-shrink-0">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">AI-Powered Template Generator</span>
          </div>

          {/* Center: Title */}
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              What do you want to create?
            </h1>
          </div>

          {/* Right: Skip Button */}
          <Button
            onClick={onSkip}
            variant="outline"
            className="flex items-center gap-2 border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 flex-shrink-0"
          >
            <SkipForward className="w-4 h-4" />
            Go to image placement tool
          </Button>
        </div>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 text-center">
          Tell us the idea. We'll generate background options for you.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Concept Input */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Background Setup</h2>

              {/* Concept Input (System Prompt Mode) */}
              {useSystemPrompt ? (
                <>
                  <label htmlFor="concept" className="block text-sm font-bold text-gray-900 mb-3">
                    Describe the background
                  </label>
                  <textarea
                    id="concept"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="E.g., 'Diwali festival celebration with diyas and lights', 'Good morning with peaceful sunrise', 'Motivational quote about success'..."
                    className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={6}
                    disabled={isGenerating}
                  />
                </>
              ) : (
                <>
                  <label htmlFor="customPrompt" className="block text-sm font-bold text-gray-900 mb-3">
                    Custom Prompt (sent directly to AI)
                  </label>
                  <textarea
                    id="customPrompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter your complete custom prompt here. This will be sent directly to the AI model without any system prompt preprocessing..."
                    className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={9}
                    disabled={isGenerating}
                  />
                </>
              )}

              {/* Toggle and Number of Images in Same Row */}
              <div className="mt-4 flex items-center gap-4">
                {/* System Prompt Toggle */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex flex-col">
                    <label htmlFor="systemPromptToggle" className="text-xs font-bold text-gray-900 cursor-pointer">
                      Use smart defaults
                    </label>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Optimized backend prompt
                    </p>
                  </div>
                  <button
                    id="systemPromptToggle"
                    onClick={() => setUseSystemPrompt(!useSystemPrompt)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${useSystemPrompt ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useSystemPrompt ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Number of Images */}
                <div className="flex-1">
                  <label htmlFor="imageCount" className="block text-xs font-bold text-gray-900 mb-1.5">
                    Number of images
                  </label>
                  <select
                    id="imageCount"
                    value={imageCount}
                    onChange={(e) => setImageCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    disabled={isGenerating}
                  >
                    <option value={1}>1 image</option>
                    <option value={2}>2 images</option>
                    <option value={3}>3 images</option>
                    <option value={4}>4 images</option>
                    <option value={6}>6 images</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                  {error}
                </p>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerate}
                className={`w-full h-12 font-semibold text-sm transition-all duration-200 mt-6 ${isGenerating || !canGenerate
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-200 hover:shadow-xl'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating {imageCount} {imageCount === 1 ? 'Image' : 'Images'}...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate backgrounds
                  </>
                )}
              </Button>

              {/* Example Prompts (only in system prompt mode) */}
              {useSystemPrompt && !isGenerating && generatedImages.length === 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Quick ideas</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Diwali festival with diyas and rangoli',
                      'Good morning with coffee and sunrise',
                      'Birthday celebration with balloons',
                      'Motivational quote with mountain backdrop',
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setConcept(example)}
                        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-lg border border-gray-200 hover:border-purple-300 transition-all"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Layout & Style
              </h2>

              {/* Aspect Ratio - Box Selection */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAspectRatio('3:4')}
                    disabled={isGenerating || !useSystemPrompt}
                    className={`relative p-4 rounded-xl border-2 transition-all ${aspectRatio === '3:4'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                      } ${(isGenerating || !useSystemPrompt) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-16 rounded border-2 ${aspectRatio === '3:4' ? 'border-purple-500 bg-purple-100' : 'border-gray-300 bg-gray-50'
                        }`} />
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">3:4</div>
                        <div className="text-xs text-gray-600">1080×1440px</div>
                      </div>
                    </div>
                    {aspectRatio === '3:4' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setAspectRatio('9:16')}
                    disabled={isGenerating || !useSystemPrompt}
                    className={`relative p-4 rounded-xl border-2 transition-all ${aspectRatio === '9:16'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                      } ${(isGenerating || !useSystemPrompt) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-9 h-16 rounded border-2 ${aspectRatio === '9:16' ? 'border-purple-500 bg-purple-100' : 'border-gray-300 bg-gray-50'
                        }`} />
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">9:16</div>
                        <div className="text-xs text-gray-600">1080×1920px</div>
                      </div>
                    </div>
                    {aspectRatio === '9:16' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
                {!useSystemPrompt && (
                  <p className="text-xs text-amber-600 mt-2">Configure in custom prompt</p>
                )}
              </div>

              {/* Image Style */}
              <div className="mb-6">
                <label htmlFor="imageStyle" className="block text-sm font-bold text-gray-900 mb-2">
                  Background style
                </label>
                <select
                  id="imageStyle"
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  disabled={isGenerating || !useSystemPrompt}
                >
                  <option value="Realistic photography">Realistic photography</option>
                  <option value="Cinematic realism">Cinematic realism</option>
                  <option value="Digital illustration">Digital illustration</option>
                  <option value="Hand-painted art style">Hand-painted art style</option>
                  <option value="Minimalist conceptual art">Minimalist conceptual art</option>
                  <option value="Hyper-realistic">Hyper-realistic</option>
                  <option value="Watercolor illustration">Watercolor illustration</option>
                  <option value="Other">Other (custom)</option>
                </select>
                {!useSystemPrompt && (
                  <p className="text-xs text-amber-600 mt-1">Configure in custom prompt</p>
                )}
              </div>

              {/* Custom Style Input (when "Other" is selected) */}
              {imageStyle === 'Other' && useSystemPrompt && (
                <div className="mb-6">
                  <label htmlFor="customStyle" className="block text-sm font-bold text-gray-900 mb-2">
                    Custom Style
                  </label>
                  <input
                    id="customStyle"
                    type="text"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="E.g., Retro 80s neon art"
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isGenerating}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Generated Images Grid */}
        {generatedImages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Generated Images ({generatedImages.length})
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {generatedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <button
                    onClick={() => setSelectedImage(image.url)}
                    className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden border-4 transition-all transform hover:scale-105 ${selectedImage === image.url
                      ? 'border-purple-500 shadow-xl shadow-purple-200 ring-4 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300'
                      }`}
                  >
                    <img
                      src={image.url}
                      alt={`Generated ${image.id}`}
                      className="w-full h-full object-cover"
                    />

                    {selectedImage === image.url && (
                      <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all pointer-events-none" />
                  </button>

                  <button
                    onClick={(e) => handleDownload(image.url, image.id, e)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                    title="Download image"
                  >
                    <Download className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              ))}
            </div>

            {selectedImage && (
              <Button
                onClick={handleProceed}
                className="w-full h-12 font-semibold text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-200 hover:shadow-xl transition-all"
              >
                Proceed to Template Designer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
