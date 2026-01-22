# API Integration Guide - Dynamic AI Image Generation

## Overview

This guide explains how to integrate real AI image generation APIs (OpenAI, Gemini, Stability AI) with your template design studio.

---

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Frontend   │         │   Backend   │         │  AI Model   │
│    (UI)     │────────▶│  (Server)   │────────▶│ (OpenAI/    │
│             │◀────────│             │◀────────│  Gemini)    │
└─────────────┘         └─────────────┘         └─────────────┘
     │                         │                       │
     │ 1. User inputs          │ 3. Build prompt       │
     │    - Concept            │    from template      │
     │    - Style              │                       │
     │    - Aspect ratio       │ 4. Send to AI         │
     │                         │                       │
     │ 2. Send to backend      │ 5. Receive images     │
     │                         │                       │
     │ 6. Display images       │ 6. Return URLs        │
     │                         │                       │
```

---

## How Prompt Control Works

### System Prompt Mode (Default)

**Flow:**
```
1. User enters: "Diwali festival celebration"
2. User selects: Style = "Cinematic realism", Aspect = "3:4"
3. Frontend sends to backend:
   {
     useSystemPrompt: true,
     concept: "Diwali festival celebration",
     imageStyle: "Cinematic realism",
     aspectRatio: "3:4",
     count: 4
   }

4. Backend receives and builds final prompt:
   - Takes SYSTEM_PROMPT_TEMPLATE (stored in backend)
   - Replaces {TEXT_INPUT} with "Diwali festival celebration"
   - Replaces {IMAGE_STYLE} with "Cinematic realism"
   - Replaces {ASPECT_RATIO} with "3:4"
   
5. Final prompt to AI:
   "Generate a high-quality image using the following strict rules...
    ...Render the image in this style: Cinematic realism
    ...Aspect ratio: 3:4
    ...Input Text: Diwali festival celebration"

6. AI generates 4 images based on final prompt
7. Backend returns image URLs to frontend
8. Frontend displays images in grid
```

### Custom Prompt Mode

**Flow:**
```
1. User toggles "Use System Prompt" OFF
2. User enters complete custom prompt:
   "Create a vibrant Diwali scene with diyas, 
    rangoli, and fireworks in a cinematic style"
3. Frontend sends to backend:
   {
     useSystemPrompt: false,
     customPrompt: "Create a vibrant Diwali scene...",
     count: 4
   }

4. Backend receives and uses custom prompt as-is
5. No template processing - sends directly to AI
6. AI generates 4 images
7. Backend returns image URLs
8. Frontend displays images
```

---

## System Prompt Template

The system prompt template is stored in the backend (`imageGenerationService.ts`):

```javascript
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

// Variables injected:
// - {IMAGE_STYLE}: User-selected style from dropdown
// - {ASPECT_RATIO}: User-selected aspect ratio (3:4 or 9:16)
// - {TEXT_INPUT}: User's concept text
```

---

## Backend Implementation

### 1. Install Dependencies

Choose your AI provider and install the SDK:

```bash
# Option 1: OpenAI
npm install openai

# Option 2: Google Gemini
npm install @google/generative-ai

# Option 3: Stability AI
npm install node-fetch
```

### 2. Set Environment Variables

Create `.env` file:

```env
# Choose one:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
# OR
GOOGLE_API_KEY=xxxxxxxxxxxxx
# OR
STABILITY_API_KEY=sk-xxxxxxxxxxxxx
```

### 3. Create Backend Endpoint

**File: `backend/routes/imageGeneration.js`**

```javascript
const express = require('express');
const router = express.Router();

// Import your chosen AI provider function
const { generateWithOpenAI } = require('../services/aiService');

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
        error: 'Concept is required when using system prompt' 
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
      // Inject variables into system prompt template
      finalPrompt = buildPromptFromTemplate(
        concept, 
        imageStyle, 
        aspectRatio
      );
    } else {
      // Use custom prompt directly
      finalPrompt = customPrompt;
    }
    
    console.log('Generated Prompt:', finalPrompt);
    
    // Call AI API
    const images = await generateWithOpenAI(
      finalPrompt, 
      aspectRatio, 
      count
    );
    
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

// Helper function to build prompt from template
function buildPromptFromTemplate(concept, imageStyle, aspectRatio) {
  const SYSTEM_PROMPT_TEMPLATE = `Generate a high-quality image using the following strict rules...
  
4. Image Style
Render the image in this style: {IMAGE_STYLE}

6. Output Constraints
Aspect ratio: {ASPECT_RATIO}
...

Input Text (to be rendered exactly as-is):
{TEXT_INPUT}`;

  return SYSTEM_PROMPT_TEMPLATE
    .replace('{IMAGE_STYLE}', imageStyle)
    .replace('{ASPECT_RATIO}', aspectRatio)
    .replace('{TEXT_INPUT}', concept);
}

module.exports = router;
```

---

## AI Provider Implementations

### Option 1: OpenAI DALL-E 3 (Best Quality)

**File: `backend/services/aiService.js`**

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateWithOpenAI(prompt, aspectRatio, count) {
  // DALL-E 3 supported sizes: 1024x1024, 1024x1792, 1792x1024
  const size = aspectRatio === '9:16' ? '1024x1792' : '1024x1792';
  
  const imagePromises = Array.from({ length: count }, async (_, i) => {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1, // DALL-E 3 only supports n=1
      size: size,
      quality: "hd",
      style: "vivid" // or "natural"
    });
    
    const imageUrl = response.data[0].url;
    
    // Optional: Upload to your CDN
    // const cdnUrl = await uploadToS3(imageUrl);
    
    return {
      id: `img_${Date.now()}_${i}`,
      url: imageUrl, // or cdnUrl
      prompt: prompt,
      thumbnail: imageUrl
    };
  });
  
  const images = await Promise.all(imagePromises);
  return images;
}

module.exports = { generateWithOpenAI };
```

**Pricing:**
- Standard: $0.040 per image
- HD: $0.080 per image
- 4 HD images = $0.32

**Pros:**
- Highest quality outputs
- Best text rendering
- Reliable and fast

**Cons:**
- Most expensive
- Can only generate 1 image per call (need to loop)

---

### Option 2: Google Gemini (Imagen)

**File: `backend/services/aiService.js`**

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function generateWithGemini(prompt, aspectRatio, count) {
  const model = genAI.getGenerativeModel({ model: "imagen-3" });
  
  const imagePromises = Array.from({ length: count }, async (_, i) => {
    const result = await model.generateImage({
      prompt: prompt,
      numberOfImages: 1,
      aspectRatio: aspectRatio === '9:16' ? '9:16' : '3:4',
      outputFormat: 'jpeg'
    });
    
    const imageUrl = result.images[0].url;
    
    return {
      id: `img_${Date.now()}_${i}`,
      url: imageUrl,
      prompt: prompt,
      thumbnail: imageUrl
    };
  });
  
  const images = await Promise.all(imagePromises);
  return images;
}

module.exports = { generateWithGemini };
```

**Pricing:**
- ~$0.02-0.04 per image
- 4 images = $0.08-0.16

**Pros:**
- Good quality
- Native aspect ratio support
- Lower cost than DALL-E

**Cons:**
- Requires Google Cloud setup
- Less widely used

---

### Option 3: Stability AI (Most Cost-Effective)

**File: `backend/services/aiService.js`**

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
        text_prompts: [
          { text: prompt, weight: 1 }
        ],
        cfg_scale: 7,
        height: height,
        width: width,
        samples: count, // Can generate multiple at once
        steps: 30,
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Stability AI error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  const images = data.artifacts.map((artifact, i) => {
    // Images are base64 encoded
    const imageData = `data:image/png;base64,${artifact.base64}`;
    
    // Optional: Upload to CDN instead of using base64
    // const cdnUrl = await uploadBase64ToS3(artifact.base64);
    
    return {
      id: `img_${Date.now()}_${i}`,
      url: imageData, // or cdnUrl
      prompt: prompt,
      thumbnail: imageData
    };
  });
  
  return images;
}

module.exports = { generateWithStabilityAI };
```

**Pricing:**
- ~$0.002-0.006 per image
- 4 images = $0.008-0.024

**Pros:**
- Very cost-effective
- Can generate multiple images in one call
- Open source model

**Cons:**
- Requires handling base64 or CDN upload
- May need more prompt engineering

---

## Complete Server Setup

### File Structure
```
backend/
├── server.js
├── routes/
│   └── imageGeneration.js
├── services/
│   └── aiService.js
├── .env
└── package.json
```

### server.js
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const imageRoutes = require('./routes/imageGeneration');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use(imageRoutes);

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### package.json
```json
{
  "name": "template-studio-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "openai": "^4.20.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## Frontend-Backend Communication

### Request Format

```typescript
// Frontend sends this to /api/generate-images
{
  useSystemPrompt: true,          // or false for custom mode
  concept: "Diwali celebration",  // only if useSystemPrompt=true
  customPrompt: "...",            // only if useSystemPrompt=false
  imageStyle: "Cinematic realism",
  aspectRatio: "3:4",
  count: 4
}
```

### Response Format

```typescript
// Backend returns this
{
  success: true,
  images: [
    {
      id: "img_1234567890_0",
      url: "https://cdn.example.com/image1.jpg",
      prompt: "Full prompt that was sent to AI",
      thumbnail: "https://cdn.example.com/image1_thumb.jpg"
    },
    // ... 3 more images
  ],
  promptUsed: "Full prompt sent to AI (for debugging)",
  concept: "Diwali celebration"
}
```

---

## Testing the Integration

### 1. Test with cURL

```bash
# Test system prompt mode
curl -X POST http://localhost:3001/api/generate-images \
  -H "Content-Type: application/json" \
  -d '{
    "useSystemPrompt": true,
    "concept": "Diwali festival celebration",
    "imageStyle": "Cinematic realism",
    "aspectRatio": "3:4",
    "count": 2
  }'

# Test custom prompt mode
curl -X POST http://localhost:3001/api/generate-images \
  -H "Content-Type: application/json" \
  -d '{
    "useSystemPrompt": false,
    "customPrompt": "Create a vibrant Diwali scene with diyas",
    "count": 2
  }'
```

### 2. Test from Frontend

1. Start backend: `npm start`
2. Start frontend: `npm run dev`
3. Open browser
4. Enter concept: "Diwali celebration"
5. Select style: "Cinematic realism"
6. Click "Generate Images"
7. Check browser network tab for API call
8. Check backend console for prompt log
9. Wait for images to load

---

## Error Handling

### Backend Errors

```javascript
router.post('/api/generate-images', async (req, res) => {
  try {
    // ... generation code
  } catch (error) {
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate images'
    });
  }
});
```

### Frontend Error Display

The frontend already handles errors:
```typescript
catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to generate images');
}
```

---

## Cost Optimization

### 1. Cache Results
```javascript
const cache = new Map();

async function generateImages(prompt, aspectRatio, count) {
  const cacheKey = `${prompt}-${aspectRatio}-${count}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const images = await generateWithOpenAI(prompt, aspectRatio, count);
  cache.set(cacheKey, images);
  
  return images;
}
```

### 2. Use Lower Quality for Previews
```javascript
// Generate 1 preview image first (cheaper)
const preview = await generateWithOpenAI(prompt, aspectRatio, 1);

// Only generate full batch if user likes preview
if (userApprovesPreview) {
  const fullBatch = await generateWithOpenAI(prompt, aspectRatio, 4);
}
```

### 3. Implement Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/api/generate-images', limiter);
```

---

## Deployment

### Option 1: Vercel (Serverless)
```bash
vercel
```

### Option 2: Railway
1. Connect GitHub repo
2. Add environment variables
3. Deploy

### Option 3: AWS/DigitalOcean
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js

# Configure nginx
sudo nano /etc/nginx/sites-available/default
```

---

## Security Best Practices

1. **Never expose API keys in frontend**
2. **Validate all inputs on backend**
3. **Implement rate limiting**
4. **Add authentication for production**
5. **Sanitize user prompts to prevent injection**
6. **Set CORS properly**

---

## Summary

| Aspect | Details |
|--------|---------|
| **Prompt Control** | Lives in backend |
| **System Prompt** | Stored in backend, variables injected |
| **Custom Prompt** | Sent directly to AI without template |
| **Frontend Role** | Collect inputs, display results |
| **Backend Role** | Build prompts, call AI, return URLs |
| **Best Provider** | OpenAI (quality) or Stability AI (cost) |

---

**Ready to integrate!** Choose your AI provider and follow the implementation guide above.
