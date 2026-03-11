import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // For ngModel in mat-radio-group
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox'; // For interactive checkboxes
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
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.isLoading = true;
    console.log('Attempting to load permissions from backend...');
    this.rolePermissionService.getAllRolePermissions().subscribe({
      next: (flatPermissions) => {
        console.log('Permissions loaded successfully:', flatPermissions);
        this.permissionMatrix = this.buildPermissionMatrix(flatPermissions);
        console.log('Final permissionMatrix assigned:', this.permissionMatrix);
        this.isLoading = false;
        this.cdr.detectChanges(); // Force change detection
      },
      error: (err) => {
        console.error('Failed to load permissions:', err);
        this.snackBar.open('Failed to load permissions. Please check backend API.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        this.isLoading = false;
        // Optionally, load mock data on error for development/demonstration
        this.permissionMatrix = this.buildPermissionMatrix(MOCK_ROLE_PERMISSIONS_FLAT);
        this.cdr.detectChanges(); // Force change detection even on error
      }
    });
  }

  // Maps flat RolePermissionResponse[] from Backend to structured PermissionMatrix for Frontend
  private buildPermissionMatrix(flatPermissions: RolePermissionResponse[]): PermissionMatrix {
    console.log('Building matrix from flat permissions:', flatPermissions);
    const matrix: PermissionMatrix = { groups: [] };
    const featureMap = new Map<number, RbacFeature>(); // Map functionId to RbacFeature

    // Initialize all features from FUNCTIONS_DATA
    FUNCTIONS_DATA.forEach(func => {
      const rbacFeature: RbacFeature = {
        id: func.code, // Use the full code, e.g., E01_USER_MGMT
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
    console.log('Feature map after initialization:', featureMap);

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
    console.log('Feature map after populating permissions:', featureMap);

    // Group features as per the original table structure
    const groupsConfig = [
      { name: 'Quản trị Hệ thống', functionCodes: ['E01_USER_MGMT', 'E02_DEPT_POS_CONFIG', 'E03_SKILL_CONFIG', 'E04_AUDIT_LOGS'] },
      { name: 'Onboarding & Quản lý Intern', functionCodes: ['E05_INTERN_IMPORT', 'E06_ASSIGN_MENTOR', 'E07_UNI_MGMT', 'E08_PERSONAL_DASHBOARD'] },
      { name: 'Điều hành Micro-tasks', functionCodes: ['E09_TASK_ACTION', 'E10_TODO_LIST', 'E11_TASK_SUBMISSION', 'E12_GRADING'] },
      { name: 'Luồng Phê duyệt & Báo cáo', functionCodes: ['E14_REALTIME_SCORE', 'E15_FINAL_EVALUATION', 'E16_FINAL_APPROVAL', 'E17_RADAR_CHART', 'E18_COMPARE_DASHBOARD', 'E19_EXPORT_REPORT'] },
      // Add other functions that might not fit neatly into these primary groups
      { name: 'Khác', functionCodes: ['USER_MGMT', 'SKILL_LIB'] } // Example for other codes
    ];

    groupsConfig.forEach(groupConfig => {
      const group: RbacFeatureGroup = {
        name: groupConfig.name,
        features: groupConfig.functionCodes
          .map(code => FUNCTION_CODE_TO_ID_MAP[code]) // Get functionId from code
          .map(functionId => functionId ? featureMap.get(functionId) : undefined)
          .filter((f): f is RbacFeature => f !== undefined),
      };
      console.log('Group config:', groupConfig.name, 'features:', group.features.length, group.features);
      if (group.features.length > 0) {
        matrix.groups.push(group);
      }
    });
    console.log('Final matrix:', matrix);

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
  onPermissionChange(feature: RbacFeature, role: { id: number, name: string }, permissionType: 'canCreate' | 'canAccess' | 'canEdit' | 'canDelete', event: MatCheckboxChange): void {
    const isChecked = event.checked;

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

  trackByGroup(index: number, group: RbacFeatureGroup): string {
    return group.name; // Assuming group names are unique
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
