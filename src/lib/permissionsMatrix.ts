/**
 * SVC-223: Granular permissions matrix for admin roles
 * Defines what each role can access and modify
 */

export type Permission =
  | "appointments.view" | "appointments.create" | "appointments.edit" | "appointments.delete"
  | "clients.view" | "clients.edit" | "clients.delete"
  | "documents.view" | "documents.upload" | "documents.delete"
  | "journal.view" | "journal.create" | "journal.edit"
  | "billing.view" | "billing.refund" | "billing.export"
  | "settings.view" | "settings.edit"
  | "users.view" | "users.manage" | "users.roles"
  | "audit.view" | "audit.export"
  | "compliance.view" | "compliance.manage"
  | "ron.conduct" | "ron.recordings"
  | "services.view" | "services.manage"
  | "reports.view" | "reports.export";

export type Role = "admin" | "notary" | "client" | "moderator";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "appointments.view", "appointments.create", "appointments.edit", "appointments.delete",
    "clients.view", "clients.edit", "clients.delete",
    "documents.view", "documents.upload", "documents.delete",
    "journal.view", "journal.create", "journal.edit",
    "billing.view", "billing.refund", "billing.export",
    "settings.view", "settings.edit",
    "users.view", "users.manage", "users.roles",
    "audit.view", "audit.export",
    "compliance.view", "compliance.manage",
    "ron.conduct", "ron.recordings",
    "services.view", "services.manage",
    "reports.view", "reports.export",
  ],
  notary: [
    "appointments.view", "appointments.create", "appointments.edit",
    "clients.view",
    "documents.view", "documents.upload",
    "journal.view", "journal.create", "journal.edit",
    "ron.conduct", "ron.recordings",
    "compliance.view",
    "reports.view",
  ],
  moderator: [
    "appointments.view", "appointments.edit",
    "clients.view", "clients.edit",
    "documents.view", "documents.upload",
    "journal.view",
    "billing.view",
    "audit.view",
    "services.view",
    "reports.view",
  ],
  client: [
    "appointments.view", "appointments.create",
    "documents.view", "documents.upload",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getAllPermissions(): Permission[] {
  return [...new Set(Object.values(ROLE_PERMISSIONS).flat())];
}
