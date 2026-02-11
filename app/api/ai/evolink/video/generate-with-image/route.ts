import { NextRequest, NextResponse } from 'next/server';
import { evolinkAxios } from '@/lib/axios-config';
import { log, logError } from '@/lib/logger';
import { auth } from '@/auth';
import { newStorage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { code: 401, message: '未登录' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const prompt = formData.get('prompt') as string;
    const duration = parseInt(formData.get('duration') as string) || 8;
    const resolution = (formData.get('resolution') as string) || '720p';
    const aspectRatio = (formData.get('aspectRatio') as string) || '16:9';
    const enableAudio = formData.get('enableAudio') === 'true';

    log('[Evolink Video Generate With Image] 收到请求:', {
      user: session.user.email,
      prompt,
      duration,
      resolution,
      aspectRatio,
      hasImage: !!imageFile,
      imageSize: imageFile?.size,
      enableAudio
    });

    if (!prompt) {
      return NextResponse.json(
        { code: 400, message: '缺少 prompt 参数' },
        { status: 400 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { code: 400, message: '缺少图片文件' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { code: 400, message: '不支持的图片格式，仅支持 JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { code: 400, message: '图片大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // Upload image to R2
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storage = newStorage();
    const now = new Date();
    const datePrefix = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const ext = imageFile.type.split('/')[1] || 'png';
    const key = `uploads/video-images/${datePrefix}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const uploadResult = await storage.uploadFile({
      body: buffer,
      key,
      contentType: imageFile.type,
      disposition: 'inline'
    });

    log('[Evolink Video Generate With Image] 图片上传成功:', uploadResult.url);

    // Call Evolink Video API
    const requestBody: Record<string, any> = {
      model: 'veo3.1-fast',
      prompt,
      duration,
      resolution,
      aspect_ratio: aspectRatio,
      enable_audio: enableAudio,
      image_urls: [uploadResult.url]
    };

    log('[Evolink Video Generate With Image] 调用 Evolink API:', requestBody);

    const response = await evolinkAxios.post('/v1/videos/generations', requestBody);

    log('[Evolink Video Generate With Image] 响应:', response.data);

    const taskId = response.data?.id || response.data?.task_id;

    if (!taskId) {
      logError('[Evolink Video Generate With Image] 未获取到 taskId:', response.data);
      return NextResponse.json(
        { code: 500, message: '创建任务失败，未获取到任务ID' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: 1000,
      message: 'success',
      data: {
        taskId,
        imageUrl: uploadResult.url
      }
    });
  } catch (error: any) {
    logError('[Evolink Video Generate With Image] 错误:', error);
    const errorData = error.response?.data?.error || {};
    return NextResponse.json(
      {
        code: error.response?.status || 500,
        message: errorData.message || error.message || '视频生成失败',
        error: errorData
      },
      { status: error.response?.status || 500 }
    );
  }
}
