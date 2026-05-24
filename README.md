# VoiceDigest

A modern, full-stack web application that utilizes Google's Gemini 2.5 Flash API to transcribe, summarize, and extract actionable items from voice notes. 

Built with Next.js 14, Tailwind CSS, and the Web Audio API.

## Features
- **Record & Upload:** Native browser microphone recording or file upload (up to 20MB).
- **Multi-lingual:** Supports English, Urdu, and Hindi natively.
- **AI Processing:** Generates full transcripts, concise summaries, and bulleted action items.
- **Developer UI:** Styled with a deep slate/obsidian dark mode, accented with neon teal and purple.

## Getting Started

### 1. Get a Free Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **"Get API key"** in the left sidebar.
4. Click **"Create API key"** and copy the generated string.

### 2. Set Up Environment Variables
Rename `.env.example` to `.env.local` and paste your API key:
\`\`\`env
GEMINI_API_KEY=your_copied_api_key_here
\`\`\`

### 3. Run Locally
Install dependencies and start the development server:
\`\`\`bash
npm install
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) in your browser.

## One-Click Deployment to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and log in.
3. Click **"Add New..."** -> **"Project"**.
4. Import your newly created GitHub repository.
5. In the **Environment Variables** section during setup:
   - Name: `GEMINI_API_KEY`
   - Value: `[Paste your API key here]`
6. Click **Deploy**.

*Note: You can always update environment variables later in Vercel by navigating to your Project Settings > Environment Variables, adding the key, and triggering a new deployment.*