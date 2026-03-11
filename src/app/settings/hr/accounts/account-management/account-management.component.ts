import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // For ngModel in mat-radio-group
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox'; // For interactive checkboxes
import { MatRadioModule } from '@angular/material/radio'; // For mat-radio-group
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For mat-spinner
import { MatSnackBar } from '@angular/material/snack-bar'; // For notifications

import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import {
  ROLES_DATA,
  FUNCTIONS_DATA,
  FUNCTION_CODE_TO_ID_MAP,
  FUNCTION_ID_TO_NAME_MAP,
  MOCK_ROLE_PERMISSIONS_FLAT, // Temporarily use mock flat data
  PermissionMatrix,
  RbacFeatureGroup,
  RbacFeature,
  SingleRoleFeaturePermission,
  RolePermissionRequest,
  RolePermissionResponse,
  FeaturePermission,
  toCrudString
} from '../../../../shared/models/permissions.model';
import { RolePermissionService } from '../../../../services/role-permission.service'; // New service

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // For ngModel in mat-radio-group
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatRadioModule, // For mat-radio-group
    MatProgressSpinnerModule, // For mat-spinner
  ],
  templateUrl: './account-management.component.html',
  styleUrls: ['./account-management.component.css'],
})
export class AccountManagementComponent implements OnInit {
  rolesHeader: string[] = ROLES_DATA.map(r => r.name); // Just names for the header
  roleDefinitions = ROLES_DATA; // Full role objects for iteration
  permissionMatrix: PermissionMatrix | null = null;
  isLoading = true;
  selectedPermissionType: 'canCreate' | 'canAccess' | 'canEdit' | 'canDelete' = 'canAccess'; // Default view

  constructor(
    public dialog: MatDialog,
    private rolePermissionService: RolePermissionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.isLoading = true;
    // In a real scenario, this would fetch from rolePermissionService
    // For now, we use the MOCK_ROLE_PERMISSIONS_FLAT data
    // this.rolePermissionService.getAllRolePermissions().subscribe({
    //   next: (flatPermissions) => {
    //     this.permissionMatrix = this.buildPermissionMatrix(flatPermissions);
    //     this.isLoading = false;
    //   },
    //   error: (err) => {
    //     console.error('Failed to load permissions', err);
    //     this.snackBar.open('Failed to load permissions.', 'Close', { duration: 3000 });
    //     this.isLoading = false;
    //   }
    // });
    setTimeout(() => { // Simulate API call delay
      this.permissionMatrix = this.buildPermissionMatrix(MOCK_ROLE_PERMISSIONS_FLAT);
      this.isLoading = false;
    }, 500);
  }

  // Maps flat RolePermissionResponse[] from Backend to structured PermissionMatrix for Frontend
  private buildPermissionMatrix(flatPermissions: RolePermissionResponse[]): PermissionMatrix {
    const matrix: PermissionMatrix = { groups: [] };
    const featureMap = new Map<number, RbacFeature>(); // Map functionId to RbacFeature

    // Initialize all features from FUNCTIONS_DATA
    FUNCTIONS_DATA.forEach(func => {
      const rbacFeature: RbacFeature = {
        id: func.code.split('_')[0], // Extract E01, E02 etc. from code
        functionId: func.id,
        name: func.name,
        permissions: {},
      };
      // Initialize permissions for all roles to false
      ROLES_DATA.forEach(role => {
        rbacFeature.permissions[role.id] = {
          roleId: role.id,
          canCreate: false,
          canAccess: false,
          canEdit: false,
          canDelete: false,
        };
      });
      featureMap.set(func.id, rbacFeature);
    });

    // Populate permissions from flat data
    flatPermissions.forEach(perm => {
      const feature = featureMap.get(perm.functionId);
      if (feature) {
        feature.permissions[perm.roleId] = {
          roleId: perm.roleId,
          canCreate: perm.canCreate,
          canAccess: perm.canAccess,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
        };
      }
    });

    // Group features as per the original table structure (manual for now)
    const groupsConfig = [
      { name: 'Quản trị Hệ thống', codes: ['E01_USER_MGMT', 'E02_DEPT_POS_CONFIG', 'E03_SKILL_CONFIG', 'E04_AUDIT_LOGS'] },
      { name: 'Onboarding & Quản lý Intern', codes: ['E05_INTERN_IMPORT', 'E06_ASSIGN_MENTOR', 'E07_UNI_MGMT', 'E08_PERSONAL_DASHBOARD'] },
      { name: 'Điều hành Micro-tasks', codes: ['E09_TASK_ACTION', 'E10_TODO_LIST', 'E11_TASK_SUBMISSION', 'E12_GRADING'] },
      { name: 'Luồng Phê duyệt & Báo cáo', codes: ['E14_REALTIME_SCORE', 'E15_FINAL_EVALUATION', 'E16_FINAL_APPROVAL', 'E17_RADAR_CHART', 'E18_COMPARE_DASHBOARD', 'E19_EXPORT_REPORT'] },
      // Add other functions if they don't fit into these primary groups (e.g., USER_MGMT, SKILL_LIB for E01, E03)
      // Note: Backend functions data also contains USER_MGMT (id 21) and SKILL_LIB (id 22)
      // For now, map E01_USER_MGMT etc. to their respective E01 format
    ];

    groupsConfig.forEach(groupConfig => {
      const group: RbacFeatureGroup = {
        name: groupConfig.name,
        features: groupConfig.codes
          .map(code => FUNCTIONS_DATA.find(f => f.code === code)?.id) // Get functionId from code
          .map(functionId => functionId ? featureMap.get(functionId) : undefined)
          .filter((f): f is RbacFeature => f !== undefined),
      };
      if (group.features.length > 0) {
        matrix.groups.push(group);
      }
    });

    return matrix;
  }

  getRoleName(roleId: number): string {
    return ROLES_DATA.find(role => role.id === roleId)?.name || 'Unknown';
  }

  // Method to check if a permission is enabled for a given role and feature
  isPermissionEnabled(feature: RbacFeature, roleId: number, type: 'canCreate' | 'canAccess' | 'canEdit' | 'canDelete'): boolean {
    const rolePermission = feature.permissions[roleId];
    if (!rolePermission) return false;
    return rolePermission[type];
  }

  // Method called when a checkbox/toggle is changed
  onPermissionChange(feature: RbacFeature, role: { id: number, name: string }, permissionType: 'canCreate' | 'canAccess' | 'canEdit' | 'canDelete', event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    // Update local matrix optimistically
    const currentPermission = feature.permissions[role.id];
    if (currentPermission) {
      currentPermission[permissionType] = isChecked;
    }

    const request: RolePermissionRequest = {
      roleId: role.id,
      functionId: feature.functionId,
      canAccess: feature.permissions[role.id]?.canAccess || false,
      canCreate: feature.permissions[role.id]?.canCreate || false,
      canEdit: feature.permissions[role.id]?.canEdit || false,
      canDelete: feature.permissions[role.id]?.canDelete || false,
    };

    this.rolePermissionService.updateRolePermission(request).subscribe({
      next: (response) => {
        this.snackBar.open(`Permission for ${role.name} on ${feature.name} (${permissionType}) updated successfully.`, 'Close', { duration: 3000 });
        // Update the 'id' of the permission if the response includes it (for tracking existing entries)
        if (response.id) {
          // This would be more relevant if we were tracking individual permission response IDs
        }
      },
      error: (err) => {
        console.error('Failed to update permission:', err);
        this.snackBar.open(`Failed to update permission for ${role.name} on ${feature.name} (${permissionType}).`, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        // Revert local change if API call fails
        if (currentPermission) {
          currentPermission[permissionType] = !isChecked;
        }
      },
    });
  }

  trackByRoleId(index: number, role: { id: number; name: string }): number {
    return role.id;
  }

  trackByFeatureId(index: number, feature: RbacFeature): number {
    return feature.functionId;
  }


  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '450px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The create user dialog was closed', result);
      if (result) {
        // Optionally reload permissions if user creation affects roles or permissions visible here
        // this.loadPermissions();
      }
    });
  }
}
