import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { audioBase64, mimeType, language } = await req.json();

    if (!audioBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing audio data' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are a voice note summarizer. Given this audio recording, do three things. 
      Format the output in clean markdown using EXACTLY these three level 2 headings: "## Transcript", "## Summary", and "## Action Items".
      
      Under each heading:
      1. ## Transcript: Write the complete transcript of what was said
      2. ## Summary: Write a concise 3-5 sentence summary of the key points
      3. ## Action Items: List any tasks, follow-ups, or decisions mentioned as bullet points
      
      If the audio is in ${language}, respond in the same language.`
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType
        }
      },
      "Please process this audio note according to the system instructions."
    ]);

    const text = result.response.text();
    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process audio. Ensure the file is a valid audio format and your API key is correct.' 
    }, { status: 500 });
  }
}