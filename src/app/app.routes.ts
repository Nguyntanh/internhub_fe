import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { MainLayout } from './dashboard/main-layout/main-layout'; // Import MainLayout
import { authGuard } from './auth/auth.guard'; // Import authGuard

// Import the existing settings components (now parent placeholders)
import { Hr } from './settings/hr/hr';
import { Security } from './settings/security/security';
import { ConfigReview } from './settings/config-review/config-review';
import { PartnerData } from './settings/partner-data/partner-data';
import { SystemOperation } from './settings/system-operation/system-operation';

// Import the existing dashboard sub-components
import { Execution } from './dashboard/execution/execution';
import { Management } from './dashboard/management/management';
import { Capacity } from './dashboard/capacity/capacity';
import { Approval } from './dashboard/approval/approval';

// Import existing placeholder components for sub-menus
import { InternsComponent } from './dashboard/management/interns/interns';


import { AnalyticsComponent } from './dashboard/capacity/analytics/analytics';

// Import NEW placeholder components for multi-level settings sub-menus
import { AccountsComponent } from './settings/hr/accounts/accounts';
import { HrInternsComponent } from './settings/hr/interns/interns';
import { OrgStructureComponent } from './settings/hr/org-structure/org-structure';
import { EvaluationSkillsComponent } from './settings/evaluation/skills/skills';
import { PartnersListComponent } from './settings/partners/list/list';
import { OperationProcessComponent } from './settings/operation/process/process';
import { SecurityLogsComponent } from './settings/security/logs/logs';


export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: MainLayout, // Use MainLayout as the parent component
    canActivate: [authGuard], // Bảo vệ route này và các route con của nó
    data: { title: 'Tổng quan' },
    children: [
      { path: '', component: Dashboard, data: { title: 'Tổng quan', mode: 'dashboard' } }, // Render Dashboard inside MainLayout's <router-outlet>
    ],
  },
  {
    path: 'tasks', // Changed from /execution to /tasks
    component: MainLayout,
    canActivate: [authGuard], // Bảo vệ route này
    data: { title: 'Thực thi' },
    children: [
      { path: '', component: Execution, data: { title: 'Thực thi', mode: 'dashboard' } } // Default for /tasks
    ]
  },
  {
    path: 'management',
    component: MainLayout,
    canActivate: [authGuard], // Bảo vệ route này
    data: { title: 'Quản lý' },
    children: [
      { path: '', redirectTo: 'interns', pathMatch: 'full' }, // Redirect to interns by default
      { path: 'interns', component: InternsComponent, data: { title: 'Hồ sơ Intern' } },

    ]
  },
  {
    path: 'skills', // Changed from /capacity to /skills
    component: MainLayout,
    canActivate: [authGuard], // Bảo vệ route này
    data: { title: 'Năng lực' },
    children: [
      { path: '', redirectTo: 'analytics', pathMatch: 'full' }, // Redirect to config by default

      { path: 'analytics', component: AnalyticsComponent, data: { title: 'Radar Analytics' } },
    ]
  },
  {
    path: 'approval',
    component: MainLayout,
    canActivate: [authGuard], // Bảo vệ route này
    data: { title: 'Phê duyệt' },
    children: [
      { path: '', component: Approval, data: { title: 'Phê duyệt', mode: 'dashboard' } } // Default for /approval
    ]
  },
  {
    path: 'settings',
    component: MainLayout,
    canActivate: [authGuard], // Bảo vệ route này và các route con của nó
    data: { title: 'Cài đặt' }, // Top-level settings breadcrumb
    children: [
      { path: '', redirectTo: 'hr', pathMatch: 'full' }, // Default redirect for /settings

      { // Quản trị Nhân sự
        path: 'hr',
        component: Hr, // Hr component as a parent for its sub-settings
        data: { title: 'Quản trị Nhân sự' },
        children: [
          { path: '', redirectTo: 'accounts', pathMatch: 'full' },
          { path: 'accounts', component: AccountsComponent, data: { title: 'Quản lý Tài khoản Nội bộ' } },
          { path: 'interns', component: HrInternsComponent, data: { title: 'Quản lý Thực tập sinh' } },
          { path: 'org-structure', component: OrgStructureComponent, data: { title: 'Cơ cấu Tổ chức' } },
        ]
      },
      { // Cấu hình Đánh giá
        path: 'evaluation', // New path for evaluation settings
        component: ConfigReview, // Using existing ConfigReview component as parent
        data: { title: 'Cấu hình Đánh giá' },
        children: [
          { path: '', redirectTo: 'skills', pathMatch: 'full' },
          { path: 'skills', component: EvaluationSkillsComponent, data: { title: 'Thư viện Kỹ năng' } },
        ]
      },
      { // Dữ liệu Đối tác
        path: 'partners', // New path for partners settings
        component: PartnerData, // Using existing PartnerData component as parent
        data: { title: 'Dữ liệu Đối tác' },
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          { path: 'list', component: PartnersListComponent, data: { title: 'Danh mục Đối tác' } },
        ]
      },
      { // Vận hành hệ thống
        path: 'operation', // New path for operation settings
        component: SystemOperation, // Using existing SystemOperation component as parent
        data: { title: 'Vận hành hệ thống' },
        children: [
          { path: '', redirectTo: 'process', pathMatch: 'full' },
          { path: 'process', component: OperationProcessComponent, data: { title: 'Cấu hình Quy trình' } },
        ]
      },
      { // Bảo mật & Tra cứu
        path: 'security',
        component: Security, // Using existing Security component as parent
        data: { title: 'Bảo mật & Tra cứu' },
        children: [
          { path: '', redirectTo: 'logs', pathMatch: 'full' },
          { path: 'logs', component: SecurityLogsComponent, data: { title: 'Nhật ký Hệ thống' } },
        ]
      },
    ],
  },
];
