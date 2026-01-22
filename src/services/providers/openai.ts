/**
 * OpenAI DALL-E 3 Provider
 * 
 * This provider handles image generation using OpenAI's DALL-E 3 API.
 * 
 * Installation:
 * npm install openai
 * 
 * Environment Variables:
 * OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
 */

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  thumbnail: string;
}

/**
 * Generate images using OpenAI DALL-E 3
 * 
 * @param prompt - The complete prompt to send to DALL-E 3
 * @param aspectRatio - "3:4" or "9:16"
 * @param count - Number of images to generate (1-6)
 * @returns Array of generated images with URLs
 */
export async function generateWithOpenAI(
  prompt: string,
  aspectRatio: string,
  count: number
): Promise<GeneratedImage[]> {
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  // DALL-E 3 only supports specific sizes
  // For 3:4, use 1024x1792 (closest to 1080x1440)
  // For 9:16, use 1024x1792 (matches aspect ratio)
  const size = aspectRatio === '9:16' ? '1024x1792' : '1024x1792';

  console.log('🎨 Generating with OpenAI DALL-E 3:', {
    prompt: prompt.substring(0, 100) + '...',
    size,
    count,
  });

  try {
    // DALL-E 3 can only generate 1 image per request
    // So we need to make multiple requests for multiple images
    const imagePromises = Array.from({ length: count }, async (_, i) => {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: size,
          quality: 'hd',
          style: 'vivid',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;

      return {
        id: `openai_${Date.now()}_${i}`,
        url: imageUrl,
        prompt: prompt,
        thumbnail: imageUrl,
      };
    });

    const images = await Promise.all(imagePromises);

    console.log('✅ OpenAI generation complete:', images.length, 'images');

    return images;
  } catch (error) {
    console.error('❌ OpenAI generation failed:', error);
    throw error;
  }
}

/**
 * Cost Information:
 * - DALL-E 3 HD quality: ~$0.08 per image
 * - Total for 4 images: ~$0.32
 * - Total for 6 images: ~$0.48
 * 
 * Note: OpenAI DALL-E 3 is the highest quality option but also the most expensive.
 * The images are temporary and expire after some time. You should download and
 * upload them to your own CDN/storage (S3, Cloudinary, etc.) for permanent storage.
 */
