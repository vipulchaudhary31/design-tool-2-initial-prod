# 🔍 Code Reference - Where Everything Is

## 🎯 Quick Navigation

### **Want to change the system prompt?**
👉 `/src/services/imageGenerationService.ts` (lines 39-71)

### **Want to switch from mock to real AI?**
👉 `/src/app/App.tsx` (line 15) - Comment out the import

### **Want to customize the UI?**
👉 `/src/app/components/ConceptGenerator.tsx`

### **Want to change mock image pools?**
👉 `/src/services/imageGenerationService.ts` (lines 161-202)

---

## 📍 Detailed Code Locations

### 1. System Prompt Template
**File:** `/src/services/imageGenerationService.ts`  
**Lines:** 39-71

```typescript
const SYSTEM_PROMPT_TEMPLATE = `Generate a high-quality image using the following strict rules.

1. Context Source
Use only the input text to infer mood, emotion, symbolism, color palette, and atmosphere.
...

4. Image Style
Render the image in this style: {IMAGE_STYLE}  ← Variable

6. Output Constraints
Aspect ratio: {ASPECT_RATIO}  ← Variable
...

Input Text (to be rendered exactly as-is):
{TEXT_INPUT}`;  ← Variable
```

**To modify:** Edit this template directly. The variables `{IMAGE_STYLE}`, `{ASPECT_RATIO}`, and `{TEXT_INPUT}` are automatically replaced.

---

### 2. Variable Injection Logic
**File:** `/src/services/imageGenerationService.ts`  
**Lines:** 76-85

```typescript
function buildPromptFromTemplate(
  concept: string,
  imageStyle: string,
  aspectRatio: string
): string {
  return SYSTEM_PROMPT_TEMPLATE
    .replace('{IMAGE_STYLE}', imageStyle)      ← Injects user's style
    .replace('{ASPECT_RATIO}', aspectRatio)    ← Injects aspect ratio
    .replace('{TEXT_INPUT}', concept);         ← Injects user's concept
}
```

**To add new variables:**
1. Add placeholder in template: `{MY_VARIABLE}`
2. Add parameter to this function
3. Add `.replace('{MY_VARIABLE}', myVariable)`

---

### 3. Mock API Interceptor
**File:** `/src/services/mockAPI.ts`  
**Lines:** 14-42

```typescript
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;

  // Handle /api/generate-images endpoint
  if (url.includes('/api/generate-images')) {  ← Intercepts this URL
    try {
      const body = JSON.parse(init.body);
      const result = await mockAPIHandler.handleGenerateImages(body);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500
      });
    }
  }

  return originalFetch(input, init);  ← All other requests pass through
};
```

**To disable:** Comment out the import in App.tsx

---

### 4. Enable/Disable Mock API
**File:** `/src/app/App.tsx`  
**Line:** 15

```typescript
import '@/services/mockAPI'; // Initialize mock API  ← ACTIVE

// To disable mock API (use real backend):
// import '@/services/mockAPI';  ← Comment this line
```

**Effect:**
- **Enabled:** All `/api/generate-images` calls return mock Unsplash images
- **Disabled:** Requests go to your real backend endpoint

---

### 5. Frontend API Call
**File:** `/src/app/components/ConceptGenerator.tsx`  
**Lines:** 43-92

```typescript
const handleGenerate = async () => {
  setIsGenerating(true);
  setError(null);

  try {
    const finalStyle = imageStyle === 'Other' ? customStyle : imageStyle;
    
    // Call backend API to generate images
    const response = await fetch('/api/generate-images', {  ← API endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        useSystemPrompt,           ← Toggle state
        concept,                   ← User's concept
        customPrompt,              ← Custom prompt (if toggle OFF)
        imageStyle: finalStyle,    ← Selected style
        aspectRatio,               ← "3:4" or "9:16"
        count: imageCount,         ← Number of images (1-6)
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate images');
    }

    const data = await response.json();
    setGeneratedImages(data.images);  ← Display images
  } catch (err) {
    setError(err.message);
  } finally {
    setIsGenerating(false);
  }
};
```

**To change endpoint:** Replace `/api/generate-images` with your backend URL

---

### 6. Mock Image Pools
**File:** `/src/services/imageGenerationService.ts`  
**Lines:** 161-202

```typescript
const sampleImagePools: Record<string, string[]> = {
  festival: [  ← Keyword: "festival", "diwali", "celebration"
    'https://images.unsplash.com/photo-1635792367888...',
    'https://images.unsplash.com/photo-1533900298318...',
    // ... more images
  ],
  morning: [  ← Keyword: "morning", "sunrise"
    'https://images.unsplash.com/photo-1470252649378...',
    'https://images.unsplash.com/photo-1495616811223...',
    // ... more images
  ],
  birthday: [  ← Keyword: "birthday", "party"
    'https://images.unsplash.com/photo-1530103862676...',
    // ... more images
  ],
  motivational: [  ← Keyword: "motivational", "success", "mountain"
    'https://images.unsplash.com/photo-1506905925346...',
    // ... more images
  ],
  default: [  ← Used when no keywords match
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85...',
    // ... more images
  ],
};
```

**To add new pool:**
```typescript
newKeyword: [
  'https://images.unsplash.com/photo-xxx',
  'https://images.unsplash.com/photo-yyy',
],
```

**To add keyword detection:**
```typescript
// Line 208-216
if (lowerPrompt.includes('yournewkeyword')) {
  selectedPool = sampleImagePools.newKeyword;
}
```

---

### 7. Image Generation (Production - Commented Out)
**File:** `/src/services/imageGenerationService.ts`  
**Lines:** 126-136

```typescript
// PRODUCTION CODE (Uncomment to use real AI):

// Option 1: OpenAI DALL-E 3
// const images = await generateWithOpenAI(finalPrompt, aspectRatio, count);

// Option 2: Google Gemini
// const images = await generateWithGemini(finalPrompt, aspectRatio, count);

// Option 3: Stability AI
// const images = await generateWithStabilityAI(finalPrompt, aspectRatio, count);

// MOCK: Use sample images for demo (replace with real AI in production)
const images = await generateMockImages(finalPrompt, aspectRatio, count);  ← Currently active
```

**To use real AI:**
1. Implement one of the provider functions (examples in file)
2. Uncomment the line you want to use
3. Comment out the mock line

---

### 8. UI Configuration Panel
**File:** `/src/app/components/ConceptGenerator.tsx**  
**Lines:** 312-396

```typescript
{/* Right: Configuration Panel */}
<div className="lg:col-span-1">
  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-24">
    
    {/* Aspect Ratio */}
    <select
      value={aspectRatio}
      onChange={(e) => setAspectRatio(e.target.value)}
    >
      <option value="3:4">3:4 (1080×1440px)</option>  ← Option 1
      <option value="9:16">9:16 (1080×1920px)</option>  ← Option 2
    </select>

    {/* Image Style */}
    <select
      value={imageStyle}
      onChange={(e) => setImageStyle(e.target.value)}
    >
      <option value="Realistic photography">Realistic photography</option>
      <option value="Cinematic realism">Cinematic realism</option>
      <option value="Digital illustration">Digital illustration</option>
      <option value="Hand-painted art style">Hand-painted art style</option>
      <option value="Minimalist conceptual art">Minimalist conceptual art</option>
      <option value="Hyper-realistic">Hyper-realistic</option>
      <option value="Watercolor illustration">Watercolor illustration</option>
      <option value="Other">Other (custom)</option>  ← Reveals input field
    </select>
  </div>
</div>
```

**To add new style:**
```typescript
<option value="Your New Style">Your New Style</option>
```

---

### 9. Number of Images Selector
**File:** `/src/app/components/ConceptGenerator.tsx**  
**Lines:** 201-218 and 236-253

```typescript
{/* Number of Images */}
<div className="mt-4">
  <label htmlFor="imageCount">Number of images to generate</label>
  <select
    id="imageCount"
    value={imageCount}
    onChange={(e) => setImageCount(Number(e.target.value))}
  >
    <option value={1}>1 image</option>
    <option value={2}>2 images</option>
    <option value={3}>3 images</option>
    <option value={4}>4 images</option>  ← Default
    <option value={6}>6 images</option>
  </select>
</div>
```

**To add new count:**
```typescript
<option value={8}>8 images</option>
```

---

### 10. System Prompt Toggle
**File:** `/src/app/components/ConceptGenerator.tsx**  
**Lines:** 158-182

```typescript
{/* System Prompt Toggle */}
<div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
  <div className="flex items-center justify-between mb-2">
    <div>
      <label htmlFor="systemPromptToggle">Use System Prompt</label>
      <p className="text-xs text-gray-600 mt-1">
        When enabled, uses optimized backend prompt with your concept
      </p>
    </div>
    <button
      id="systemPromptToggle"
      onClick={() => setUseSystemPrompt(!useSystemPrompt)}  ← Toggle action
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        useSystemPrompt ? 'bg-purple-600' : 'bg-gray-300'  ← Visual state
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        useSystemPrompt ? 'translate-x-6' : 'translate-x-1'  ← Animation
      }`} />
    </button>
  </div>
</div>
```

---

### 11. Skip to Designer Button
**File:** `/src/app/components/ConceptGenerator.tsx**  
**Lines:** 128-142

```typescript
{/* Header with Skip Button */}
<div className="flex items-center justify-between mb-8">
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
    <Sparkles className="w-4 h-4 text-purple-600" />
    <span className="text-sm font-semibold text-purple-900">AI-Powered Template Generator</span>
  </div>
  
  <Button
    onClick={onSkip}  ← Calls App.tsx's handleSkipToDesigner
    variant="outline"
    className="flex items-center gap-2 border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50"
  >
    <SkipForward className="w-4 h-4" />
    Skip to Designer
  </Button>
</div>
```

---

### 12. Toast Notifications
**File:** `/src/app/App.tsx**  
**Line:** 499 (Toaster component)

```typescript
<Toaster richColors position="top-right" />  ← Displays all toasts
```

**Toast triggers:**
```typescript
// Line 143-146: When image selected and proceeding
toast.success('Image selected!', {
  description: 'Now customize your template design.',
});

// Line 150-153: When skip clicked
toast.info('Skipped to designer', {
  description: 'You can upload your own background image in the designer.',
});

// Line 182-184: When template exported
toast.success('Template uploaded successfully!', {
  description: 'The template has been saved and is ready for end users.',
});
```

---

## 🔍 Common Customization Tasks

### **Task: Change prompt template**
1. Open `/src/services/imageGenerationService.ts`
2. Find `const SYSTEM_PROMPT_TEMPLATE` (line 39)
3. Edit the template text
4. Keep variable placeholders: `{IMAGE_STYLE}`, `{ASPECT_RATIO}`, `{TEXT_INPUT}`

### **Task: Add new image style**
1. Open `/src/app/components/ConceptGenerator.tsx`
2. Find the image style `<select>` (around line 346)
3. Add new `<option>`: `<option value="Your Style">Your Style</option>`

### **Task: Change default settings**
1. Open `/src/app/components/ConceptGenerator.tsx`
2. Find state declarations (lines 28-41)
3. Change defaults:
   ```typescript
   const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');  // Change from '3:4'
   const [imageCount, setImageCount] = useState(6);  // Change from 4
   const [useSystemPrompt, setUseSystemPrompt] = useState(false);  // Change from true
   ```

### **Task: Switch to real AI**
1. Open `/src/app/App.tsx`
2. Comment line 15: `// import '@/services/mockAPI';`
3. Deploy backend endpoint at `/api/generate-images`
4. Backend should follow examples in `/API_IMPLEMENTATION_GUIDE.md`

### **Task: Add new mock image pool**
1. Open `/src/services/imageGenerationService.ts`
2. Add new pool (around line 195):
   ```typescript
   nature: [
     'https://images.unsplash.com/photo-xxx',
     'https://images.unsplash.com/photo-yyy',
   ],
   ```
3. Add keyword detection (around line 208):
   ```typescript
   if (lowerPrompt.includes('nature') || lowerPrompt.includes('landscape')) {
     selectedPool = sampleImagePools.nature;
   }
   ```

### **Task: Change API endpoint URL**
1. Open `/src/app/components/ConceptGenerator.tsx`
2. Find `fetch('/api/generate-images'` (line 64)
3. Change to your backend URL:
   ```typescript
   const response = await fetch('https://your-backend.com/api/generate', {
   ```

---

## 📦 Dependencies

### **Key Packages:**
```json
{
  "lucide-react": "Icons (Sparkles, Loader2, etc.)",
  "sonner": "Toast notifications",
  "@radix-ui/react-*": "UI components (Button, etc.)",
  "react-easy-crop": "Image cropping",
  "motion": "Animations (optional)"
}
```

### **To install new AI provider:**
```bash
# OpenAI
npm install openai

# OR Gemini
npm install @google/generative-ai

# OR Stability AI
npm install node-fetch
```

---

## 🐛 Debug Checklist

### **Images not generating?**
1. ✅ Check: Is `import '@/services/mockAPI'` present in App.tsx?
2. ✅ Check: Browser console for errors
3. ✅ Check: Network tab shows request to `/api/generate-images`
4. ✅ Check: Response status is 200

### **Prompt not building correctly?**
1. ✅ Check: Browser console for `🤖 Generated Prompt for AI:` log
2. ✅ Check: Template has correct variable names
3. ✅ Check: buildPromptFromTemplate is replacing all variables

### **Real AI not working?**
1. ✅ Check: Mock API is disabled (import commented out)
2. ✅ Check: Backend is deployed and accessible
3. ✅ Check: API keys are set in backend `.env`
4. ✅ Check: Backend endpoint returns correct format

### **UI issues?**
1. ✅ Check: Toaster component is in App.tsx
2. ✅ Check: All required packages are installed
3. ✅ Check: No console errors in browser
4. ✅ Check: Network tab for failed requests

---

## 📞 Quick Help

**"Where is the system prompt?"**  
→ `/src/services/imageGenerationService.ts` line 39

**"How do I disable mock API?"**  
→ `/src/app/App.tsx` line 15 - comment it out

**"How do I add a new image style?"**  
→ `/src/app/components/ConceptGenerator.tsx` line 353 - add `<option>`

**"Where are the API examples?"**  
→ `/API_IMPLEMENTATION_GUIDE.md` - complete guide with all providers

**"How do I test the app?"**  
→ Mock API is active by default. Just open and use!

---

**All code locations are accurate as of the latest implementation.**  
**Use Ctrl+F or Cmd+F to find specific lines in your editor.**
