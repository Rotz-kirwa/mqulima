import crypto from "node:crypto";
import type { PresignedUploadRequest, FileValidationResult } from "./storage.types";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const DISALLOWED_EXTENSIONS = new Set([
  "exe", "sh", "bat", "php", "js", "html", "htm", "py", "pl", "dll", "cmd", "vbs", "ps1", "cgi", "jar"
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

export class FileValidationService {
  static validateUploadRequest(request: PresignedUploadRequest): FileValidationResult {
    const { fileName, fileType, fileSize } = request;

    if (!fileType || !ALLOWED_MIME_TYPES.has(fileType.toLowerCase())) {
      return {
        valid: false,
        error: `Invalid file type '${fileType}'. Only JPEG, PNG, WEBP, and GIF images are allowed.`,
      };
    }

    if (!fileSize || fileSize <= 0) {
      return {
        valid: false,
        error: "File size must be greater than 0 bytes.",
      };
    }

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB.`,
      };
    }

    const rawExt = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() || "" : "";
    if (DISALLOWED_EXTENSIONS.has(rawExt)) {
      return {
        valid: false,
        error: `Security Alert: Executable file extensions (.${rawExt}) are strictly forbidden.`,
      };
    }

    const sanitizedExtension = ALLOWED_EXTENSIONS[fileType.toLowerCase()] || "jpg";

    return {
      valid: true,
      sanitizedExtension,
    };
  }

  static generateSecureObjectKey(category: string, extension: string): string {
    const randomUuid = crypto.randomUUID();
    const datePrefix = new Date().toISOString().slice(0, 10);
    return `uploads/${category}/${datePrefix}/${randomUuid}.${extension}`;
  }
}
