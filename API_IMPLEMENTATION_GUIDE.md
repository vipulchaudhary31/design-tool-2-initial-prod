# 🚀 Complete API Implementation Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [How API Calling Works](#how-api-calling-works)
3. [System Prompt Template](#system-prompt-template)
4. [Development Mode (Mock API)](#development-mode-mock-api)
5. [Production Setup](#production-setup)
6. [AI Provider Integration](#ai-provider-integration)
7. [Environment Variables](#environment-variables)
8. [Backend Implementation Examples](#backend-implementation-examples)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  ConceptGenerator.tsx                                          │
│    ↓                                                           │
│  User Input: { concept, style, aspectRatio, count }          │
│    ↓                                                           │
│  fetch('/api/generate-images', { body: JSON.stringify(...) }) │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MOCK API LAYER (Development)                 │
│                                                                 │
│  mockAPI.ts - Intercepts fetch() calls                        │
│    ↓                                                           │
│  Checks URL === '/api/generate-images'                        │
│    ↓                                                           │
│  Passes to imageGenerationService.ts                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              IMAGE GENERATION SERVICE (Core Logic)              │
│                                                                 │
│  if (useSystemPrompt):                                         │
│    finalPrompt = SYSTEM_PROMPT_TEMPLATE                       │
│      .replace('{IMAGE_STYLE}', imageStyle)                    │
│      .replace('{ASPECT_RATIO}', aspectRatio)                  │
│      .replace('{TEXT_INPUT}', concept)                        │
│  else:                                                         │
│    finalPrompt = customPrompt                                 │
│                                                                 │
│  MOCK MODE: Returns Unsplash images                           │
│  PRODUCTION: Calls AI provider API                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   AI PROVIDER (Production Only)                 │
│                                                                 │
│  OpenAI DALL-E 3 / Google Gemini / Stability AI               │
│    ↓                                                           │
│  Generates images based on finalPrompt                        │
│    ↓                                                           │
│  Returns image URLs                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND DISPLAY                         │
│                                                                 │
│  Receives: { success: true, images: [...] }                   │
│    ↓                                                           │
│  setGeneratedImages(data.images)                              │
│    ↓                                                           │
│  Display in grid with selection UI                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## How API Calling Works

### Step 1: User Triggers Generation

**Location:** `/src/app/components/ConceptGenerator.tsx` (line 43-92)

```typescript
const handleGenerate = async () => {
  setIsGenerating(true);
  setError(null);
  setGeneratedImages([]);

  try {
    const finalStyle = imageStyle === 'Other' ? customStyle : imageStyle;
    
    // Call backend API to generate images
    const response = await fetch('/api/generate-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        useSystemPrompt,              // true or false
        concept: useSystemPrompt ? concept : undefined,
        customPrompt: !useSystemPrompt ? customPrompt : undefined,
        imageStyle: finalStyle,       // e.g., "Realistic photography"
        aspectRatio,                  // "3:4" or "9:16"
        count: imageCount,            // 1-6
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate images');
    }

    const data = await response.json();
    setGeneratedImages(data.images);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsGenerating(false);
  }
};
```

### Step 2: Mock API Intercepts (Development)

**Location:** `/src/services/mockAPI.ts`

```typescript
// This intercepts ALL fetch() calls
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;

  // Only intercept our API endpoint
  if (url.includes('/api/generate-images')) {
    try {
      const body = init?.body ? JSON.parse(init.body) : {};
      
      // Pass to generation service
      const result = await mockAPIHandler.handleGenerateImages(body);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        { status: 500 }
      );
    }
  }

  // All other requests use original fetch
  return originalFetch(input, init);
};
```

### Step 3: Image Generation Service Processes

**Location:** `/src/services/imageGenerationService.ts`

```typescript
export async function generateImages(request) {
  const { 
    useSystemPrompt, 
    concept, 
    customPrompt,
    imageStyle,
    aspectRatio,
    count 
  } = request;

  // Build the final prompt
  let finalPrompt;
  
  if (useSystemPrompt) {
    // Inject variables into system template
    finalPrompt = SYSTEM_PROMPT_TEMPLATE
      .replace('{IMAGE_STYLE}', imageStyle)
      .replace('{ASPECT_RATIO}', aspectRatio)
      .replace('{TEXT_INPUT}', concept);
  } else {
    // Use custom prompt as-is
    finalPrompt = customPrompt;
  }

  console.log('🤖 Generated Prompt for AI:', finalPrompt);

  // MOCK MODE (current):
  const images = await generateMockImages(finalPrompt, aspectRatio, count);
  
  // PRODUCTION (uncomment when ready):
  // const images = await generateWithOpenAI(finalPrompt, aspectRatio, count);
  // OR
  // const images = await generateWithGemini(finalPrompt, aspectRatio, count);

  return {
    success: true,
    images,
    promptUsed: finalPrompt,
    concept: useSystemPrompt ? concept : undefined,
  };
}
```

---

## System Prompt Template

**Your Custom Template:**

```plaintext
Generate a high-quality image using the following strict rules.

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
{TEXT_INPUT}
```

**Variables Injected:**
- `{IMAGE_STYLE}` → User's selected style (e.g., "Realistic photography")
- `{ASPECT_RATIO}` → "3:4" or "9:16"
- `{TEXT_INPUT}` → User's concept (e.g., "Diwali festival celebration")

---

## Development Mode (Mock API)

**Currently Active:** The app uses mock images from Unsplash for testing.

**How it works:**
1. User generates images
2. Mock API intercepts the request
3. Returns curated Unsplash images based on keywords
4. No real AI API calls are made
5. No API keys required

**Mock Image Selection Logic:**
```typescript
const sampleImagePools = {
  festival: ['https://images.unsplash.com/photo-1635792367888...', ...],
  morning: ['https://images.unsplash.com/photo-1470252649378...', ...],
  birthday: ['https://images.unsplash.com/photo-1530103862676...', ...],
  motivational: ['https://images.unsplash.com/photo-1506905925346...', ...],
  default: ['https://images.unsplash.com/photo-1557682250-33bd709cbe85...', ...]
};

// Keyword matching
if (prompt.includes('festival')) selectedPool = sampleImagePools.festival;
```

---

## Production Setup

### Switching to Real AI

**Step 1: Disable Mock API**

Comment out this line in `/src/app/App.tsx`:
```typescript
// import '@/services/mockAPI'; // ← Comment this out
```

**Step 2: Implement Backend API Endpoint**

Create a real backend endpoint at `/api/generate-images` that:
1. Receives the request body
2. Builds the prompt (system or custom)
3. Calls your chosen AI provider
4. Returns image URLs

**Step 3: Deploy Backend**

Options:
- **Node.js/Express** - Traditional server
- **Next.js API Routes** - If using Next.js
- **Serverless Functions** - AWS Lambda, Vercel, Netlify
- **Cloud Run** - Google Cloud Platform

---

## AI Provider Integration

### Option 1: OpenAI DALL-E 3 (Best Quality)

**Pros:**
- Highest image quality
- Best text rendering
- Reliable and consistent

**Cons:**
- Most expensive (~$0.08/image)
- Slower generation
- Limited to 1 image per request

**Implementation:**

```bash
npm install openai
```

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateWithOpenAI(prompt, aspectRatio, count) {
  const size = aspectRatio === '9:16' ? '1024x1792' : '1024x1024';
  
  // Generate images sequentially (DALL-E 3 only allows n=1)
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
    
    // Upload to your CDN/storage (required for persistence)
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
```

**Cost:** ~$0.32 for 4 images

---

### Option 2: Google Gemini (Imagen) - Balanced

**Pros:**
- Good quality
- Faster than DALL-E
- More affordable

**Cons:**
- Moderate cost (~$0.02-0.04/image)
- May require Google Cloud setup

**Implementation:**

```bash
npm install @google/generative-ai
```

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function generateWithGemini(prompt, aspectRatio, count) {
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
```

**Cost:** ~$0.08-0.16 for 4 images

---

### Option 3: Stability AI (Most Affordable)

**Pros:**
- Very affordable (~$0.002-0.006/image)
- Fast generation
- Can generate multiple images in one request

**Cons:**
- Lower quality than DALL-E 3
- Less consistent text rendering

**Implementation:**

```bash
npm install node-fetch
```

```javascript
const fetch = require('node-fetch');

async function generateWithStabilityAI(prompt, aspectRatio, count) {
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
```

**Cost:** ~$0.008-0.024 for 4 images

---

## Environment Variables

Create a `.env` file in your backend project:

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# OR Google Gemini
GOOGLE_API_KEY=xxxxxxxxxxxxx

# OR Stability AI
STABILITY_API_KEY=sk-xxxxxxxxxxxxx

# Optional: CDN/Storage
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
AWS_S3_BUCKET=your-bucket-name
```

---

## Backend Implementation Examples

### Express.js Backend

```javascript
const express = require('express');
const router = express.Router();

// System prompt template
const SYSTEM_PROMPT_TEMPLATE = `
Generate a high-quality image using the following strict rules.

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
{TEXT_INPUT}
`;

function buildPromptFromTemplate(concept, imageStyle, aspectRatio) {
  return SYSTEM_PROMPT_TEMPLATE
    .replace('{IMAGE_STYLE}', imageStyle)
    .replace('{ASPECT_RATIO}', aspectRatio)
    .replace('{TEXT_INPUT}', concept);
}

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
    
    // Validation
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
    
    console.log('🤖 Generated Prompt:', finalPrompt);
    
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
```

### Next.js API Route

Create `/pages/api/generate-images.js`:

```javascript
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Same SYSTEM_PROMPT_TEMPLATE and buildPromptFromTemplate as above

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { useSystemPrompt, concept, customPrompt, imageStyle, aspectRatio, count } = req.body;
    
    // Same validation and prompt building logic...
    
    const images = await generateWithOpenAI(finalPrompt, aspectRatio, count);
    
    res.status(200).json({
      success: true,
      images,
      promptUsed: finalPrompt,
      concept: useSystemPrompt ? concept : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

---

## Summary: Control Flow

### Request Payload (Frontend → Backend)
```json
{
  "useSystemPrompt": true,
  "concept": "Diwali festival celebration",
  "imageStyle": "Realistic photography",
  "aspectRatio": "3:4",
  "count": 4
}
```

### Backend Processing
1. Validate inputs
2. Build prompt:
   - If `useSystemPrompt = true`: Inject variables into template
   - If `useSystemPrompt = false`: Use `customPrompt` as-is
3. Call AI API with `finalPrompt`
4. Receive image URLs from AI
5. Upload to CDN/storage (optional but recommended)
6. Return image URLs to frontend

### Response Payload (Backend → Frontend)
```json
{
  "success": true,
  "images": [
    {
      "id": "img_1737559200_0",
      "url": "https://your-cdn.com/image-1.jpg",
      "prompt": "Generate a high-quality image...",
      "thumbnail": "https://your-cdn.com/image-1-thumb.jpg"
    },
    // ... 3 more images
  ],
  "promptUsed": "Generate a high-quality image...",
  "concept": "Diwali festival celebration"
}
```

---

## Next Steps

1. ✅ **Test Mock API** - Verify the UI works with Unsplash images
2. ⚠️ **Choose AI Provider** - Select OpenAI, Gemini, or Stability AI
3. ⚠️ **Set Up Backend** - Deploy Express/Next.js API endpoint
4. ⚠️ **Configure Environment** - Add API keys to `.env`
5. ⚠️ **Disable Mock API** - Comment out `import '@/services/mockAPI'`
6. ⚠️ **Test Production** - Verify real AI generation works
7. ✅ **Deploy** - Launch your app!

---

## Questions or Issues?

- **Mock API not working?** Check browser console for errors
- **Real AI integration issues?** Verify API keys and quotas
- **Image upload errors?** Implement CDN storage (S3, Cloudinary, etc.)
- **Cost concerns?** Start with Stability AI (cheapest) or use rate limiting

---

**Current Status:** ✅ Mock API Active (Development Mode)  
**Ready for:** ⚠️ Production AI Integration
