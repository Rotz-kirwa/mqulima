import { describe, it, expect } from "vitest";
import { FileValidationService } from "../src/services/storage/validation.service";

describe("Storage Upload & Presigned URL Validation", () => {
  it("should accept valid image MIME types", () => {
    const validJpg = FileValidationService.validateUploadRequest({
      fileName: "farm_harvest.jpg",
      fileType: "image/jpeg",
      fileSize: 1024 * 1024,
      category: "marketplace",
    });
    expect(validJpg.valid).toBe(true);
    expect(validJpg.sanitizedExtension).toBe("jpg");

    const validPng = FileValidationService.validateUploadRequest({
      fileName: "crop_disease.png",
      fileType: "image/png",
      fileSize: 500 * 1024,
      category: "diagnoses",
    });
    expect(validPng.valid).toBe(true);
    expect(validPng.sanitizedExtension).toBe("png");
  });

  it("should reject disallowed extensions and unapproved MIME types", () => {
    const maliciousExe = FileValidationService.validateUploadRequest({
      fileName: "malware.exe",
      fileType: "application/x-msdownload",
      fileSize: 1024,
      category: "community",
    });
    expect(maliciousExe.valid).toBe(false);
    expect(maliciousExe.error).toContain("Invalid file type");

    const phpFile = FileValidationService.validateUploadRequest({
      fileName: "script.php",
      fileType: "image/jpeg", // Spoofed mime
      fileSize: 1024,
      category: "community",
    });
    expect(phpFile.valid).toBe(false);
    expect(phpFile.error).toContain("forbidden");
  });

  it("should reject files exceeding max file size limit (10MB)", () => {
    const oversizedFile = FileValidationService.validateUploadRequest({
      fileName: "huge_photo.jpg",
      fileType: "image/jpeg",
      fileSize: 15 * 1024 * 1024, // 15MB
      category: "products",
    });
    expect(oversizedFile.valid).toBe(false);
    expect(oversizedFile.error).toContain("exceeds maximum allowed limit");
  });

  it("should generate secure, unpredictable object keys using UUIDs", () => {
    const key1 = FileValidationService.generateSecureObjectKey("products", "jpg");
    const key2 = FileValidationService.generateSecureObjectKey("products", "jpg");

    expect(key1).toContain("uploads/products/");
    expect(key1).not.toBe(key2);
    expect(key1).toMatch(/uploads\/products\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+.jpg/);
  });
});
