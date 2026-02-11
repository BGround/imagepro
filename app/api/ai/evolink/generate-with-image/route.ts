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
    const size = (formData.get('size') as string) || 'auto';
    const quality = (formData.get('quality') as string) || '2K';

    log('[Evolink Generate With Image] 收到请求:', {
      user: session.user.email,
      prompt,
      size,
      quality,
      hasImage: !!imageFile,
      imageSize: imageFile?.size
    });

    if (!prompt) {
      return NextResponse.json(
        { code: 400, message: '缺少 prompt 参数' },
        { status: 400 }
      );
    }

    let imageUrls: string[] = [];

    if (imageFile) {
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

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const storage = newStorage();
      const now = new Date();
      const datePrefix = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
      const ext = imageFile.type.split('/')[1] || 'png';
      const key = `uploads/images/${datePrefix}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const uploadResult = await storage.uploadFile({
        body: buffer,
        key,
        contentType: imageFile.type,
        disposition: 'inline'
      });

      log('[Evolink Generate With Image] 图片上传成功:', uploadResult.url);
      imageUrls = [uploadResult.url!];
    }

    const requestBody: Record<string, any> = {
      model: 'nano-banana-2-lite',
      prompt,
      size,
      quality
    };

    if (imageUrls.length > 0) {
      requestBody.image_urls = imageUrls;
    }

    log('[Evolink Generate With Image] 调用 Evolink API:', requestBody);

    const response = await evolinkAxios.post('/v1/images/generations', requestBody);

    log('[Evolink Generate With Image] 响应:', response.data);

    return NextResponse.json({
      code: 1000,
      message: 'success',
      data: response.data
    });
  } catch (error: any) {
    logError('[Evolink Generate With Image] 错误:', error);
    const errorData = error.response?.data?.error || {};
    return NextResponse.json(
      {
        code: error.response?.status || 500,
        message: errorData.message || error.message || '生成失败',
        error: errorData
      },
      { status: error.response?.status || 500 }
    );
  }
}
