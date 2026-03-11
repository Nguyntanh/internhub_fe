// src/app/shared/models/permissions.model.ts

export type CRUDString = 'C' | 'R' | 'U' | 'D';

export interface FeaturePermission {
  C: boolean;
  R: boolean;
  U: boolean;
  D: boolean;
  raw: string; // e.g., "CRUD", "R", "CUD", "-"
}

// Defines permissions for a single feature across all roles
export interface RolePermissions {
  ADMIN: FeaturePermission;
  HR: FeaturePermission;
  MENTOR: FeaturePermission;
  MANAGER: FeaturePermission;
  INTERN: FeaturePermission;
}

// Represents a single feature/module, e.g., "Quản lý tài khoản nội bộ (E01)"
export interface RbacFeature {
  id: string; // e.g., "E01"
  name: string; // e.g., "Quản lý tài khoản nội bộ"
  permissions: RolePermissions;
}

// Represents a group of features, e.g., "Quản trị Hệ thống"
export interface RbacFeatureGroup {
  name: string; // e.g., "Quản trị Hệ thống"
  features: RbacFeature[];
}

// The overall structure of the RBAC matrix
export interface PermissionMatrix {
  groups: RbacFeatureGroup[];
}

// Helper function to parse a CRUD string into FeaturePermission
export function parseCrudString(crud: string): FeaturePermission {
  const c = crud.includes('C');
  const r = crud.includes('R');
  const u = crud.includes('U');
  const d = crud.includes('D');
  return { C: c, R: r, U: u, D: d, raw: crud };
}
