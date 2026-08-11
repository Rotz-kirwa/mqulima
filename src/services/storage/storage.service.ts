import { getServerConfig } from "../../lib/config.server";
import { FileValidationService } from "./validation.service";
import { S3SignerService } from "./s3-signer.service";
import type {
  PresignedUploadRequest,
  PresignedUploadResponse,
  StorageConfig,
} from "./storage.types";

export class StorageService {
  private static getStorageConfig(): StorageConfig {
    const env = getServerConfig();
    return {
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || "",
      accessKeyId: env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: env.S3_SECRET_ACCESS_KEY || "",
      cdnPublicUrl: env.CDN_PUBLIC_URL.replace(/\/$/, ""),
    };
  }

  static createPresignedUpload(request: PresignedUploadRequest): PresignedUploadResponse {
    const validation = FileValidationService.validateUploadRequest(request);
    if (!validation.valid || !validation.sanitizedExtension) {
      throw new Error(validation.error || "Invalid upload request.");
    }

    const config = this.getStorageConfig();
    const objectKey = FileValidationService.generateSecureObjectKey(
      request.category,
      validation.sanitizedExtension
    );

    const uploadUrl = S3SignerService.generatePresignedPutUrl(
      config,
      objectKey,
      request.fileType.toLowerCase(),
      900 // 15-minute expiration
    );

    const fileUrl = `${config.cdnPublicUrl}/${objectKey}`;

    return {
      uploadUrl,
      fileUrl,
      objectKey,
      expiresInSeconds: 900,
      headers: {
        "Content-Type": request.fileType.toLowerCase(),
      },
    };
  }

  static resolveCdnUrl(objectKeyOrUrl: string): string {
    if (!objectKeyOrUrl) return "";
    if (objectKeyOrUrl.startsWith("http://") || objectKeyOrUrl.startsWith("https://")) {
      return objectKeyOrUrl;
    }
    const config = this.getStorageConfig();
    const cleanKey = objectKeyOrUrl.replace(/^\//, "");
    return `${config.cdnPublicUrl}/${cleanKey}`;
  }
}
