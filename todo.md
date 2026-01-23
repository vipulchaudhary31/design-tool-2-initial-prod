1. create a small express backend for image generation via openAI instead of calling it directly from frontend
2. remove apiInterceptor and let conceptgenerator call backend directly. Also move all the logic of aiService and providers to backend 
3. Add authentication using google login to the website (use backend and frontend both for that)
4. Create a dockerfile to build and deploy both frontend and backend on a server