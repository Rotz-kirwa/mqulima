import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { authenticateRequest } from "./auth-helper";
import { getServerConfig } from "../config.server";
import { StorageService } from "../../services/storage/storage.service";
import type { UploadCategory } from "../../services/storage/storage.types";

const ALLOWED_IMAGE_MIMES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const COMMUNITY_MEDIA_DIR = path.resolve("public/images/community");
const JSON_CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonCors(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_CORS_HEADERS });
}

export async function handleUploadPresign(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Authentication required to upload files." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { fileName, fileType, fileSize, category = "community" } = body;

    if (!fileName || !fileType || !fileSize) {
      return new Response(
        JSON.stringify({ success: false, error: "fileName, fileType, and fileSize are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const presignedData = StorageService.createPresignedUpload({
      fileName,
      fileType,
      fileSize: Number(fileSize),
      category: category as UploadCategory,
    });

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl: presignedData.uploadUrl,
        fileUrl: presignedData.fileUrl,
        cdnUrl: presignedData.fileUrl,
        headers: presignedData.headers,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[API/V1/UPLOAD-PRESIGN ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to generate presigned upload URL." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleForumMediaUpload(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return jsonCors({ success: false, error: "Unauthorized. Please sign in to upload photos." }, 401);
  }

  try {
    const contentTypeHeader = request.headers.get("content-type") || "";
    let buffer: Buffer | null = null;
    let mimeType = "image/jpeg";
    let originalName = "farm-photo.jpg";

    if (contentTypeHeader.includes("multipart/form-data")) {
      const form = await request.formData();
      const entry = form.get("file") || form.get("image");
      if (!entry || typeof entry === "string") {
        return jsonCors({ success: false, error: "No image file provided." }, 400);
      }
      const ab = await entry.arrayBuffer();
      buffer = Buffer.from(ab);
      mimeType = (entry.type || "image/jpeg").toLowerCase();
      originalName = entry.name || "farm-photo.jpg";
    } else {
      const body = await request.json().catch(() => ({}));
      const raw = String(body.dataUri || body.base64 || "");
      const dataMatch = raw.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (dataMatch) {
        mimeType = dataMatch[1].toLowerCase();
        buffer = Buffer.from(dataMatch[2], "base64");
      } else if (raw) {
        mimeType = String(body.mimeType || body.fileType || "image/jpeg").toLowerCase();
        buffer = Buffer.from(raw, "base64");
      }
      originalName = String(body.fileName || "farm-photo.jpg");
    }

    if (!buffer || buffer.length === 0) {
      return jsonCors({ success: false, error: "Uploaded image is empty." }, 400);
    }

    if (buffer.length > MAX_UPLOAD_BYTES) {
      return jsonCors({ success: false, error: "Image must be smaller than 8 MB." }, 400);
    }

    const ext =
      ALLOWED_IMAGE_MIMES[mimeType] ||
      (originalName.toLowerCase().endsWith(".png")
        ? "png"
        : originalName.toLowerCase().endsWith(".webp")
          ? "webp"
          : "");
    const normalizedMime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    if (!ext) {
      return jsonCors({ success: false, error: "Only JPEG, PNG, and WebP images are supported." }, 400);
    }

    const env = getServerConfig();
    if (env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
      try {
        const presigned = StorageService.createPresignedUpload({
          fileName: originalName || `post.${ext}`,
          fileType: normalizedMime,
          fileSize: buffer.length,
          category: "community",
        });
        const putRes = await fetch(presigned.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": normalizedMime },
          body: new Uint8Array(buffer),
        });
        if (putRes.ok) {
          return jsonCors({ success: true, imageUrl: presigned.fileUrl, url: presigned.fileUrl }, 201);
        }
      } catch (s3Err) {
        console.warn("[API/V1/FORUM-UPLOAD] S3 upload fallback to local media dir:", s3Err);
      }
    }

    const filename = `post-${crypto.randomUUID()}.${ext}`;
    try {
      if (!fs.existsSync(COMMUNITY_MEDIA_DIR)) {
        fs.mkdirSync(COMMUNITY_MEDIA_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(COMMUNITY_MEDIA_DIR, filename), buffer);
      const imageUrl = `/api/v1/forum/media/${filename}`;
      return jsonCors({ success: true, imageUrl, url: imageUrl }, 201);
    } catch (diskErr) {
      console.warn("[API/V1/FORUM-UPLOAD] Disk write fallback to data URI:", diskErr);
      const dataUrl = `data:${normalizedMime};base64,${buffer.toString("base64")}`;
      return jsonCors({ success: true, imageUrl: dataUrl, url: dataUrl }, 201);
    }
  } catch (err: any) {
    console.error("[API/V1/FORUM-UPLOAD ERROR]:", err);
    return jsonCors({ success: false, error: err?.message || "Failed to upload forum image." }, 500);
  }
}

export async function handleGetForumMedia(filename: string): Promise<Response> {
  const safeName = path.basename(filename);
  if (!safeName || !/^[a-zA-Z0-9._-]+$/.test(safeName)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(COMMUNITY_MEDIA_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(safeName).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";

  const bytes = fs.readFileSync(filePath);
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}
