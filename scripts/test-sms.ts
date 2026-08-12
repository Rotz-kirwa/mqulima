import fs from "fs";
import path from "path";

// Load .env file manually if environment variables not pre-loaded
if (!process.env.TEXTSMS_API_KEY) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = val;
      }
    }
  }
}

import { sendSms } from "../src/lib/sms-service.server";

async function main() {
  const args = process.argv.slice(2);
  const targetPhone = args[0];
  const customMessage = args[1] || "Hello from Mqulima Hub! This is a real test transactional SMS using TextSMS Kenya API.";

  if (!targetPhone) {
    console.log(`
📱 Mqulima TextSMS Manual Test Script

Usage:
  npx tsx scripts/test-sms.ts <phoneNumber> ["<optionalMessage>"]

Examples:
  npx tsx scripts/test-sms.ts 0712345678
  npx tsx scripts/test-sms.ts 254712345678 "Testing Mqulima Order Confirmation"
`);
    process.exit(1);
  }

  console.log("⚡ Initiating TextSMS dispatch test...");
  console.log(`Recipient Raw Phone: ${targetPhone}`);
  console.log(`Message Content: "${customMessage}"`);
  console.log(`Environment TEXTSMS_MOCK_MODE: ${process.env.TEXTSMS_MOCK_MODE || "false"}`);

  try {
    const result = await sendSms({
      phoneNumber: targetPhone,
      message: customMessage,
      triggerType: "manual_test",
    });

    console.log("\n---------------- Dispatched Result ----------------");
    console.dir(result, { depth: null });
    console.log("--------------------------------------------------\n");

    if (result.success) {
      if (result.mocked) {
        console.log("⚠️ SMS was sent in MOCK MODE (TEXTSMS_MOCK_MODE=true). To send real SMS, set TEXTSMS_MOCK_MODE=false in .env");
      } else {
        console.log("🎉 SUCCESS: Real SMS dispatched successfully via TextSMS Kenya API!");
      }
    } else {
      console.error("❌ FAILED: SMS dispatch failed:", result.error);
    }
  } catch (err: any) {
    console.error("❌ Exception during test script execution:", err);
  } finally {
    process.exit(0);
  }
}

main();
