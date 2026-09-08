import { User, UserPrivilege } from "../types";

/**
 * Resolves the effective privilege level for a user:
 * - "admin": Global administrator with full rights (users, assets, consumables, settings)
 * - "operator": Operational user who can register and view/consult assets & consumables and perform checkin/checkout
 * - "user": Standard employee/viewer with read-only view of their items and general inventory
 */
export function getUserPrivilege(user?: User | null): UserPrivilege {
  if (!user) return "user";
  if (user.privilege === "operator") return "operator";
  if (user.privilege === "admin") return "admin";
  if (user.privilege === "user") return "user";

  // Legacy fallback based on isAdmin or ID or role title
  if (user.isAdmin || user.id === "user-admin" || user.role?.toLowerCase().includes("admin")) {
    return "admin";
  }
  if (user.role?.toLowerCase().includes("operador") || user.role?.toLowerCase().includes("operator")) {
    return "operator";
  }
  return "user";
}

export function getPrivilegeLabel(privilege?: UserPrivilege | string): string {
  switch (privilege) {
    case "admin":
      return "Administrador Global";
    case "operator":
      return "Operador do Sistema";
    case "user":
    default:
      return "Colaborador Padrão";
  }
}

export function isUserAdmin(user?: User | null): boolean {
  return getUserPrivilege(user) === "admin";
}

export function isUserOperator(user?: User | null): boolean {
  return getUserPrivilege(user) === "operator";
}

/**
 * Checks if user has permission to operate the system
 * (register/create or consult assets and consumables, perform check-in/check-out)
 */
export function canOperate(user?: User | null): boolean {
  const p = getUserPrivilege(user);
  return p === "admin" || p === "operator";
}

/**
 * Assets permissions:
 * Operators and Admins can register/create new assets and record movements
 */
export function canRegisterAssets(user?: User | null): boolean {
  return canOperate(user);
}

/**
 * Only Admins can permanently delete assets
 */
export function canDeleteAssets(user?: User | null): boolean {
  return isUserAdmin(user);
}

/**
 * Consumables permissions:
 * Operators and Admins can register new consumables and adjust stock/consumption
 */
export function canManageConsumables(user?: User | null): boolean {
  return canOperate(user);
}

/**
 * Only Admins can permanently delete consumables
 */
export function canDeleteConsumables(user?: User | null): boolean {
  return isUserAdmin(user);
}

/**
 * Only Admins can manage users, assign privileges, or delete user accounts
 */
export function canManageUsers(user?: User | null): boolean {
  return isUserAdmin(user);
}
