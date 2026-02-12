import { NextRequest, NextResponse } from 'next/server';
import { evolinkAxios } from '@/lib/axios-config';
import { log, logError } from '@/lib/logger';

const SYSTEM_PROMPT = `You are an expert AI image prompt engineer. Your task is to transform simple, brief descriptions into detailed, professional-quality image prompts that work exceptionally well with AI image generators like Midjourney, DALL-E, Stable Diffusion, and Flux.

When enhancing a prompt:
1. Expand the subject with specific details (appearance, pose, expression, clothing)
2. Add environment and setting descriptions
3. Include lighting conditions and atmosphere
4. Specify art style and medium
5. Add composition and camera angle suggestions
6. Include color palette and mood descriptors
7. Add quality modifiers (high resolution, detailed, professional, etc.)

Rules:
- Output ONLY the enhanced prompt, no explanations or prefixes
- Keep it as a single, flowing paragraph
- Be specific but not overly verbose (aim for 50-150 words)
- Maintain the original intent while adding creative details`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a prompt to enhance' },
        { status: 400 }
      );
    }

    log('[Text to Prompt - Magic Enhance] Request:', { promptLength: prompt.length });

    const response = await evolinkAxios.post('/v1/chat/completions', {
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Enhance this simple prompt into a detailed, professional AI image prompt:\n\n"${prompt}"`,
        },
      ],
      max_tokens: 512,
      temperature: 0.8,
    });

    const enhancedPrompt = response.data?.choices?.[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      logError('[Text to Prompt - Magic Enhance] No enhanced prompt generated');
      return NextResponse.json(
        { success: false, error: 'Failed to enhance prompt. Please try again.' },
        { status: 500 }
      );
    }

    log('[Text to Prompt - Magic Enhance] Success, enhanced length:', enhancedPrompt.length);

    return NextResponse.json({
      success: true,
      enhancedPrompt,
    });
  } catch (error: any) {
    logError('[Text to Prompt - Magic Enhance] Error:', error);
    return NextResponse.json(
      { success: false, error: error.response?.data?.error?.message || error.message || 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
