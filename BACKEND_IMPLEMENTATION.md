# Backend Implementation Guide

This document explains how to implement the backend API for the Template Design Studio.

## Overview

The backend needs to handle two main API endpoints:
1. **POST /api/generate-images** - Generate AI images from text prompts
2. **POST /api/templates** - Save template configurations

---

## 1. Image Generation API

### Endpoint: `POST /api/generate-images`

Generates background images using AI based on a text prompt.

### Request Body
```json
{
  "prompt": "Vibrant festival celebration with colorful lights",
  "count": 4,
  "aspectRatio": "3:4"
}
```

### Response
```json
{
  "success": true,
  "images": [
    {
      "id": "img_1234567890_0",
      "url": "https://your-cdn.com/generated/image1.jpg",
      "prompt": "Vibrant festival celebration with colorful lights",
      "thumbnail": "https://your-cdn.com/generated/image1_thumb.jpg"
    }
  ],
  "concept": "Vibrant festival celebration with colorful lights"
}
```

---

## Implementation Options

### Option A: OpenAI DALL-E 3 (Recommended)

**Setup:**
```bash
npm install openai
```

**Code (Node.js/Express):**
```javascript
const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/api/generate-images', async (req, res) => {
  try {
    const { prompt, count = 4, aspectRatio = '3:4' } = req.body;

    // Validate input
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // Determine image size based on aspect ratio
    // DALL-E 3 supports: 1024x1024, 1024x1792, 1792x1024
    const size = aspectRatio === '9:16' ? '1024x1792' : '1024x1792';

    // Generate images
    const imagePromises = Array.from({ length: count }, async (_, i) => {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Create a stunning mobile wallpaper background for: ${prompt}. 
                 Style: Professional, vibrant, high-quality, suitable for social media templates. 
                 Important: No text, no people, no faces. Pure background design.`,
        n: 1,
        size: size,
        quality: "hd",
        style: "vivid" // or "natural" for more realistic images
      });

      // Upload to your CDN/storage (e.g., AWS S3, Cloudinary)
      const imageUrl = await uploadToStorage(response.data[0].url);

      return {
        id: `img_${Date.now()}_${i}`,
        url: imageUrl,
        prompt: prompt,
        thumbnail: imageUrl
      };
    });

    const images = await Promise.all(imagePromises);

    res.json({
      success: true,
      images,
      concept: prompt
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate images'
    });
  }
});

// Helper function to upload image to your storage
async function uploadToStorage(imageUrl) {
  // Download the image from OpenAI
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();

  // Upload to your storage (example with AWS S3)
  // const s3Key = `generated/${Date.now()}.png`;
  // await s3.upload({
  //   Bucket: 'your-bucket',
  //   Key: s3Key,
  //   Body: buffer,
  //   ContentType: 'image/png'
  // }).promise();
  // return `https://your-cdn.com/${s3Key}`;

  // For now, return the OpenAI URL (expires in 1 hour)
  return imageUrl;
}

module.exports = router;
```

**Environment Variables:**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

**Pricing:**
- DALL-E 3 HD (1024×1792): $0.080 per image
- Standard quality: $0.040 per image
- 4 images per generation = ~$0.32 per request

---

### Option B: Stability AI (Stable Diffusion XL)

**Setup:**
```bash
npm install node-fetch
```

**Code:**
```javascript
const fetch = require('node-fetch');

router.post('/api/generate-images', async (req, res) => {
  try {
    const { prompt, count = 4, aspectRatio = '3:4' } = req.body;

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
            {
              text: prompt,
              weight: 1
            },
            {
              text: "text, watermark, signature, people, faces",
              weight: -1
            }
          ],
          cfg_scale: 7,
          height: height,
          width: width,
          samples: count,
          steps: 30,
        }),
      }
    );

    const data = await response.json();

    const images = data.artifacts.map((artifact, i) => ({
      id: `img_${Date.now()}_${i}`,
      url: `data:image/png;base64,${artifact.base64}`,
      prompt: prompt,
      thumbnail: `data:image/png;base64,${artifact.base64}`
    }));

    res.json({
      success: true,
      images,
      concept: prompt
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate images'
    });
  }
});
```

**Environment Variables:**
```env
STABILITY_API_KEY=sk-xxxxxxxxxxxxx
```

**Pricing:**
- SDXL 1.0: $0.002-0.006 per image (much cheaper!)
- 4 images = ~$0.008-0.024 per request

---

### Option C: Replicate (Multiple AI Models)

**Setup:**
```bash
npm install replicate
```

**Code:**
```javascript
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

router.post('/api/generate-images', async (req, res) => {
  try {
    const { prompt, count = 4, aspectRatio = '3:4' } = req.body;

    const height = aspectRatio === '3:4' ? 1440 : 1920;
    const width = 1080;

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          width: width,
          height: height,
          num_outputs: count
        }
      }
    );

    const images = output.map((url, i) => ({
      id: `img_${Date.now()}_${i}`,
      url: url,
      prompt: prompt,
      thumbnail: url
    }));

    res.json({
      success: true,
      images,
      concept: prompt
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate images'
    });
  }
});
```

---

## 2. Template Save API

### Endpoint: `POST /api/templates`

Saves the final template configuration to the database.

### Request Body
```json
{
  "concept": "Vibrant festival celebration",
  "aspectRatio": "3:4",
  "primaryCategory": "Festival",
  "secondaryCategory": "Diwali",
  "languageTags": ["English", "Hindi", "Tamil"],
  "backgroundImage": "https://cdn.example.com/bg.jpg",
  "imagePlaceholder": {
    "x": 36.11,
    "y": 13.89,
    "diameter": 27.78
  },
  "namePlaceholder": {
    "x": 24.07,
    "y": 38.19,
    "width": 55.56,
    "height": 6.94
  },
  "textBackgroundStyle": "solid",
  "imageStrokeStyle": "white",
  "textAlignment": "center"
}
```

### Implementation (MongoDB Example)
```javascript
const mongoose = require('mongoose');

// Template Schema
const templateSchema = new mongoose.Schema({
  concept: String,
  aspectRatio: String,
  primaryCategory: String,
  secondaryCategory: String,
  languageTags: [String],
  backgroundImage: String,
  imagePlaceholder: {
    x: Number,
    y: Number,
    diameter: Number
  },
  namePlaceholder: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  textBackgroundStyle: String,
  imageStrokeStyle: String,
  textAlignment: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Template = mongoose.model('Template', templateSchema);

router.post('/api/templates', async (req, res) => {
  try {
    const template = new Template(req.body);
    await template.save();

    res.json({
      success: true,
      templateId: template._id,
      message: 'Template saved successfully'
    });
  } catch (error) {
    console.error('Template save error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save template'
    });
  }
});
```

---

## Complete Backend Setup

### 1. Install Dependencies
```bash
npm init -y
npm install express cors dotenv mongoose openai
# or use yarn/pnpm
```

### 2. Create Server (`server.js`)
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const imageRoutes = require('./routes/imageGeneration');
const templateRoutes = require('./routes/templates');

app.use(imageRoutes);
app.use(templateRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. Environment Variables (`.env`)
```env
# Server
PORT=3001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/template-studio

# AI Services (choose one)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
STABILITY_API_KEY=sk-xxxxxxxxxxxxx
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx

# Storage (optional)
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
S3_BUCKET=your-bucket-name
```

---

## Deployment

### Option 1: Vercel (Serverless)
```bash
npm install -g vercel
vercel
```

### Option 2: Railway/Render
- Connect GitHub repo
- Set environment variables
- Deploy

### Option 3: AWS EC2/DigitalOcean
- Setup Node.js server
- Use PM2 for process management
- Configure nginx reverse proxy

---

## Cost Estimation

**Per Template Creation:**
- DALL-E 3: $0.32 (4 images)
- Stability AI: $0.02 (4 images)
- Replicate: $0.01-0.05 (4 images)

**Recommended:** Start with Stability AI or Replicate for cost efficiency.

---

## Security Considerations

1. **Rate Limiting**: Limit API calls per user
2. **Authentication**: Add JWT/session auth
3. **Input Validation**: Sanitize all inputs
4. **API Key Security**: Never expose keys in frontend
5. **Content Moderation**: Filter inappropriate prompts

---

## Testing

Test the API with curl:

```bash
# Test image generation
curl -X POST http://localhost:3001/api/generate-images \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Beautiful sunset over mountains",
    "count": 4,
    "aspectRatio": "3:4"
  }'

# Test template save
curl -X POST http://localhost:3001/api/templates \
  -H "Content-Type: application/json" \
  -d @template-payload.json
```

---

## Support

For issues or questions, refer to:
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Stability AI Docs](https://platform.stability.ai/docs)
- [Replicate Docs](https://replicate.com/docs)
