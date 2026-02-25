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


export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: MainLayout, // Use MainLayout as the parent component
    children: [
      { path: '', component: Dashboard, data: { title: 'Tổng quan', mode: 'dashboard' } }, // Render Dashboard inside MainLayout's <router-outlet>
      { path: 'execution', component: Execution, data: { title: 'Thực thi', mode: 'dashboard' } },
      { path: 'management', component: Management, data: { title: 'Quản lý', mode: 'dashboard' } },
      { path: 'capacity', component: Capacity, data: { title: 'Năng lực', mode: 'dashboard' } },
      { path: 'approval', component: Approval, data: { title: 'Phê duyệt', mode: 'dashboard' } },
    ],
  },
  {
    path: 'settings',
    component: MainLayout,
    data: { title: 'Cài đặt', mode: 'setting' },
    children: [
      { path: '', redirectTo: 'hr', pathMatch: 'full' }, // Redirect to HR management by default
      { path: 'hr', component: Hr, data: { title: 'Quản trị Nhân sự', mode: 'setting' } },
      { path: 'config-review', component: ConfigReview, data: { title: 'Cấu hình Đánh giá', mode: 'setting' } },
      { path: 'partner-data', component: PartnerData, data: { title: 'Dữ liệu Đối tác', mode: 'setting' } },
      { path: 'system-operation', component: SystemOperation, data: { title: 'Vận hành hệ thống', mode: 'setting' } },
      { path: 'security', component: Security, data: { title: 'Bảo mật & Tra cứu', mode: 'setting' } },
    ],
  },
];
