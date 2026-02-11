import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { newStorage } from '@/lib/storage';
import { log, logError } from '@/lib/logger';

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
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { code: 400, message: '缺少图片文件' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { code: 400, message: '不支持的图片格式，仅支持 JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { code: 400, message: '图片大小不能超过 10MB' },
        { status: 400 }
      );
    }

    log('[Upload Image] 收到上传请求:', {
      user: session.user.email,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storage = newStorage();
    const now = new Date();
    const datePrefix = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const ext = file.type.split('/')[1] || 'png';
    const key = `uploads/images/${datePrefix}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const result = await storage.uploadFile({
      body: buffer,
      key,
      contentType: file.type,
      disposition: 'inline'
    });

    log('[Upload Image] 上传成功:', result.url);

    return NextResponse.json({
      code: 1000,
      message: 'success',
      data: {
        url: result.url,
        key: result.key
      }
    });
  } catch (error: any) {
    logError('[Upload Image] 上传失败:', error);
    return NextResponse.json(
      {
        code: 500,
        message: error.message || '上传失败'
      },
      { status: 500 }
    );
  }
}
