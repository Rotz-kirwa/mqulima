import crypto from "node:crypto";
import type { StorageConfig } from "./storage.types";

export class S3SignerService {
  private static hmacSha256(key: Buffer | string, data: string): Buffer {
    return crypto.createHmac("sha256", key).update(data, "utf8").digest();
  }

  private static hashSha256(data: string): string {
    return crypto.createHash("sha256").update(data, "utf8").digest("hex");
  }

  private static getSignatureKey(
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string
  ): Buffer {
    const kDate = this.hmacSha256("AWS4" + key, dateStamp);
    const kRegion = this.hmacSha256(kDate, regionName);
    const kService = this.hmacSha256(kRegion, serviceName);
    const kSigning = this.hmacSha256(kService, "aws4_request");
    return kSigning;
  }

  static generatePresignedPutUrl(
    config: StorageConfig,
    objectKey: string,
    contentType: string,
    expiresInSeconds = 900
  ): string {
    const accessKeyId = config.accessKeyId || "demo-access-key";
    const secretAccessKey = config.secretAccessKey || "demo-secret-key";
    const region = config.region || "auto";
    const bucket = config.bucket;

    const endpointUrl = config.endpoint
      ? new URL(config.endpoint)
      : new URL(`https://${bucket}.s3.${region === "auto" ? "us-east-1" : region}.amazonaws.com`);

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
    const dateStamp = amzDate.slice(0, 8);

    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;

    const host = endpointUrl.host;
    const path = `/${bucket}/${objectKey}`;

    const queryParams: Record<string, string> = {
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": expiresInSeconds.toString(),
      "X-Amz-SignedHeaders": "content-type;host",
    };

    const sortedQueryString = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join("&");

    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
    const signedHeaders = "content-type;host";
    const payloadHash = "UNSIGNED-PAYLOAD";

    const canonicalRequest = [
      "PUT",
      path,
      sortedQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      this.hashSha256(canonicalRequest),
    ].join("\n");

    const signingKey = this.getSignatureKey(secretAccessKey, dateStamp, region, "s3");
    const signature = this.hmacSha256(signingKey, stringToSign).toString("hex");

    return `${endpointUrl.origin}${path}?${sortedQueryString}&X-Amz-Signature=${signature}`;
  }
}
