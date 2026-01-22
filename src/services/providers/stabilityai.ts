/**
 * Stability AI Provider
 * 
 * This provider handles image generation using Stability AI's API.
 * Most cost-effective option with good quality.
 * 
 * Installation:
 * No additional packages required (uses fetch)
 * 
 * Environment Variables:
 * STABILITY_API_KEY=sk-xxxxxxxxxxxxx
 */

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  thumbnail: string;
}

/**
 * Generate images using Stability AI
 * 
 * @param prompt - The complete prompt to send to Stability AI
 * @param aspectRatio - "3:4" or "9:16"
 * @param count - Number of images to generate (1-6)
 * @returns Array of generated images with URLs
 */
export async function generateWithStabilityAI(
  prompt: string,
  aspectRatio: string,
  count: number
): Promise<GeneratedImage[]> {
  const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;

  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY is not configured. Please set VITE_STABILITY_API_KEY in your .env file.');
  }

  // Calculate dimensions based on aspect ratio
  const width = 1024;
  const height = aspectRatio === '3:4' ? 1344 : 1792;

  console.log('🎨 Generating with Stability AI:', {
    prompt: prompt.substring(0, 100) + '...',
    dimensions: `${width}x${height}`,
    count,
  });

  try {
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        height: height,
        width: width,
        samples: count,
        steps: 30,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stability AI Error: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();

    // Stability AI returns base64 encoded images
    const images: GeneratedImage[] = data.artifacts.map((artifact: any, i: number) => {
      const base64Image = `data:image/png;base64,${artifact.base64}`;
      
      return {
        id: `stability_${Date.now()}_${i}`,
        url: base64Image,
        prompt: prompt,
        thumbnail: base64Image,
      };
    });

    console.log('✅ Stability AI generation complete:', images.length, 'images');

    return images;
  } catch (error) {
    console.error('❌ Stability AI generation failed:', error);
    throw error;
  }
}

/**
 * Helper function to convert base64 to Blob (useful for uploading to CDN)
 */
export function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  
  return new Blob([array], { type: mime });
}

/**
 * Cost Information:
 * - Stability AI: ~$0.002-0.006 per image
 * - Total for 4 images: ~$0.008-0.024
 * - Total for 6 images: ~$0.012-0.036
 * 
 * Note: Stability AI is the most cost-effective option.
 * Images are returned as base64, so you'll need to convert and
 * upload them to your CDN/storage for permanent hosting.
 */
