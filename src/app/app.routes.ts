import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { MainLayout } from './dashboard/main-layout/main-layout'; // Import MainLayout

// Import the new settings components
import { Hr } from './settings/hr/hr';
import { Security } from './settings/security/security';
import { ConfigReview } from './settings/config-review/config-review';
import { PartnerData } from './settings/partner-data/partner-data';
import { SystemOperation } from './settings/system-operation/system-operation';

// Import the new dashboard sub-components
import { Execution } from './dashboard/execution/execution';
import { Management } from './dashboard/management/management';
import { Capacity } from './dashboard/capacity/capacity';
import { Approval } from './dashboard/approval/approval';

// Import new placeholder components for sub-menus
import { InternsComponent } from './dashboard/management/interns/interns';
import { UsersComponent } from './dashboard/management/users/users';
import { ConfigComponent } from './dashboard/capacity/config/config';
import { AnalyticsComponent } from './dashboard/capacity/analytics/analytics';


export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: MainLayout, // Use MainLayout as the parent component
    data: { breadcrumb: 'Tổng quan' },
    children: [
      { path: '', component: Dashboard, data: { title: 'Tổng quan', mode: 'dashboard' } }, // Render Dashboard inside MainLayout's <router-outlet>
    ],
  },
  {
    path: 'tasks', // Changed from /execution to /tasks
    component: MainLayout,
    data: { breadcrumb: 'Thực thi' },
    children: [
      { path: '', component: Execution, data: { title: 'Thực thi', mode: 'dashboard' } } // Default for /tasks
    ]
  },
  {
    path: 'management',
    component: MainLayout,
    data: { breadcrumb: 'Quản lý' },
    children: [
      { path: '', redirectTo: 'interns', pathMatch: 'full' }, // Redirect to interns by default
      { path: 'interns', component: InternsComponent, data: { breadcrumb: 'Hồ sơ Intern' } },
      { path: 'users', component: UsersComponent, data: { breadcrumb: 'Đội ngũ (Users)' } },
    ]
  },
  {
    path: 'skills', // Changed from /capacity to /skills
    component: MainLayout,
    data: { breadcrumb: 'Năng lực' },
    children: [
      { path: '', redirectTo: 'config', pathMatch: 'full' }, // Redirect to config by default
      { path: 'config', component: ConfigComponent, data: { breadcrumb: 'Cấu hình Skill' } },
      { path: 'analytics', component: AnalyticsComponent, data: { breadcrumb: 'Radar Analytics' } },
    ]
  },
  {
    path: 'approval',
    component: MainLayout,
    data: { breadcrumb: 'Phê duyệt' },
    children: [
      { path: '', component: Approval, data: { title: 'Phê duyệt', mode: 'dashboard' } } // Default for /approval
    ]
  },
  {
    path: 'settings',
    component: MainLayout,
    data: { breadcrumb: 'Cài đặt' },
    children: [
      { path: '', redirectTo: 'hr', pathMatch: 'full' }, // Redirect to HR management by default
      { path: 'hr', component: Hr, data: { breadcrumb: 'Quản trị Nhân sự', mode: 'setting' } },
      { path: 'config-review', component: ConfigReview, data: { breadcrumb: 'Cấu hình Đánh giá', mode: 'setting' } },
      { path: 'partner-data', component: PartnerData, data: { breadcrumb: 'Dữ liệu Đối tác', mode: 'setting' } },
      { path: 'system-operation', component: SystemOperation, data: { breadcrumb: 'Vận hành hệ thống', mode: 'setting' } },
      { path: 'security', component: Security, data: { breadcrumb: 'Bảo mật & Tra cứu', mode: 'setting' } },
    ],
  },
];

