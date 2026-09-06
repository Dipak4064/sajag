import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';
import path from 'path';
import crypto from 'crypto';

export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.endpoint = process.env.RUSTFS_ENDPOINT || 'http://localhost:9000';
    this.bucket = process.env.RUSTFS_BUCKET || 'sajag-files';
    const accessKeyId = process.env.RUSTFS_ACCESS_KEY || 'rustfsadmin';
    const secretAccessKey = process.env.RUSTFS_SECRET_KEY || 'rustfsadmin';
    const region = process.env.RUSTFS_REGION || 'us-east-1';

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      forcePathStyle: true
    });

    this.initBucket();
  }

  private async initBucket() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      logger.info(`Connected to RustFS S3. Using bucket: '${this.bucket}'`);
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        try {
          await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
          logger.info(`Created bucket '${this.bucket}' on RustFS`);
        } catch (createErr: any) {
          logger.warn(`Failed to create bucket on RustFS: ${createErr.message}`);
        }
      } else {
        logger.warn(`RustFS bucket note: ${err.message}`);
      }
    }
  }

  /**
   * Upload a Multer file to RustFS S3
   */
  public async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general'
  ): Promise<{ key: string; url: string; originalName: string; size: number; mimeType: string }> {
    const ext = path.extname(file.originalname) || '';
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `${folder}/${Date.now()}-${safeName}-${uniqueId}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size
      })
    );

    const url = `/api/files/${key}`;
    logger.info(`Uploaded file to RustFS S3 [${this.bucket}]: ${key}`);

    return {
      key,
      url,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    };
  }

  /**
   * Upload raw Buffer to RustFS S3
   */
  public async uploadBuffer(
    buffer: Buffer,
    key: string,
    mimeType: string = 'application/octet-stream'
  ): Promise<{ key: string; url: string }> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentLength: buffer.length
      })
    );

    return {
      key,
      url: `/api/files/${key}`
    };
  }

  /**
   * Retrieve file stream from RustFS
   */
  public async getFileStream(key: string) {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    );
    return response;
  }

  /**
   * Generate pre-signed download URL
   */
  public async getPresignedDownloadUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });
    return await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Delete file from RustFS S3
   */
  public async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    );
    logger.info(`Deleted file from RustFS S3 [${this.bucket}]: ${key}`);
  }

  /**
   * List files under a prefix
   */
  public async listFiles(prefix?: string) {
    const response = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix
      })
    );
    return response.Contents || [];
  }
}

export const storageService = new StorageService();
