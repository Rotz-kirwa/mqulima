export type UploadCategory =
  | "profiles"
  | "diagnoses"
  | "marketplace"
  | "community"
  | "products";

export interface PresignedUploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  category: UploadCategory;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedExtension?: string;
}

export interface StorageConfig {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  cdnPublicUrl: string;
}
