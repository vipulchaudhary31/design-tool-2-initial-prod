/**
 * AI Image Generation Service - Real API Integration
 * 
 * This service integrates all AI providers (OpenAI, Gemini, Stability AI)
 * with a unified interface. Choose your provider in the config below.
 */

import { generateWithOpenAI } from './providers/openai';
import { generateWithGemini } from './providers/gemini';
import { generateWithStabilityAI } from './providers/stabilityai';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Select your AI provider here
 * Options: 'openai', 'gemini', 'stability'
 */
export const AI_PROVIDER = (import.meta.env.VITE_AI_PROVIDER || 'mock') as 'openai' | 'gemini' | 'stability' | 'mock';

/**
 * Enable/disable mock mode
 * When true, uses mock data instead of real AI calls
 */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || AI_PROVIDER === 'mock';

console.log('🤖 AI Service Configuration:', {
  provider: AI_PROVIDER,
  useMock: USE_MOCK_API,
});

// ============================================================================
// INTERFACES
// ============================================================================

interface GenerateImagesRequest {
  useSystemPrompt: boolean;
  concept?: string;
  customPrompt?: string;
  imageStyle?: string;
  aspectRatio?: string;
  count?: number;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  thumbnail: string;
}

interface GenerateImagesResponse {
  success: boolean;
  images: GeneratedImage[];
  promptUsed?: string;
  concept?: string;
  provider?: string;
}

// ============================================================================
// SYSTEM PROMPT TEMPLATE
// ============================================================================

const SYSTEM_PROMPT_TEMPLATE = `Generate a high-quality image using the following strict rules.

1. Context Source
Use only the input text to infer mood, emotion, symbolism, color palette, and atmosphere.
Do not assume or introduce any additional theme, culture, religion, location, or narrative unless it is clearly implied by the text.

2. Text Rendering (STRICT)
Render the exact input text clearly and accurately within the image.
Do NOT alter, paraphrase, translate, stylize excessively, or add any extra words.
The text must be readable, clean, and visually harmonious with the image.
No additional text, captions, signatures, watermarks, logos, or symbols are allowed.

3. Typography & Placement
Place the input text within a naturally occurring negative space area (such as open sky, gradient background, fog, shadowed region, plain wall, or low-detail surface).
Typography must be minimal, elegant, and unobtrusive, allowing the emotion of the text to lead.
Text should not overlap with the main subject and must not feel cramped or forced.

4. Image Style
Render the image in this style: {IMAGE_STYLE}

5. Composition & Negative Space
Create a balanced composition that emotionally supports the input text.
Intentionally design clear negative space specifically to hold the text.
This space must feel organic and integrated into the scene, not artificially boxed or framed.
Avoid clutter, visual noise, or edge-to-edge subject placement.

6. Output Constraints
Aspect ratio: {ASPECT_RATIO}
High resolution with smooth tonal transitions and clean details.
One complete, polished image with text naturally embedded into the design.

Input Text (to be rendered exactly as-is):
{TEXT_INPUT}`;

/**
 * Build the final prompt by injecting user variables into the system template
 */
function buildPromptFromTemplate(
  concept: string,
  imageStyle: string,
  aspectRatio: string
): string {
  return SYSTEM_PROMPT_TEMPLATE
    .replace('{IMAGE_STYLE}', imageStyle)
    .replace('{ASPECT_RATIO}', aspectRatio)
    .replace('{TEXT_INPUT}', concept);
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Main API handler for image generation
 */
export async function generateImages(
  request: GenerateImagesRequest
): Promise<GenerateImagesResponse> {
  const { 
    useSystemPrompt, 
    concept = '', 
    customPrompt = '',
    imageStyle = 'Realistic photography',
    aspectRatio = '3:4',
    count = 4 
  } = request;

  // Validate inputs
  if (useSystemPrompt && !concept.trim()) {
    throw new Error('Concept is required when using system prompt');
  }
  
  if (!useSystemPrompt && !customPrompt.trim()) {
    throw new Error('Custom prompt is required when system prompt is disabled');
  }

  // Build the final prompt
  let finalPrompt: string;
  
  if (useSystemPrompt) {
    finalPrompt = buildPromptFromTemplate(concept, imageStyle, aspectRatio);
  } else {
    finalPrompt = customPrompt;
  }

  console.log('🤖 Generated Prompt for AI:', finalPrompt.substring(0, 200) + '...');

  // Generate images using selected provider
  let images: GeneratedImage[];

  if (USE_MOCK_API) {
    console.log('📦 Using mock API (no real AI calls)');
    images = await generateMockImages(finalPrompt, aspectRatio, count);
  } else {
    console.log(`🚀 Using real AI provider: ${AI_PROVIDER}`);
    
    switch (AI_PROVIDER) {
      case 'openai':
        images = await generateWithOpenAI(finalPrompt, aspectRatio, count);
        break;
      
      case 'gemini':
        images = await generateWithGemini(finalPrompt, aspectRatio, count);
        break;
      
      case 'stability':
        images = await generateWithStabilityAI(finalPrompt, aspectRatio, count);
        break;
      
      default:
        throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
    }
  }

  return {
    success: true,
    images,
    promptUsed: finalPrompt,
    concept: useSystemPrompt ? concept : undefined,
    provider: USE_MOCK_API ? 'mock' : AI_PROVIDER,
  };
}

// ============================================================================
// MOCK IMPLEMENTATION (for testing)
// ============================================================================

async function generateMockImages(
  prompt: string,
  aspectRatio: string,
  count: number
): Promise<GeneratedImage[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const height = aspectRatio === '3:4' ? 1440 : 1920;
  
  // Sample image pools based on keywords in prompt
  const sampleImagePools: Record<string, string[]> = {
    festival: [
      'https://images.unsplash.com/photo-1635792367888-a0719f0b7078',
      'https://images.unsplash.com/photo-1533900298318-6b8da08a523e',
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
    ],
    morning: [
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8',
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869',
      'https://images.unsplash.com/photo-1472120435266-53107fd0c44a',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      'https://images.unsplash.com/photo-1494870363217-0816a1d3f56b',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
    ],
    birthday: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d',
      'https://images.unsplash.com/photo-1464347601390-25e2842a37f4',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176',
      'https://images.unsplash.com/photo-1531956656798-56686eeef3d4',
      'https://images.unsplash.com/photo-1558636508-e0db3814bd1d',
      'https://images.unsplash.com/photo-1578589318433-39b5e440c28c',
    ],
    motivational: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      'https://images.unsplash.com/photo-1434394673726-e8232a5903b4',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
      'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
    ],
    default: [
      'https://images.unsplash.com/photo-1557682250-33bd709cbe85',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
      'https://images.unsplash.com/photo-1557672172-298e090bd0f1',
      'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d',
      'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7',
    ],
  };

  // Select appropriate image pool based on keywords
  let selectedPool = sampleImagePools.default;
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('festival') || lowerPrompt.includes('celebration') || lowerPrompt.includes('diwali')) {
    selectedPool = sampleImagePools.festival;
  } else if (lowerPrompt.includes('morning') || lowerPrompt.includes('sunrise')) {
    selectedPool = sampleImagePools.morning;
  } else if (lowerPrompt.includes('birthday') || lowerPrompt.includes('party')) {
    selectedPool = sampleImagePools.birthday;
  } else if (lowerPrompt.includes('motivational') || lowerPrompt.includes('success') || lowerPrompt.includes('mountain')) {
    selectedPool = sampleImagePools.motivational;
  }

  // Generate images
  const images: GeneratedImage[] = selectedPool.slice(0, count).map((baseUrl, i) => {
    const url = `${baseUrl}?w=1080&h=${height}&fit=crop&q=80`;
    
    return {
      id: `mock_${Date.now()}_${i}`,
      url,
      prompt,
      thumbnail: url,
    };
  });

  return images;
}

// ============================================================================
// API HANDLER
// ============================================================================

export const apiHandler = {
  async handleGenerateImages(
    req: GenerateImagesRequest
  ): Promise<GenerateImagesResponse> {
    try {
      const result = await generateImages(req);
      return result;
    } catch (error) {
      console.error('Error in apiHandler:', error);
      throw error;
    }
  },
};
