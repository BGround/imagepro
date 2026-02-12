import { NextRequest, NextResponse } from 'next/server';
import { evolinkAxios } from '@/lib/axios-config';
import { log, logError } from '@/lib/logger';

const languageNames: Record<string, string> = {
  en: 'English',
  zh: 'Chinese (Simplified)',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  it: 'Italian',
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, targetLanguage } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a prompt to translate' },
        { status: 400 }
      );
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'Please specify a target language' },
        { status: 400 }
      );
    }

    const languageName = languageNames[targetLanguage] || targetLanguage;

    log('[Text to Prompt - Translate] Request:', {
      promptLength: prompt.length,
      targetLanguage: languageName,
    });

    const response = await evolinkAxios.post('/v1/chat/completions', {
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in AI image prompts. Translate the given prompt accurately while maintaining its artistic intent, style keywords, and technical terms that are commonly understood across languages.

Rules:
- Output ONLY the translated prompt, no explanations
- Preserve technical terms if they're universally used (like "4K", "HDR", etc.)
- Maintain the structure and flow of the original prompt
- Keep artistic and style references intact when possible`,
        },
        {
          role: 'user',
          content: `Translate this AI image prompt to ${languageName}:\n\n"${prompt}"`,
        },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    const translatedPrompt = response.data?.choices?.[0]?.message?.content?.trim();

    if (!translatedPrompt) {
      logError('[Text to Prompt - Translate] No translated prompt generated');
      return NextResponse.json(
        { success: false, error: 'Failed to translate prompt. Please try again.' },
        { status: 500 }
      );
    }

    log('[Text to Prompt - Translate] Success, translated length:', translatedPrompt.length);

    return NextResponse.json({
      success: true,
      translatedPrompt,
    });
  } catch (error: any) {
    logError('[Text to Prompt - Translate] Error:', error);
    return NextResponse.json(
      { success: false, error: error.response?.data?.error?.message || error.message || 'Failed to translate prompt' },
      { status: 500 }
    );
  }
}
