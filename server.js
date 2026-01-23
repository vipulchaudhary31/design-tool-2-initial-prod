/**
 * Express Backend Server for AI Image Generation
 * 
 * Supports multiple AI providers:
 * - OpenAI DALL-E 3 / DALL-E 2
 * - Google Gemini Imagen
 * 
 * Configure via .env: AI_PROVIDER=openai|gemini
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
}));
app.use(express.json());

// ============================================================================
// CONFIGURATION
// ============================================================================

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'dall-e-3'; // dall-e-3 or dall-e-2
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'imagen-3.0-generate-002';

console.log('🤖 AI Provider Configuration:', {
    provider: AI_PROVIDER,
    openaiModel: OPENAI_MODEL,
    geminiModel: GEMINI_MODEL,
});

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
function buildPromptFromTemplate(concept, imageStyle, aspectRatio) {
    return SYSTEM_PROMPT_TEMPLATE
        .replace('{IMAGE_STYLE}', imageStyle)
        .replace('{ASPECT_RATIO}', aspectRatio)
        .replace('{TEXT_INPUT}', concept);
}

// ============================================================================
// OPENAI PROVIDER
// ============================================================================

async function generateWithOpenAI(prompt, aspectRatio, count) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured.');
    }

    // DALL-E 3 sizes: 1024x1024, 1792x1024, 1024x1792
    // DALL-E 2 sizes: 256x256, 512x512, 1024x1024
    let size;
    if (OPENAI_MODEL === 'dall-e-3') {
        size = aspectRatio === '9:16' ? '1024x1792' : '1024x1792';
    } else {
        size = '1024x1024'; // DALL-E 2 only supports square
    }

    console.log(`🎨 Generating with OpenAI ${OPENAI_MODEL}:`, {
        prompt: prompt.substring(0, 80) + '...',
        size,
        count,
    });

    // DALL-E 3 can only generate 1 image per request, DALL-E 2 can do up to 10
    const batchSize = OPENAI_MODEL === 'dall-e-3' ? 1 : Math.min(count, 10);
    const batches = OPENAI_MODEL === 'dall-e-3' ? count : 1;

    const allImages = [];

    for (let batch = 0; batch < batches; batch++) {
        const n = OPENAI_MODEL === 'dall-e-3' ? 1 : batchSize;

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                prompt: prompt,
                n: n,
                size: size,
                ...(OPENAI_MODEL === 'dall-e-3' && { quality: 'hd', style: 'vivid' }),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        data.data.forEach((img, i) => {
            allImages.push({
                id: `openai_${Date.now()}_${batch}_${i}`,
                url: img.url,
                prompt: prompt,
                thumbnail: img.url,
            });
        });
    }

    return allImages.slice(0, count);
}

// ============================================================================
// GEMINI (IMAGEN) PROVIDER
// ============================================================================

async function generateWithGemini(prompt, aspectRatio, count) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured.');
    }

    // Gemini Imagen aspect ratios: "1:1", "3:4", "4:3", "9:16", "16:9"
    const geminiAspectRatio = aspectRatio === '9:16' ? '9:16' : '3:4';

    console.log(`🎨 Generating with Gemini ${GEMINI_MODEL}:`, {
        prompt: prompt.substring(0, 80) + '...',
        aspectRatio: geminiAspectRatio,
        count,
    });

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:predict?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: {
                    sampleCount: Math.min(count, 4), // Imagen supports up to 4
                    aspectRatio: geminiAspectRatio,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API Error: ${error.error?.message || JSON.stringify(error)}`);
    }

    const data = await response.json();

    // Gemini returns base64 encoded images
    const images = (data.predictions || []).map((prediction, i) => {
        // Convert base64 to data URL
        const base64Image = prediction.bytesBase64Encoded;
        const mimeType = prediction.mimeType || 'image/png';
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        return {
            id: `gemini_${Date.now()}_${i}`,
            url: dataUrl,
            prompt: prompt,
            thumbnail: dataUrl,
        };
    });

    return images;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/generate-images
 */
app.post('/api/generate-images', async (req, res) => {
    const {
        concept = '',
        customPrompt = '',
        imageStyle = 'Realistic photography',
        aspectRatio = '3:4',
        count = 4,
        useSystemPrompt = true,
    } = req.body;

    // Validate inputs
    if (useSystemPrompt && !concept.trim()) {
        return res.status(400).json({
            success: false,
            error: 'Concept is required when using system prompt.',
        });
    }

    if (!useSystemPrompt && !customPrompt.trim()) {
        return res.status(400).json({
            success: false,
            error: 'Custom prompt is required when system prompt is disabled.',
        });
    }

    // Build the final prompt
    let finalPrompt;
    if (useSystemPrompt) {
        finalPrompt = buildPromptFromTemplate(concept, imageStyle, aspectRatio);
    } else {
        finalPrompt = customPrompt;
    }

    try {
        let images;

        switch (AI_PROVIDER) {
            case 'openai':
                images = await generateWithOpenAI(finalPrompt, aspectRatio, count);
                break;

            case 'gemini':
                images = await generateWithGemini(finalPrompt, aspectRatio, count);
                break;

            default:
                throw new Error(`Unknown AI provider: ${AI_PROVIDER}. Use 'openai' or 'gemini'.`);
        }

        console.log(`✅ ${AI_PROVIDER} generation complete:`, images.length, 'images');

        res.json({
            success: true,
            images,
            promptUsed: finalPrompt,
            provider: AI_PROVIDER,
        });
    } catch (error) {
        console.error(`❌ ${AI_PROVIDER} generation failed:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate images',
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        provider: AI_PROVIDER,
        openaiModel: OPENAI_MODEL,
        geminiModel: GEMINI_MODEL,
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Image generation server running on http://localhost:${PORT}`);
    console.log(`📦 Using provider: ${AI_PROVIDER}`);
});
