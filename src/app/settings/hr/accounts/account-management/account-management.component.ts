import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { PermissionMatrix, RbacFeatureGroup, RbacFeature, FeaturePermission, parseCrudString } from '../../../../shared/models/permissions.model'; // Import permissions model

const ROLES = ['ADMIN', 'HR', 'MENTOR', 'MANAGER', 'INTERN']; // Keep order for columns

const MOCK_PERMISSION_MATRIX: PermissionMatrix = {
  groups: [
    {
      name: 'Quản trị Hệ thống',
      features: [
        { id: 'E01', name: 'Quản lý tài khoản nội bộ', permissions: {
          ADMIN: parseCrudString('CRUD'), HR: parseCrudString('-'), MENTOR: parseCrudString('-'), MANAGER: parseCrudString('-'), INTERN: parseCrudString('-')
        }},
        { id: 'E02', name: 'Cấu hình Phòng ban & Vị trí', permissions: {
          ADMIN: parseCrudString('CRUD'), HR: parseCrudString('R'), MENTOR: parseCrudString('-'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('-')
        }},
        { id: 'E03', name: 'Cấu hình Skill Tags & Trọng số', permissions: {
          ADMIN: parseCrudString('CRUD'), HR: parseCrudString('R'), MENTOR: parseCrudString('R'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('-')
        }},
        { id: 'E04', name: 'Truy xuất Audit Logs', permissions: {
          ADMIN: parseCrudString('R'), HR: parseCrudString('-'), MENTOR: parseCrudString('-'), MANAGER: parseCrudString('-'), INTERN: parseCrudString('-')
        }},
      ]
    },
    {
      name: 'Onboarding & Quản lý Intern',
      features: [
        { id: 'E05', name: 'Tạo/Import hồ sơ Intern', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('CRUD'), MENTOR: parseCrudString('R'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('-')
        }},
        { id: 'E06', name: 'Gán Mentor & Manager cho Intern', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('CUD'), MENTOR: parseCrudString('R'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('-')
        }},
        { id: 'E07', name: 'Quản lý danh mục Trường ĐH', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('CRUD'), MENTOR: parseCrudString('R'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('-')
        }},
        { id: 'E08', name: 'Dashboard lộ trình cá nhân', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('-'), MENTOR: parseCrudString('-'), MANAGER: parseCrudString('-'), INTERN: parseCrudString('R')
        }},
      ]
    },
    {
      name: 'Điều hành Micro-tasks',
      features: [
        { id: 'E09', name: 'Tạo & Giao Task / Duplicate Task', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('-'), MENTOR: parseCrudString('CRUD'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('-')
        }},
        { id: 'E10', name: 'Xem To-do list & Nhận cảnh báo', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('-'), MENTOR: parseCrudString('R'), MANAGER: parseCrudString('-'), INTERN: parseCrudString('R')
        }},
        { id: 'E11', name: 'Nộp kết quả & Minh chứng', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('-'), MENTOR: parseCrudString('R'), MANAGER: parseCrudString('-'), INTERN: parseCrudString('CUD')
        }},
        { id: 'E12', name: 'Chấm điểm & Feedback', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('-'), MENTOR: parseCrudString('UD'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('R')
        }},
      ]
    },
    {
      name: 'Luồng Phê duyệt & Báo cáo',
      features: [
        { id: 'E14', name: 'Xem điểm số Real-time', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('R'), MENTOR: parseCrudString('R'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('R')
        }},
        { id: 'E15', name: 'Đánh giá tổng kết cuối kỳ', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('R'), MENTOR: parseCrudString('CUD'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('-')
        }},
        { id: 'E16', name: 'Phê duyệt kết quả cuối cùng', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('R'), MENTOR: parseCrudString('R'), MANAGER: parseCrudString('CUD'), INTERN: parseCrudString('R')
        }},
        { id: 'E17', name: 'Xem Biểu đồ Radar năng lực', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('R'), MENTOR: parseCrudString('R'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('R')
        }},
        { id: 'E18', name: 'Dashboard so sánh Intern', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('-'), MENTOR: parseCrudString('-'), MANAGER: parseCrudString('R'), INTERN: parseCrudString('-')
        }},
        { id: 'E19', name: 'Xuất báo cáo Excel/PDF', permissions: {
          ADMIN: parseCrudString('-'), HR: parseCrudString('R/Export'), MENTOR: parseCrudString('-'), MANAGER: parseCrudString('R/Export'), INTERN: parseCrudString('-')
        }},
      ]
    }
  ]
};

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule, // Add MatIconModule for the plus icon
    MatDialogModule // Add MatDialogModule
  ],
  templateUrl: './account-management.component.html',
  styleUrls: ['./account-management.component.css'],
})
export class AccountManagementComponent implements OnInit {
  rolesHeader = ROLES; // Make roles available in template
  permissionMatrix: PermissionMatrix = MOCK_PERMISSION_MATRIX;

  constructor(
    public dialog: MatDialog // Inject MatDialog
  ) {}

  ngOnInit(): void {
    // No form initialization or other ngOnInit logic needed here initially
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '450px', // Adjust width as needed for the form
      disableClose: true // Prevent closing by clicking outside or pressing Escape for better UX
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The create user dialog was closed', result);
      // Here you could add logic to refresh a user list if 'result' indicates a successful creation
      // e.g., if (result) { this.loadUsers(); }
    });
  }
}

