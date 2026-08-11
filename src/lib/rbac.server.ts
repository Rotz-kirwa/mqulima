export type UserRole =
  | "super_admin"
  | "operations_manager"
  | "content_editor"
  | "support_agent"
  | "finance"
  | "admin"
  | "sales_agent"
  | "retailer"
  | "farmer";

export interface SecurityUserContext {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 90,
  operations_manager: 80,
  finance: 75,
  content_editor: 70,
  support_agent: 65,
  sales_agent: 60,
  retailer: 40,
  farmer: 20,
};

export type RBACScope =
  | "customers:read"
  | "customers:write"
  | "inventory:read"
  | "inventory:write"
  | "orders:read"
  | "orders:write"
  | "payments:read"
  | "payments:write"
  | "services:read"
  | "services:write"
  | "logistics:read"
  | "logistics:write"
  | "market:read"
  | "market:write"
  | "ai:read"
  | "inquiries:read"
  | "inquiries:write"
  | "forum:moderate"
  | "content:write"
  | "academy:read"
  | "academy:write";

export const ROLE_SCOPES: Record<UserRole, RBACScope[]> = {
  super_admin: [
    "customers:read", "customers:write",
    "inventory:read", "inventory:write",
    "orders:read", "orders:write",
    "payments:read", "payments:write",
    "services:read", "services:write",
    "logistics:read", "logistics:write",
    "market:read", "market:write",
    "ai:read",
    "inquiries:read", "inquiries:write",
    "forum:moderate",
    "content:write",
    "academy:read", "academy:write"
  ],
  admin: [
    "customers:read", "customers:write",
    "inventory:read", "inventory:write",
    "orders:read", "orders:write",
    "payments:read", "payments:write",
    "services:read", "services:write",
    "logistics:read", "logistics:write",
    "market:read", "market:write",
    "ai:read",
    "inquiries:read", "inquiries:write",
    "forum:moderate",
    "content:write",
    "academy:read", "academy:write"
  ],
  operations_manager: [
    "customers:read", "customers:write",
    "inventory:read", "inventory:write",
    "orders:read", "orders:write",
    "services:read", "services:write",
    "logistics:read", "logistics:write",
    "market:read", "market:write",
    "inquiries:read", "inquiries:write"
  ],
  finance: [
    "customers:read",
    "orders:read",
    "payments:read", "payments:write",
    "market:read"
  ],
  content_editor: [
    "content:write",
    "academy:read", "academy:write",
    "forum:moderate",
    "market:read"
  ],
  support_agent: [
    "customers:read",
    "orders:read",
    "inquiries:read", "inquiries:write",
    "forum:moderate"
  ],
  sales_agent: [
    "customers:read",
    "inventory:read",
    "orders:read", "orders:write"
  ],
  retailer: [
    "inventory:read",
    "orders:read"
  ],
  farmer: []
};

export class RBACService {
  static assertUserRole(user: SecurityUserContext | null | undefined, allowedRoles: UserRole[]): void {
    if (!user) {
      throw new Error("Authentication Required: Please sign in to access this resource.");
    }
    if (!allowedRoles.includes(user.role)) {
      console.warn(
        `[SECURITY ALERT] Unauthorized access attempt by user ${user.id} (${user.email}, role: ${user.role}). Required roles: [${allowedRoles.join(", ")}]`
      );
      throw new Error("Forbidden: You do not have permission to perform this action.");
    }
  }

  static assertScope(user: SecurityUserContext | null | undefined, requiredScope: RBACScope): void {
    if (!user) {
      throw new Error("Authentication Required: Please sign in to access this resource.");
    }
    const scopes = ROLE_SCOPES[user.role] || [];
    if (!scopes.includes(requiredScope) && user.role !== "super_admin" && user.role !== "admin") {
      console.warn(
        `[SECURITY ALERT] User ${user.id} (${user.role}) lacks scope '${requiredScope}'.`
      );
      throw new Error(`Forbidden: Required scope '${requiredScope}' missing.`);
    }
  }

  static assertMinRoleLevel(user: SecurityUserContext | null | undefined, minRole: UserRole): void {
    if (!user) {
      throw new Error("Authentication Required: Please sign in to access this resource.");
    }
    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 100;
    if (userLevel < requiredLevel) {
      console.warn(
        `[SECURITY ALERT] Insufficient role level for user ${user.id} (${user.role} = ${userLevel}). Required level: ${minRole} (${requiredLevel})`
      );
      throw new Error("Forbidden: Insufficient security permissions for this operational level.");
    }
  }

  static isAdmin(user?: SecurityUserContext | null): boolean {
    if (!user) return false;
    return (
      user.role === "admin" ||
      user.role === "super_admin" ||
      user.role === "operations_manager" ||
      user.role === "finance"
    );
  }

  static assertOwnerOrAdmin(user: SecurityUserContext | null | undefined, ownerId: string): void {
    if (!user) {
      throw new Error("Authentication Required: Please sign in to access this resource.");
    }
    const isOwner = user.id === ownerId;
    const isAdmin = this.isAdmin(user);
    if (!isOwner && !isAdmin) {
      throw new Error("Forbidden: You can only modify your own resources.");
    }
  }
}
