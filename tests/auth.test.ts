import { describe, it, expect } from "vitest";
import { ROLE_HIERARCHY, ROLE_SCOPES, RBACService, type SecurityUserContext } from "../src/lib/rbac.server";

describe("RBAC Security & Authorization", () => {
  it("should verify correct role hierarchy ordering", () => {
    expect(ROLE_HIERARCHY["super_admin"]).toBe(100);
    expect(ROLE_HIERARCHY["admin"]).toBe(90);
    expect(ROLE_HIERARCHY["operations_manager"]).toBe(80);
    expect(ROLE_HIERARCHY["sales_agent"]).toBe(60);
    expect(ROLE_HIERARCHY["farmer"]).toBe(20);

    expect(ROLE_HIERARCHY["super_admin"]).toBeGreaterThan(ROLE_HIERARCHY["admin"]);
    expect(ROLE_HIERARCHY["admin"]).toBeGreaterThan(ROLE_HIERARCHY["sales_agent"]);
    expect(ROLE_HIERARCHY["sales_agent"]).toBeGreaterThan(ROLE_HIERARCHY["farmer"]);
  });

  it("should assert user role permissions correctly", () => {
    const adminUser: SecurityUserContext = {
      id: "admin-123",
      email: "admin@mqulima.com",
      role: "admin",
    };

    const farmerUser: SecurityUserContext = {
      id: "farmer-456",
      email: "farmer@mqulima.com",
      role: "farmer",
    };

    expect(() => RBACService.assertUserRole(adminUser, ["admin", "super_admin"])).not.toThrow();
    expect(() => RBACService.assertUserRole(farmerUser, ["admin", "super_admin"])).toThrow(/Forbidden/);
  });

  it("should grant full scopes to super_admin and admin", () => {
    const superAdminScopes = ROLE_SCOPES["super_admin"];
    const adminScopes = ROLE_SCOPES["admin"];

    expect(superAdminScopes).toContain("orders:write");
    expect(superAdminScopes).toContain("payments:write");
    expect(adminScopes).toContain("inventory:write");
  });

  it("should correctly identify admin user roles", () => {
    expect(RBACService.isAdmin({ id: "1", email: "a@a.com", role: "admin" })).toBe(true);
    expect(RBACService.isAdmin({ id: "2", email: "b@b.com", role: "super_admin" })).toBe(true);
    expect(RBACService.isAdmin({ id: "3", email: "c@c.com", role: "farmer" })).toBe(false);
  });
});
