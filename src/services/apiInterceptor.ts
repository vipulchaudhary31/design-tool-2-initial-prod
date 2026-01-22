/**
 * API Interceptor Service
 * 
 * This intercepts frontend API calls and routes them to the appropriate handler.
 * - In MOCK mode: Uses mock data (no real AI calls)
 * - In REAL mode: Makes actual AI API calls through the unified service
 * 
 * Configuration is done via .env:
 * - VITE_USE_MOCK_API=true (for mock mode)
 * - VITE_USE_MOCK_API=false (for real AI calls)
 * - VITE_AI_PROVIDER=openai|gemini|stability (choose your provider)
 */

import { apiHandler } from './aiService';

/**
 * Intercept fetch calls to /api/* and handle them
 */
const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  // Handle /api/generate-images endpoint
  if (url.includes('/api/generate-images')) {
    try {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      
      console.log('🌐 API Request received:', {
        endpoint: '/api/generate-images',
        useSystemPrompt: body.useSystemPrompt,
        count: body.count,
      });
      
      const result = await apiHandler.handleGenerateImages(body);

      console.log('✅ API Response:', {
        success: result.success,
        imageCount: result.images?.length,
        provider: result.provider,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('❌ API Error:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // For all other requests, use original fetch
  return originalFetch(input, init);
};

export {}; // Make this a module
