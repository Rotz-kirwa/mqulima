import { authenticateRequest } from "./auth-helper";
import { StorageService } from "../../services/storage/storage.service";
import type { UploadCategory } from "../../services/storage/storage.types";

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
