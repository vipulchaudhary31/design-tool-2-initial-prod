# ⚡ Quick API Reference

## 🎯 How to Control API Calling

### Frontend (ConceptGenerator.tsx)
```typescript
// 1. User clicks "Generate Images"
const handleGenerate = async () => {
  const response = await fetch('/api/generate-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      useSystemPrompt: true,          // Toggle: true = template, false = custom
      concept: "Diwali celebration",  // User's concept (if useSystemPrompt=true)
      customPrompt: "",               // Full prompt (if useSystemPrompt=false)
      imageStyle: "Realistic photography",
      aspectRatio: "3:4",
      count: 4
    })
  });
  
  const data = await response.json();
  setGeneratedImages(data.images);  // Display images
};
```

---

## 🔄 System Prompt Mode Flow

```
User Input:
  concept: "Good morning with sunrise"
  imageStyle: "Cinematic realism"
  aspectRatio: "3:4"
  
     ↓
     
Backend Builds Prompt:
  SYSTEM_PROMPT_TEMPLATE
    .replace('{IMAGE_STYLE}', "Cinematic realism")
    .replace('{ASPECT_RATIO}', "3:4")
    .replace('{TEXT_INPUT}', "Good morning with sunrise")
    
     ↓
     
Final Prompt Sent to AI:
  "Generate a high-quality image using the following strict rules.
   ...
   4. Image Style
   Render the image in this style: Cinematic realism
   ...
   6. Output Constraints
   Aspect ratio: 3:4
   ...
   Input Text (to be rendered exactly as-is):
   Good morning with sunrise"
   
     ↓
     
AI Returns Images → Display in UI
```

---

## 🎨 Custom Prompt Mode Flow

```
User Input:
  customPrompt: "A serene mountain landscape at dawn with soft 
                 golden light breaking through misty valleys..."
  
     ↓
     
Backend:
  finalPrompt = customPrompt  // No template processing!
  
     ↓
     
Final Prompt Sent to AI:
  "A serene mountain landscape at dawn with soft golden light..."
  
     ↓
     
AI Returns Images → Display in UI
```

---

## 🛠️ Backend Endpoint Structure

```javascript
POST /api/generate-images

REQUEST BODY:
{
  "useSystemPrompt": boolean,
  "concept": string (required if useSystemPrompt=true),
  "customPrompt": string (required if useSystemPrompt=false),
  "imageStyle": string,
  "aspectRatio": "3:4" | "9:16",
  "count": number (1-6)
}

RESPONSE (Success):
{
  "success": true,
  "images": [
    {
      "id": "img_1737559200_0",
      "url": "https://...",
      "prompt": "...",
      "thumbnail": "https://..."
    }
  ],
  "promptUsed": "Complete prompt sent to AI",
  "concept": "User's concept"
}

RESPONSE (Error):
{
  "success": false,
  "error": "Error message"
}
```

---

## 🚀 Quick Start: Switch from Mock to Real AI

### Current (Mock Mode):
```typescript
// src/app/App.tsx
import '@/services/mockAPI'; // ← Mock API active
```

### Production (Real AI):
```typescript
// src/app/App.tsx
// import '@/services/mockAPI'; // ← Comment out

// Deploy backend with real AI integration
```

---

## 💰 Cost Comparison

| Provider      | Cost per Image | Cost for 4 Images | Quality | Speed    |
|--------------|----------------|-------------------|---------|----------|
| OpenAI       | ~$0.08         | ~$0.32            | ⭐⭐⭐⭐⭐ | Slow     |
| Gemini       | ~$0.03         | ~$0.12            | ⭐⭐⭐⭐   | Medium   |
| Stability AI | ~$0.004        | ~$0.016           | ⭐⭐⭐    | Fast     |

---

## 📝 System Prompt Variables

Your template supports these variables:

| Variable          | Example Value                | Description                    |
|------------------|------------------------------|--------------------------------|
| `{IMAGE_STYLE}`  | "Realistic photography"      | User-selected or custom style  |
| `{ASPECT_RATIO}` | "3:4" or "9:16"              | Canvas dimensions              |
| `{TEXT_INPUT}`   | "Diwali celebration"         | User's concept text            |

---

## 🔑 API Keys Setup

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# OR Gemini
GOOGLE_API_KEY=xxxxxxxxxxxxx

# OR Stability AI
STABILITY_API_KEY=sk-xxxxxxxxxxxxx
```

Get your keys:
- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://makersuite.google.com/app/apikey
- Stability: https://platform.stability.ai/account/keys

---

## 📦 Package Installation

```bash
# OpenAI
npm install openai

# OR Gemini
npm install @google/generative-ai

# OR Stability AI
npm install node-fetch
```

---

## 🧪 Testing the Flow

### 1. Test Mock API (Current State)
- Open app
- Enter concept: "Birthday celebration"
- Select style: "Digital illustration"
- Click "Generate Images"
- Should see Unsplash images

### 2. Monitor Console
```javascript
// Check these logs in browser console:
console.log('🤖 Generated Prompt for AI:', finalPrompt);
```

### 3. Test Backend (Production)
```bash
# Test endpoint directly
curl -X POST http://localhost:3000/api/generate-images \
  -H "Content-Type: application/json" \
  -d '{
    "useSystemPrompt": true,
    "concept": "Good morning",
    "imageStyle": "Realistic photography",
    "aspectRatio": "3:4",
    "count": 2
  }'
```

---

## 🐛 Troubleshooting

### Mock API not responding?
```javascript
// Check if mockAPI.ts is imported in App.tsx
import '@/services/mockAPI'; // ← Must be present
```

### Real API not working?
1. Check API key is set in `.env`
2. Verify backend endpoint is deployed
3. Check CORS settings
4. Monitor backend logs for errors

### Images not displaying?
1. Check network tab in browser DevTools
2. Verify image URLs are valid
3. Check for CORS issues
4. Ensure CDN/storage is accessible

---

## ✅ Current Implementation Status

- ✅ **Frontend:** ConceptGenerator with all controls
- ✅ **Mock API:** Intercepts requests, returns Unsplash images
- ✅ **Service Layer:** Prompt building logic complete
- ✅ **System Prompt:** Your custom template implemented
- ⚠️ **Backend:** Ready for AI integration (examples provided)
- ⚠️ **Production AI:** Awaiting provider selection

---

## 🎯 Next Steps

1. **Test Current Mock API** - Verify UI works correctly
2. **Choose AI Provider** - OpenAI/Gemini/Stability
3. **Deploy Backend** - Express/Next.js/Serverless
4. **Configure API Keys** - Set up environment variables
5. **Disable Mock** - Comment out mock API import
6. **Go Live!** - Test with real AI generation

---

For detailed implementation, see: `/API_IMPLEMENTATION_GUIDE.md`
