/**
 * Image Generation Service with AI Integration
 * 
 * This service handles the backend prompt logic for AI image generation.
 * It supports two modes:
 * 1. System Prompt Mode: Uses predefined template with user inputs
 * 2. Custom Prompt Mode: Sends user's custom prompt directly to AI
 * 
 * Backend Implementation Guide at bottom of file.
 */

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
}

/**
 * System Prompt Template
 * This is the optimized prompt that combines user inputs
 */
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

  console.log('🤖 Generated Prompt for AI:', finalPrompt);

  // Simulate API delay (in production, this is the actual AI API call)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  /**
   * PRODUCTION CODE (Uncomment to use real AI):
   * 
   * Option 1: OpenAI DALL-E 3
   * const images = await generateWithOpenAI(finalPrompt, aspectRatio, count);
   * 
   * Option 2: Google Gemini
   * const images = await generateWithGemini(finalPrompt, aspectRatio, count);
   * 
   * Option 3: Stability AI
   * const images = await generateWithStabilityAI(finalPrompt, aspectRatio, count);
   */

  // MOCK: Use sample images for demo (replace with real AI in production)
  const images = await generateMockImages(finalPrompt, aspectRatio, count);

  return {
    success: true,
    images,
    promptUsed: finalPrompt,
    concept: useSystemPrompt ? concept : undefined,
  };
}

/**
 * Mock implementation for demo purposes
 * In production, replace this with real AI API calls
 */
async function generateMockImages(
  prompt: string,
  aspectRatio: string,
  count: number
): Promise<GeneratedImage[]> {
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
      id: `gen_${Date.now()}_${i}`,
      url,
      prompt,
      thumbnail: url,
    };
  });

  return images;
}

/**
 * Mock API endpoint handler
 */
export const mockAPIHandler = {
  async handleGenerateImages(
    req: GenerateImagesRequest
  ): Promise<GenerateImagesResponse> {
    try {
      const result = await generateImages(req);
      return result;
    } catch (error) {
      console.error('Error in mockAPIHandler:', error);
      throw error;
    }
  },
};

/* ============================================================================
 * PRODUCTION BACKEND IMPLEMENTATION GUIDE
 * ============================================================================
 * 
 * Below are complete backend implementations for different AI providers.
 * Choose one based on your needs and budget.
 * 
 * ============================================================================
 * OPTION 1: OPENAI DALL-E 3 (Best Quality)
 * ============================================================================
 * 
 * Installation:
 * npm install openai
 * 
 * Environment Variables:
 * OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
 * 
 * Code (Node.js/Express):
 */

/* 
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateWithOpenAI(prompt: string, aspectRatio: string, count: number) {
  const size = aspectRatio === '9:16' ? '1024x1792' : '1024x1792'; // DALL-E 3 closest size
  
  const imagePromises = Array.from({ length: count }, async (_, i) => {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size,
      quality: "hd",
      style: "vivid"
    });
    
    const imageUrl = response.data[0].url;
    
    // Upload to your CDN/storage
    const cdnUrl = await uploadToStorage(imageUrl);
    
    return {
      id: `img_${Date.now()}_${i}`,
      url: cdnUrl,
      prompt: prompt,
      thumbnail: cdnUrl
    };
  });
  
  return await Promise.all(imagePromises);
}

// Cost: ~$0.08 per image (HD quality)
// Total for 4 images: ~$0.32
*/

/* ============================================================================
 * OPTION 2: GOOGLE GEMINI (Imagen)
 * ============================================================================
 * 
 * Installation:
 * npm install @google/generative-ai
 * 
 * Environment Variables:
 * GOOGLE_API_KEY=xxxxxxxxxxxxx
 * 
 * Code:
 */

/*
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function generateWithGemini(prompt: string, aspectRatio: string, count: number) {
  const model = genAI.getGenerativeModel({ model: "imagen-2" });
  
  const imagePromises = Array.from({ length: count }, async (_, i) => {
    const result = await model.generateImage({
      prompt: prompt,
      numberOfImages: 1,
      aspectRatio: aspectRatio === '9:16' ? '9:16' : '3:4'
    });
    
    const imageUrl = result.images[0].url;
    const cdnUrl = await uploadToStorage(imageUrl);
    
    return {
      id: `img_${Date.now()}_${i}`,
      url: cdnUrl,
      prompt: prompt,
      thumbnail: cdnUrl
    };
  });
  
  return await Promise.all(imagePromises);
}

// Cost: ~$0.02-0.04 per image
// Total for 4 images: ~$0.08-0.16
*/

/* ============================================================================
 * OPTION 3: STABILITY AI (Most Cost-Effective)
 * ============================================================================
 * 
 * Installation:
 * npm install node-fetch
 * 
 * Environment Variables:
 * STABILITY_API_KEY=sk-xxxxxxxxxxxxx
 * 
 * Code:
 */

/*
const fetch = require('node-fetch');

async function generateWithStabilityAI(prompt: string, aspectRatio: string, count: number) {
  const height = aspectRatio === '3:4' ? 1344 : 1792;
  const width = 1024;
  
  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        height: height,
        width: width,
        samples: count,
        steps: 30,
      }),
    }
  );
  
  const data = await response.json();
  
  return data.artifacts.map((artifact, i) => ({
    id: `img_${Date.now()}_${i}`,
    url: `data:image/png;base64,${artifact.base64}`,
    prompt: prompt,
    thumbnail: `data:image/png;base64,${artifact.base64}`
  }));
}

// Cost: ~$0.002-0.006 per image
// Total for 4 images: ~$0.008-0.024
*/

/* ============================================================================
 * COMPLETE BACKEND ENDPOINT EXAMPLE (Express.js)
 * ============================================================================
 */

/*
const express = require('express');
const router = express.Router();

router.post('/api/generate-images', async (req, res) => {
  try {
    const { 
      useSystemPrompt, 
      concept, 
      customPrompt, 
      imageStyle, 
      aspectRatio, 
      count 
    } = req.body;
    
    // Validate
    if (useSystemPrompt && !concept) {
      return res.status(400).json({ 
        success: false, 
        error: 'Concept is required' 
      });
    }
    
    if (!useSystemPrompt && !customPrompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Custom prompt is required' 
      });
    }
    
    // Build final prompt
    let finalPrompt;
    if (useSystemPrompt) {
      finalPrompt = buildPromptFromTemplate(concept, imageStyle, aspectRatio);
    } else {
      finalPrompt = customPrompt;
    }
    
    // Generate images with your chosen AI provider
    const images = await generateWithOpenAI(finalPrompt, aspectRatio, count);
    // OR: await generateWithGemini(finalPrompt, aspectRatio, count);
    // OR: await generateWithStabilityAI(finalPrompt, aspectRatio, count);
    
    res.json({
      success: true,
      images,
      promptUsed: finalPrompt,
      concept: useSystemPrompt ? concept : undefined
    });
    
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate images'
    });
  }
});

module.exports = router;
*/

/* ============================================================================
 * PROMPT CONTROL FLOW
 * ============================================================================
 * 
 * Frontend → Backend → AI Model
 * 
 * SYSTEM PROMPT MODE (useSystemPrompt = true):
 * 1. User enters: concept, imageStyle, aspectRatio
 * 2. Frontend sends: { useSystemPrompt: true, concept, imageStyle, aspectRatio }
 * 3. Backend receives request
 * 4. Backend builds prompt: SYSTEM_PROMPT_TEMPLATE with variables injected
 * 5. Backend sends final prompt to AI
 * 6. AI generates images
 * 7. Backend returns image URLs
 * 
 * CUSTOM PROMPT MODE (useSystemPrompt = false):
 * 1. User enters: complete custom prompt
 * 2. Frontend sends: { useSystemPrompt: false, customPrompt }
 * 3. Backend receives request
 * 4. Backend uses customPrompt as-is (no template)
 * 5. Backend sends prompt directly to AI
 * 6. AI generates images
 * 7. Backend returns image URLs
 * 
 * ============================================================================
 * KEY POINTS
 * ============================================================================
 * 
 * 1. Prompt Logic Lives in Backend:
 *    - System prompt template is stored in backend
 *    - Variable injection happens in backend
 *    - Frontend only sends raw user inputs
 * 
 * 2. Frontend Responsibilities:
 *    - Collect user inputs (concept, style, aspect ratio)
 *    - Manage UI state and validation
 *    - Display generated images
 *    - Handle loading/error states
 * 
 * 3. Backend Responsibilities:
 *    - Store system prompt template
 *    - Build final prompt from template + variables
 *    - Call AI API with final prompt
 *    - Handle AI responses and errors
 *    - Return image URLs to frontend
 * 
 * 4. AI API Integration:
 *    - Choose provider: OpenAI, Gemini, or Stability AI
 *    - Set up API credentials
 *    - Handle rate limits and quotas
 *    - Implement retry logic for failures
 *    - Upload generated images to CDN/storage
 * 
 * ============================================================================
 */
