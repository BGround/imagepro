import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

interface StorageConfig {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
}

export function newStorage(config?: StorageConfig) {
  return new Storage(config);
}

export class Storage {
  private s3: S3Client;

  constructor(config?: StorageConfig) {
    this.s3 = new S3Client({
      endpoint: config?.endpoint || process.env.STORAGE_ENDPOINT || "",
      region: config?.region || process.env.STORAGE_REGION || "auto",
      credentials: {
        accessKeyId: config?.accessKey || process.env.STORAGE_ACCESS_KEY || "",
        secretAccessKey:
          config?.secretKey || process.env.STORAGE_SECRET_KEY || "",
      },
    });
  }

  async uploadFile({
    body,
    key,
    contentType,
    bucket,
    onProgress,
    disposition = "inline",
  }: {
    body: Buffer;
    key: string;
    contentType?: string;
    bucket?: string;
    onProgress?: (progress: number) => void;
    disposition?: "inline" | "attachment";
  }) {
    if (!bucket) {
      bucket = process.env.STORAGE_BUCKET || "";
    }

    if (!bucket) {
      throw new Error("Bucket is required");
    }

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentDisposition: disposition,
        ...(contentType && { ContentType: contentType }),
      },
    });

    if (onProgress) {
      upload.on("httpUploadProgress", (progress) => {
        const percentage =
          ((progress.loaded || 0) / (progress.total || 1)) * 100;
        onProgress(percentage);
      });
    }

    const res = await upload.done();

    return {
      location: res.Location,
      bucket: res.Bucket,
      key: res.Key,
      filename: res.Key?.split("/").pop(),
      url: process.env.STORAGE_DOMAIN
        ? `${process.env.STORAGE_DOMAIN}/${res.Key}`
        : res.Location,
    };
  }

  async downloadAndUpload({
    url,
    key,
    bucket,
    contentType,
    disposition = "inline",
    retries = 3,
  }: {
    url: string;
    key: string;
    bucket?: string;
    contentType?: string;
    disposition?: "inline" | "attachment";
    retries?: number;
  }) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No body in response");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return this.uploadFile({
          body: buffer,
          key,
          bucket,
          contentType,
          disposition,
        });
      } catch (error: any) {
        lastError = error;
        if (attempt < retries - 1) {
          // 等待后重试，递增延迟
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error("Download and upload failed after retries");
  }
}
