import { NextRequest, NextResponse } from 'next/server';
import { evolinkAxios } from '@/lib/axios-config';
import { log, logError } from '@/lib/logger';

const SYSTEM_PROMPT = `You are an expert AI image prompt editor. Your task is to modify existing image prompts according to user instructions while maintaining the overall structure and quality of the prompt.

When editing a prompt:
1. Apply the user's requested changes precisely
2. Maintain the original style and structure
3. Keep other unrelated elements intact
4. Ensure the result is still a well-formed AI image prompt

Rules:
- Output ONLY the edited prompt, no explanations or prefixes
- Keep it as a single, flowing paragraph
- Preserve the professional quality of the original`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, instruction } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a prompt to edit' },
        { status: 400 }
      );
    }

    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide edit instructions' },
        { status: 400 }
      );
    }

    log('[Text to Prompt - Edit] Request:', {
      promptLength: prompt.length,
      instructionLength: instruction.length,
    });

    const response = await evolinkAxios.post('/v1/chat/completions', {
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Original prompt:\n"${prompt}"\n\nEdit instruction:\n"${instruction}"\n\nApply the edit instruction and output the modified prompt:`,
        },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const editedPrompt = response.data?.choices?.[0]?.message?.content?.trim();

    if (!editedPrompt) {
      logError('[Text to Prompt - Edit] No edited prompt generated');
      return NextResponse.json(
        { success: false, error: 'Failed to edit prompt. Please try again.' },
        { status: 500 }
      );
    }

    log('[Text to Prompt - Edit] Success, edited length:', editedPrompt.length);

    return NextResponse.json({
      success: true,
      editedPrompt,
    });
  } catch (error: any) {
    logError('[Text to Prompt - Edit] Error:', error);
    return NextResponse.json(
      { success: false, error: error.response?.data?.error?.message || error.message || 'Failed to edit prompt' },
      { status: 500 }
    );
  }
}
