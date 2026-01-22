# 🎨 Visual API Flow Diagram

## Complete Request-Response Cycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER INTERFACE                                  │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  ConceptGenerator Component                                         │   │
│  │  ┌──────────────────────────────────────────────────────────┐     │   │
│  │  │  [Toggle: Use System Prompt] ✓ ON                       │     │   │
│  │  └──────────────────────────────────────────────────────────┘     │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────┐     │   │
│  │  │  What's your concept?                                    │     │   │
│  │  │  ┌────────────────────────────────────────────────────┐ │     │   │
│  │  │  │ "Diwali festival with diyas and lights"            │ │     │   │
│  │  │  └────────────────────────────────────────────────────┘ │     │   │
│  │  └──────────────────────────────────────────────────────────┘     │   │
│  │                                                                     │   │
│  │  Images to generate: [4 ▼]                                        │   │
│  │                                                                     │   │
│  │  Configuration Panel:                                              │   │
│  │  - Aspect Ratio: 3:4                                              │   │
│  │  - Image Style: Realistic photography                             │   │
│  │                                                                     │   │
│  │  [ Generate Images ]  ← USER CLICKS                               │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    ↓  fetch('/api/generate-images', {...})
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOCK API INTERCEPTOR                                │
│                         (mockAPI.ts)                                        │
│                                                                              │
│  window.fetch = (url, init) => {                                           │
│    if (url.includes('/api/generate-images')) {                            │
│      ┌────────────────────────────────────────────┐                        │
│      │ Request Body:                              │                        │
│      │ {                                          │                        │
│      │   useSystemPrompt: true,                   │                        │
│      │   concept: "Diwali festival...",          │                        │
│      │   imageStyle: "Realistic photography",    │                        │
│      │   aspectRatio: "3:4",                     │                        │
│      │   count: 4                                 │                        │
│      │ }                                          │                        │
│      └────────────────────────────────────────────┘                        │
│                                                                              │
│      Pass to → mockAPIHandler.handleGenerateImages(body)                   │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    ↓
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    IMAGE GENERATION SERVICE                                 │
│                    (imageGenerationService.ts)                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ Step 1: Validate Inputs                                      │          │
│  │   ✓ concept exists (for system prompt mode)                 │          │
│  │   ✓ customPrompt exists (for custom mode)                   │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                         ↓                                                    │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ Step 2: Build Final Prompt                                   │          │
│  │                                                               │          │
│  │ if (useSystemPrompt === true) {                             │          │
│  │                                                               │          │
│  │   SYSTEM_PROMPT_TEMPLATE                                     │          │
│  │     .replace('{IMAGE_STYLE}', "Realistic photography")      │          │
│  │     .replace('{ASPECT_RATIO}', "3:4")                       │          │
│  │     .replace('{TEXT_INPUT}', "Diwali festival...")          │          │
│  │                                                               │          │
│  │   Result:                                                     │          │
│  │   "Generate a high-quality image...                          │          │
│  │    4. Image Style: Realistic photography                     │          │
│  │    6. Aspect ratio: 3:4                                      │          │
│  │    Input Text: Diwali festival with diyas and lights"       │          │
│  │ }                                                             │          │
│  │                                                               │          │
│  │ else {                                                        │          │
│  │   finalPrompt = customPrompt                                 │          │
│  │ }                                                             │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                         ↓                                                    │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ Step 3: Generate Images                                      │          │
│  │                                                               │          │
│  │ MOCK MODE (current):                                         │          │
│  │   generateMockImages() → Returns Unsplash URLs              │          │
│  │                                                               │          │
│  │ PRODUCTION MODE (when ready):                                │          │
│  │   generateWithOpenAI() → Calls DALL-E 3                     │          │
│  │   OR                                                          │          │
│  │   generateWithGemini() → Calls Imagen                       │          │
│  │   OR                                                          │          │
│  │   generateWithStabilityAI() → Calls Stable Diffusion        │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    ↓
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MOCK IMAGE GENERATOR                               │
│                          (Development Only)                                 │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ Keyword Detection:                                            │          │
│  │   if (prompt.includes('diwali')) → Use festival pool        │          │
│  │   if (prompt.includes('morning')) → Use morning pool        │          │
│  │   if (prompt.includes('birthday')) → Use birthday pool      │          │
│  │   else → Use default pool                                    │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                         ↓                                                    │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ Return Images:                                                │          │
│  │ [                                                             │          │
│  │   {                                                           │          │
│  │     id: "gen_1737559200_0",                                  │          │
│  │     url: "https://images.unsplash.com/photo-xxx?w=1080...", │          │
│  │     prompt: "Generate a high-quality...",                    │          │
│  │     thumbnail: "https://images.unsplash.com/..."            │          │
│  │   },                                                          │          │
│  │   ... (3 more images)                                        │          │
│  │ ]                                                             │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    ↓ return Response
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOCK API INTERCEPTOR                                │
│                                                                              │
│  return new Response(JSON.stringify({                                       │
│    success: true,                                                           │
│    images: [...],                                                           │
│    promptUsed: "...",                                                       │
│    concept: "Diwali festival..."                                           │
│  }), {                                                                      │
│    status: 200,                                                             │
│    headers: { 'Content-Type': 'application/json' }                         │
│  })                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                                    ↓ response.json()
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER INTERFACE                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  Generated Images (4)                                              │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                 │   │
│  │  │ ┌────┐ │  │ ┌────┐ │  │ ┌────┐ │  │ ┌────┐ │                 │   │
│  │  │ │Img │ │  │ │Img │ │  │ │Img │ │  │ │Img │ │                 │   │
│  │  │ │ 1  │ │  │ │ 2  │ │  │ │ 3  │ │  │ │ 4  │ │                 │   │
│  │  │ └────┘ │  │ └────┘ │  │ └────┘ │  │ └────┘ │                 │   │
│  │  │  [✓]   │  │        │  │        │  │        │                 │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘                 │   │
│  │                                                                     │   │
│  │  [ Proceed to Template Designer ]  ← USER SELECTS IMAGE & CLICKS │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  → Navigates to Designer with selected image                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Production AI Flow (When Implemented)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REAL BACKEND SERVER                              │
│                        (Express / Next.js / Lambda)                         │
│                                                                              │
│  POST /api/generate-images                                                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ 1. Receive Request                                            │          │
│  │    { useSystemPrompt, concept, imageStyle, ... }            │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                         ↓                                                    │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ 2. Build Prompt (same logic as service layer)               │          │
│  │    finalPrompt = SYSTEM_PROMPT_TEMPLATE                      │          │
│  │      .replace('{IMAGE_STYLE}', imageStyle)                  │          │
│  │      .replace('{ASPECT_RATIO}', aspectRatio)                │          │
│  │      .replace('{TEXT_INPUT}', concept)                      │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                         ↓                                                    │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ 3. Call AI Provider API                                      │          │
│  │                                                               │          │
│  │    Option A: OpenAI DALL-E 3                                │          │
│  │    ┌────────────────────────────────────────────┐           │          │
│  │    │ const openai = new OpenAI({                │           │          │
│  │    │   apiKey: process.env.OPENAI_API_KEY       │           │          │
│  │    │ });                                         │           │          │
│  │    │                                             │           │          │
│  │    │ const response = await openai.images.generate({ │     │          │
│  │    │   model: "dall-e-3",                       │           │          │
│  │    │   prompt: finalPrompt,                     │           │          │
│  │    │   size: "1024x1024",                       │           │          │
│  │    │   quality: "hd"                            │           │          │
│  │    │ });                                         │           │          │
│  │    └────────────────────────────────────────────┘           │          │
│  │                                                               │          │
│  │    Option B: Google Gemini                                  │          │
│  │    ┌────────────────────────────────────────────┐           │          │
│  │    │ const genAI = new GoogleGenerativeAI(      │           │          │
│  │    │   process.env.GOOGLE_API_KEY               │           │          │
│  │    │ );                                          │           │          │
│  │    │                                             │           │          │
│  │    │ const model = genAI.getGenerativeModel({  │           │          │
│  │    │   model: "imagen-2"                        │           │          │
│  │    │ });                                         │           │          │
│  │    │                                             │           │          │
│  │    │ const result = await model.generateImage({ │          │          │
│  │    │   prompt: finalPrompt,                     │           │          │
│  │    │   aspectRatio: "3:4"                       │           │          │
│  │    │ });                                         │           │          │
│  │    └────────────────────────────────────────────┘           │          │
│  │                                                               │          │
│  │    Option C: Stability AI                                   │          │
│  │    ┌────────────────────────────────────────────┐           │          │
│  │    │ const response = await fetch(              │           │          │
│  │    │   'https://api.stability.ai/v1/...',      │           │          │
│  │    │   {                                         │           │          │
│  │    │     method: 'POST',                        │           │          │
│  │    │     headers: {                             │           │          │
│  │    │       'Authorization': `Bearer ${API_KEY}` │           │          │
│  │    │     },                                      │           │          │
│  │    │     body: JSON.stringify({                 │           │          │
│  │    │       text_prompts: [{ text: finalPrompt }], │        │          │
│  │    │       samples: 4                           │           │          │
│  │    │     })                                      │           │          │
│  │    │   }                                         │           │          │
│  │    │ );                                          │           │          │
│  │    └────────────────────────────────────────────┘           │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                         ↓                                                    │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ 4. Upload to CDN/Storage (Optional but Recommended)          │          │
│  │                                                               │          │
│  │    // AI returns temporary URLs                              │          │
│  │    const tempUrl = response.data[0].url;                     │          │
│  │                                                               │          │
│  │    // Upload to permanent storage                            │          │
│  │    const cdnUrl = await uploadToS3(tempUrl);                │          │
│  │    // OR                                                      │          │
│  │    const cdnUrl = await uploadToCloudinary(tempUrl);        │          │
│  │                                                               │          │
│  │    // Return permanent URL                                   │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                         ↓                                                    │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ 5. Return Response to Frontend                               │          │
│  │                                                               │          │
│  │    res.json({                                                │          │
│  │      success: true,                                          │          │
│  │      images: [                                               │          │
│  │        {                                                     │          │
│  │          id: "img_xxx",                                     │          │
│  │          url: "https://cdn.yoursite.com/...",              │          │
│  │          prompt: finalPrompt,                               │          │
│  │          thumbnail: "https://cdn.yoursite.com/thumb-..."   │          │
│  │        },                                                    │          │
│  │        ...                                                   │          │
│  │      ],                                                      │          │
│  │      promptUsed: finalPrompt,                               │          │
│  │      concept: concept                                        │          │
│  │    });                                                       │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## State Management Flow

```
Component State:
┌─────────────────────────────────────────────────────┐
│ const [concept, setConcept] = useState('')         │
│ const [imageStyle, setImageStyle] = useState('...')│
│ const [aspectRatio, setAspectRatio] = useState('3:4')│
│ const [useSystemPrompt, setUseSystemPrompt] = useState(true)│
│ const [imageCount, setImageCount] = useState(4)    │
│ const [isGenerating, setIsGenerating] = useState(false)│
│ const [generatedImages, setGeneratedImages] = useState([])│
│ const [selectedImage, setSelectedImage] = useState(null)│
└─────────────────────────────────────────────────────┘

Lifecycle:
1. User types → setConcept("...")
2. User selects → setImageStyle("...")
3. User clicks Generate → setIsGenerating(true)
4. API call completes → setGeneratedImages([...])
5. User selects image → setSelectedImage(url)
6. User clicks Proceed → onImageSelect(selectedImage, concept)
7. Navigate to Designer
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────┐
│ Frontend Validation:                                │
│   if (!concept && useSystemPrompt) {               │
│     setError('Please enter a concept')             │
│     return                                          │
│   }                                                 │
└─────────────────────────────────────────────────────┘
                    ↓ (if valid)
┌─────────────────────────────────────────────────────┐
│ API Call:                                           │
│   try {                                             │
│     const response = await fetch(...)              │
│     if (!response.ok) throw new Error()            │
│     const data = await response.json()             │
│     setGeneratedImages(data.images)                │
│   } catch (err) {                                  │
│     setError(err.message)  ← Display to user      │
│   } finally {                                       │
│     setIsGenerating(false)  ← Re-enable button    │
│   }                                                 │
└─────────────────────────────────────────────────────┘
```

---

## Key Points

1. **Separation of Concerns:**
   - Frontend: UI and state management
   - Service Layer: Prompt building logic
   - Backend: AI API calls and image storage

2. **Prompt Control:**
   - System prompt template stored in backend
   - Variables injected server-side
   - Frontend only sends raw user inputs

3. **Mock vs Production:**
   - Mock: Intercepts fetch(), returns Unsplash
   - Production: Real backend, real AI API

4. **Image Flow:**
   - Generate → Display Grid → Select → Proceed to Designer

5. **Cost Control:**
   - User selects count (1-6)
   - Backend can add rate limiting
   - Consider caching similar prompts
