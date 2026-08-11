import { getDb } from "../../src/lib/db.server";
import { normalizeKenyanPhone, validateKenyanPhone } from "../../src/lib/phone.server";
import { executeServiceBooking } from "../../src/lib/api/services-core.server";
import { RBACService, SecurityUserContext } from "../../src/lib/rbac.server";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
}

async function invokeBooking(data: any) {
  return executeServiceBooking(data);
}

async function runServicesSecurityTestSuite() {
  console.log("=================================================================");
  console.log("🧪 STARTING MQULIMA SERVICES SECURITY & DATA INTEGRITY TEST SUITE");
  console.log("=================================================================\n");

  const sql = getDb();

  // -------------------------------------------------------------------------
  // TEST 1: Phone Normalization & Validation Unit Tests
  // -------------------------------------------------------------------------
  console.log("1. Testing Kenyan Phone Normalization & Validation...");
  
  assert(normalizeKenyanPhone("0712345678") === "254712345678", "0712345678 -> 254712345678");
  assert(normalizeKenyanPhone("0112345678") === "254112345678", "0112345678 -> 254112345678");
  assert(normalizeKenyanPhone("254712345678") === "254712345678", "254712345678 -> 254712345678");
  assert(normalizeKenyanPhone("+254 712 345 678") === "254712345678", "+254 712 345 678 -> 254712345678");
  assert(normalizeKenyanPhone("  +254112345678 ") === "254112345678", "Spaced +254112345678 -> 254112345678");

  assert(validateKenyanPhone("0799887766") === true, "Valid 07 phone passes validation");
  assert(validateKenyanPhone("12345") === false, "Short invalid phone rejected");
  assert(validateKenyanPhone("abcdefghijk") === false, "Alpha phone string rejected");
  assert(validateKenyanPhone("254000000000") === false, "Invalid prefix 2540 rejected");

  console.log("");

  // -------------------------------------------------------------------------
  // TEST 2: Guest Service Booking (No Admin Fallback & user_id = NULL)
  // -------------------------------------------------------------------------
  console.log("2. Testing Guest Service Booking Isolation (user_id = NULL)...");

  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const guestPhone = `0711${randomSuffix}`;
  const normalizedGuestPhone = `254711${randomSuffix}`;
  
  const guestResult = await invokeBooking({
    service_type: "soil_testing_analysis",
    subservice_name: `Soil Testing & Analysis ${randomSuffix}`,
    contact_name: "Test Guest Farmer",
    contact_phone: guestPhone,
    location: "Nakuru County",
    farm_scale: "5 Acres",
    scheduled_date: new Date().toISOString(),
    notes: "Security test suite guest booking",
    channel: "website",
  });

  assert(guestResult.success === true, "Guest booking succeeded");
  assert(typeof guestResult.bookingId === "string" && guestResult.bookingId.length > 0, "Booking ID returned");

  // Query database to verify user_id is NULL and contact info is saved
  const [guestDbRecord] = await sql`
    SELECT id, user_id, contact_name, contact_phone, subservice_name, location, status
    FROM service_requests
    WHERE id = ${guestResult.bookingId}
  `;

  assert(guestDbRecord !== undefined, "Guest record exists in service_requests table");
  assert(guestDbRecord.user_id === null, "CRITICAL: Guest request user_id is NULL (no admin profile pollution!)");
  assert(guestDbRecord.contact_name === "Test Guest Farmer", "Contact name preserved");
  assert(guestDbRecord.contact_phone === normalizedGuestPhone, "Contact phone normalized to 254 format");
  assert(guestDbRecord.status === "requested", "Default status is 'requested'");

  // Verify corresponding order record has user_id = NULL
  assert(typeof guestResult.orderId === "string", "Order ID returned");
  const [guestOrderRecord] = await sql`
    SELECT id, user_id, status, payment_status, total
    FROM orders
    WHERE id = ${guestResult.orderId}
  `;

  assert(guestOrderRecord !== undefined, "Corresponding order record created in orders table");
  assert(guestOrderRecord.user_id === null, "CRITICAL: Corresponding order user_id is NULL");

  console.log("");

  // -------------------------------------------------------------------------
  // TEST 3: Authenticated Service Booking
  // -------------------------------------------------------------------------
  console.log("3. Testing Authenticated Service Booking (user_id = profile.id)...");

  // Fetch or create a test profile for auth testing
  let [testProfile] = await sql`
    SELECT id, full_name, email FROM profiles WHERE role = 'farmer' AND deleted_at IS NULL LIMIT 1
  `;

  if (!testProfile) {
    [testProfile] = await sql`
      INSERT INTO profiles (full_name, email, role, phone)
      VALUES ('Auth Test Farmer', 'authtest@mqulima.co.ke', 'farmer', '254722334455')
      RETURNING id, full_name, email
    `;
  }

  const authPhone = `0722${randomSuffix}`;
  const authResult = await invokeBooking({
    service_type: "ai_breeding",
    subservice_name: `Artificial Insemination ${randomSuffix}`,
    farmer_id: testProfile.id as string,
    contact_name: testProfile.full_name as string,
    contact_phone: authPhone,
    location: "Uasin Gishu Hub",
    farm_scale: "10 Dairy Cows",
    scheduled_date: new Date().toISOString(),
    notes: "Security test suite authenticated booking",
    channel: "website",
  });

  assert(authResult.success === true, "Authenticated booking succeeded");

  const [authDbRecord] = await sql`
    SELECT id, user_id, contact_name, contact_phone
    FROM service_requests
    WHERE id = ${authResult.bookingId}
  `;

  assert(authDbRecord.user_id === testProfile.id, "Authenticated request user_id matches farmer profile ID");

  console.log("");

  // -------------------------------------------------------------------------
  // TEST 4: RBAC Authorization Unit Verification
  // -------------------------------------------------------------------------
  console.log("4. Testing Server-Side RBAC Enforcement...");

  const farmerContext: SecurityUserContext = {
    id: testProfile.id as string,
    email: testProfile.email as string,
    role: "farmer",
  };

  const adminContext: SecurityUserContext = {
    id: "admin-123",
    email: "admin@mqulima.co.ke",
    role: "admin",
  };

  let farmerReadBlocked = false;
  try {
    RBACService.assertScope(farmerContext, "services:read");
  } catch {
    farmerReadBlocked = true;
  }
  assert(farmerReadBlocked === true, "Farmer role is denied services:read access");

  let farmerWriteBlocked = false;
  try {
    RBACService.assertScope(farmerContext, "services:write");
  } catch {
    farmerWriteBlocked = true;
  }
  assert(farmerWriteBlocked === true, "Farmer role is denied services:write access");

  let adminWriteAllowed = false;
  try {
    RBACService.assertScope(adminContext, "services:write");
    adminWriteAllowed = true;
  } catch {
    adminWriteAllowed = false;
  }
  assert(adminWriteAllowed === true, "Admin role is granted services:write access");

  console.log("");

  // -------------------------------------------------------------------------
  // TEST 5: Verification of Database Regression Checks
  // -------------------------------------------------------------------------
  console.log("5. Verifying No Admin Fallback Queries or Impersonation exists...");

  const [adminAttributedCount] = await sql`
    SELECT COUNT(*)::int as cnt
    FROM service_requests sr
    JOIN profiles p ON sr.user_id = p.id
    WHERE p.role IN ('super_admin', 'admin') AND sr.contact_name = 'Test Guest Farmer'
  `;

  assert(adminAttributedCount.cnt === 0, "Zero guest service requests attributed to Admin/SuperAdmin profiles");

  console.log("");
  console.log("=================================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log("=================================================================\n");
}

runServicesSecurityTestSuite().catch((err) => {
  console.error("❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
