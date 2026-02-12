import { NextRequest, NextResponse } from 'next/server';
import { evolinkAxios } from '@/lib/axios-config';
import { log, logError } from '@/lib/logger';

// Prompt templates for different AI models
const promptTemplates: Record<string, string> = {
  normal: `Analyze this image and generate a detailed, natural language description that could be used as a prompt for AI image generation. Include:
- Main subject and their actions/poses
- Environment, setting, and background elements
- Lighting conditions and atmosphere
- Colors and color palette
- Art style and aesthetic
- Composition and framing
- Notable details and textures

Output only the prompt text, without any explanations or prefixes.`,

  flux: `Analyze this image and create an optimized prompt for Flux AI image generation. Flux works best with:
- Clear, descriptive subject descriptions
- Specific art style references
- Detailed lighting and atmosphere descriptions
- Color palette specifications
- Quality modifiers like "high resolution", "detailed", "professional"

Format: A single, flowing paragraph describing all visual elements. Output only the prompt text.`,

  midjouney: `Analyze this image and create an optimized prompt for Midjourney. Use Midjourney's preferred style:
- Start with the main subject
- Include artistic style references
- Add technical parameters suggestions (--ar, --v, --style)
- Use descriptive adjectives
- Include lighting and mood keywords

Format the output as a Midjourney-style prompt. Do NOT include actual parameters, just suggest them in parentheses. Output only the prompt text.`,

  stableDiffusion: `Analyze this image and create an optimized prompt for Stable Diffusion. Include:
- Detailed subject description
- Style tags (e.g., photorealistic, digital art, oil painting)
- Quality tags (masterpiece, best quality, highly detailed)
- Lighting and color descriptions
- Negative prompt suggestions in parentheses if applicable

Use comma-separated tags style preferred by SD. Output only the prompt text.`,
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('img') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;
    const promptType = (formData.get('promptType') as string) || 'normal';
    const language = (formData.get('language') as string) || 'English';

    log('[Image to Prompt] Request received:', {
      hasFile: !!imageFile,
      fileSize: imageFile?.size,
      imageUrl: imageUrl ? 'provided' : 'none',
      promptType,
      language,
    });

    // Validate input
    if (!imageFile && !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'No image provided. Please upload an image or provide an image URL.' },
        { status: 400 }
      );
    }

    // Prepare image content - always use base64 (Gemini requires gs:// URLs, not https://)
    let imageContent: { type: 'image_url'; image_url: { url: string } };

    if (imageFile) {
      // Convert file to base64
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = imageFile.type || 'image/jpeg';

      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
        },
      };
    } else if (imageUrl) {
      // Download image and convert to base64 (Gemini doesn't support https:// URLs)
      log('[Image to Prompt] Downloading image from URL:', imageUrl);
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return NextResponse.json(
          { success: false, error: 'Failed to download image from URL' },
          { status: 400 }
        );
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:${contentType};base64,${base64}`,
        },
      };
      log('[Image to Prompt] Image downloaded and converted to base64');
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid image input' },
        { status: 400 }
      );
    }

    // Get the appropriate system prompt
    const systemPrompt = promptTemplates[promptType] || promptTemplates.normal;

    // Add language instruction
    const languageInstruction = language !== 'English'
      ? `\n\nIMPORTANT: Generate the prompt in ${language}.`
      : '';

    log('[Image to Prompt] Calling Evolink API with model: gemini-2.5-flash');

    const response = await evolinkAxios.post('/v1/chat/completions', {
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: systemPrompt + languageInstruction,
            },
            imageContent,
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const generatedPrompt = response.data?.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      logError('[Image to Prompt] No prompt generated');
      return NextResponse.json(
        { success: false, error: 'Failed to generate prompt. Please try again.' },
        { status: 500 }
      );
    }

    log('[Image to Prompt] Prompt generated successfully, length:', generatedPrompt.length);

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
    });
  } catch (error: any) {
    logError('[Image to Prompt] Error:', error);

    if (error?.response?.status === 429) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.response?.data?.error?.message || error.message || 'Failed to process image. Please try again.' },
      { status: 500 }
    );
  }
}
