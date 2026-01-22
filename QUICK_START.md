# ⚡ QUICK REFERENCE: Switching Modes

## 🎯 Current State
**✅ MOCK MODE ACTIVE**
- Using Unsplash sample images
- No API keys needed
- Fast testing (3 second delay)

## 🚀 To Switch to Real AI

### Step 1: Edit `.env` file

#### For OpenAI (Best Quality)
```env
VITE_USE_MOCK_API=false
VITE_AI_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-proj-your-key-here
```

#### For Gemini (Balanced)
```env
VITE_USE_MOCK_API=false
VITE_AI_PROVIDER=gemini
VITE_GOOGLE_API_KEY=your-key-here
```

#### For Stability AI (Cheapest)
```env
VITE_USE_MOCK_API=false
VITE_AI_PROVIDER=stability
VITE_STABILITY_API_KEY=sk-your-key-here
```

### Step 2: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 3: Generate!
- Open app
- Enter concept
- Click "Generate Images"
- Wait for real AI (30-60 seconds)
- Enjoy! 🎉

## 🔙 Switch Back to Mock
```env
VITE_USE_MOCK_API=true
```
Then restart server.

---

## 📊 Provider Comparison

| Provider   | Cost/Image | Quality | Speed |
|------------|-----------|---------|-------|
| OpenAI     | $0.08     | ⭐⭐⭐⭐⭐ | Slow  |
| Gemini     | $0.03     | ⭐⭐⭐⭐   | Medium|
| Stability  | $0.004    | ⭐⭐⭐    | Fast  |

---

## 🔑 Get API Keys

- **OpenAI:** https://platform.openai.com/api-keys
- **Gemini:** https://makersuite.google.com/app/apikey
- **Stability:** https://platform.stability.ai/account/keys

---

## 🐛 Troubleshooting

**Not generating?**
1. Check .env file exists
2. Verify API key is correct
3. Restart dev server
4. Check browser console for errors

**Still seeing mock images?**
1. Confirm `VITE_USE_MOCK_API=false`
2. Confirm API key starts with `VITE_`
3. Restart server

---

## 📁 Files Changed

**New Files:**
- `/src/services/aiService.ts` - Main service
- `/src/services/apiInterceptor.ts` - Request handler
- `/src/services/providers/openai.ts` - OpenAI integration
- `/src/services/providers/gemini.ts` - Gemini integration
- `/src/services/providers/stabilityai.ts` - Stability integration
- `/.env` - Your configuration
- `/.env.example` - Template

**Modified Files:**
- `/src/app/App.tsx` - Updated import
- `/src/services/mockAPI.ts` - Updated routing

---

## ✅ Testing Checklist

- [ ] Test mock mode still works
- [ ] Get API key from chosen provider
- [ ] Update .env file
- [ ] Restart server
- [ ] Test real AI generation
- [ ] Check console logs
- [ ] Verify images are AI-generated
- [ ] Monitor API costs

---

## 📚 Full Documentation

- **Complete Guide:** `/SETUP_GUIDE.md`
- **Changes Summary:** `/CHANGES_MADE.md`
- **API Implementation:** `/API_IMPLEMENTATION_GUIDE.md`
- **Quick API Reference:** `/QUICK_API_REFERENCE.md`

---

## 💡 Pro Tips

1. **Start with Mock** - Test everything first
2. **Try OpenAI** - Best quality to start
3. **Monitor Costs** - Check provider dashboard
4. **Use Custom Prompts** - Toggle off for full control
5. **Download Images** - Hover over generated images

---

**Last Updated:** January 22, 2026
