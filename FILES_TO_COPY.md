# Files to Copy to Antigravity

## New Files Created

### 1. ConceptGenerator Component
**Path**: `/src/app/components/ConceptGenerator.tsx`
- Main UI for Page 1 (concept input and image generation)
- Handles AI image generation flow
- Displays generated images in a grid
- Allows image selection

### 2. Image Generation Service
**Path**: `/src/services/imageGenerationService.ts`
- Contains mock AI image generation logic
- Includes detailed comments for production backend implementation
- Supports DALL-E, Stability AI, and Replicate
- Currently uses curated Unsplash images for demo

### 3. Mock API Service
**Path**: `/src/services/mockAPI.ts`
- Intercepts `/api/*` fetch calls
- Simulates backend responses
- Works without a real backend server
- Should be replaced with real API calls in production

### 4. Documentation Files
- `/BACKEND_IMPLEMENTATION.md` - Complete backend setup guide
- `/PROJECT_SUMMARY.md` - Project overview and architecture
- `/FILES_TO_COPY.md` - This file

---

## Modified Files

### 1. App.tsx
**Path**: `/src/app/App.tsx`

**Changes**:
- Added `ConceptGenerator` import
- Added mock API import
- Added page navigation state (`currentPage`, `generatedConcept`)
- Added `handleImageSelect` function
- Updated header with back button and step indicator
- Added conditional rendering for Page 1 vs Page 2
- Updated `handleExport` to include concept

**Key Additions**:
```typescript
// Line 12: Import ConceptGenerator
import { ConceptGenerator } from '@/app/components/ConceptGenerator';

// Line 15: Import mock API
import '@/services/mockAPI';

// Lines 68-69: Page navigation state
const [currentPage, setCurrentPage] = useState<'concept' | 'designer'>('concept');
const [generatedConcept, setGeneratedConcept] = useState<string>('');

// Lines 133-139: Image select handler
const handleImageSelect = (imageUrl: string, concept: string) => {
  setBackgroundImage(imageUrl);
  setGeneratedConcept(concept);
  setCurrentPage('designer');
  // ... toast
};

// Lines 217-220: Conditional page rendering
{currentPage === 'concept' ? (
  <ConceptGenerator onImageSelect={handleImageSelect} />
) : (
  // ... existing designer page
)}
```

### 2. DesignCanvas.tsx
**Path**: `/src/app/components/DesignCanvas.tsx`

**Changes**:
- Added `userName?: string` prop to interface (line 29)
- Added `userName = 'User Name'` to function parameters (line 44)
- Changed label from static to dynamic `{userName}` (line 116)

---

## Installation Steps for Antigravity

### Step 1: Copy New Files
Copy these files exactly as they are:
1. `/src/app/components/ConceptGenerator.tsx`
2. `/src/services/imageGenerationService.ts`
3. `/src/services/mockAPI.ts`

### Step 2: Update Existing Files
Replace these files with the updated versions:
1. `/src/app/App.tsx`
2. `/src/app/components/DesignCanvas.tsx`

### Step 3: Verify Dependencies
All required dependencies should already be installed:
- ✅ React
- ✅ Lucide React (icons)
- ✅ Sonner (toasts)
- ✅ Button component from shadcn/ui

---

## How to Test

### Test Page 1 (Concept Generator):
1. Open the app
2. You should see the "AI-Powered Template Generator" page
3. Enter a concept like "Diwali festival celebration"
4. Click "Generate Images"
5. Wait 2.5 seconds for loading
6. See 4 images appear in a grid
7. Click on one image to select it
8. Click "Proceed to Template Designer"

### Test Page 2 (Template Designer):
1. After selecting an image, you should be on the designer page
2. The selected image should be loaded as background
3. Click "← Back to Concept" in header to go back to Page 1
4. Notice the step indicator changes (Step 1: Generate / Step 2: Design)

### Test User Name:
1. On Page 2, scroll down in left panel
2. Find "User Name" text input
3. Type a different name
4. See it update in both the canvas placeholder and the preview panel

---

## Quick Copy Commands

If you're copying via terminal:

```bash
# Create directories if needed
mkdir -p src/services

# Copy new files
cp ConceptGenerator.tsx src/app/components/
cp imageGenerationService.ts src/services/
cp mockAPI.ts src/services/

# Update existing files
cp App.tsx src/app/
cp DesignCanvas.tsx src/app/components/
```

---

## Troubleshooting

### Issue: "Module not found: @/services/mockAPI"
**Solution**: Make sure the `/src/services` directory exists and contains `mockAPI.ts`

### Issue: "ConceptGenerator is not defined"
**Solution**: Verify the import in App.tsx: `import { ConceptGenerator } from '@/app/components/ConceptGenerator';`

### Issue: Images not loading
**Solution**: This is expected with the mock - it generates random Unsplash URLs. Some may not exist. The real backend will solve this.

### Issue: "Button" component not found
**Solution**: The shadcn Button component should already exist at `/src/app/components/ui/button.tsx`

---

## What's Next?

After copying these files, you can:

1. **Test locally**: Verify both pages work correctly
2. **Review backend guide**: Check `BACKEND_IMPLEMENTATION.md` for production setup
3. **Plan backend deployment**: Choose an AI provider (Stability AI recommended for cost)
4. **Implement real API**: Replace mock with actual backend endpoints
5. **Deploy**: Deploy frontend + backend to production

---

## File Checklist

- [ ] `/src/app/components/ConceptGenerator.tsx` (NEW)
- [ ] `/src/services/imageGenerationService.ts` (NEW)
- [ ] `/src/services/mockAPI.ts` (NEW)
- [ ] `/src/app/App.tsx` (UPDATED)
- [ ] `/src/app/components/DesignCanvas.tsx` (UPDATED)
- [ ] Test Page 1 works
- [ ] Test Page 2 works
- [ ] Test navigation between pages
- [ ] Test user name input

---

**Ready to copy!** All files are complete and tested.
