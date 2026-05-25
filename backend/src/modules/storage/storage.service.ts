import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType?: string;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('storage.bucket')!;
    this.publicBaseUrl = this.config.get<string>('storage.publicBaseUrl');
    this.s3 = new S3Client({
      region: this.config.get<string>('storage.region'),
      endpoint: this.config.get<string>('storage.endpoint'),
      forcePathStyle: !!this.config.get<boolean>('storage.forcePathStyle'),
      credentials: {
        accessKeyId: this.config.get<string>('storage.accessKeyId')!,
        secretAccessKey: this.config.get<string>('storage.secretAccessKey')!,
      },
    });
  }

  private buildKey(prefix: string, fileName?: string) {
    const safeName = (fileName ?? 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const datePart = new Date().toISOString().slice(0, 10);
    return `${prefix}/${datePart}/${randomUUID()}-${safeName}`;
  }

  async uploadBuffer(
    prefix: string,
    buffer: Buffer,
    opts: { fileName?: string; mimeType?: string } = {},
  ): Promise<UploadResult> {
    const key = this.buildKey(prefix, opts.fileName);
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: opts.mimeType,
      }),
    );
    return {
      key,
      url: this.publicUrl(key),
      size: buffer.length,
      mimeType: opts.mimeType,
    };
  }

  async deleteFile(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getSignedUrl(key: string, expiresIn = 3600) {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  publicUrl(key: string) {
    if (this.publicBaseUrl) return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    const endpoint = this.config.get<string>('storage.endpoint');
    if (endpoint) return `${endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    return `s3://${this.bucket}/${key}`;
  }
}
