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

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: MainLayout, // Use MainLayout as the parent component
    children: [
      { path: '', component: Dashboard }, // Render Dashboard inside MainLayout's <router-outlet>
      // Other dashboard-related routes can be added here
    ],
  },
  {
    path: 'settings',
    component: MainLayout,
    data: { breadcrumb: 'Cài đặt' },
    children: [
      { path: '', redirectTo: 'hr', pathMatch: 'full' }, // Redirect to HR management by default
      { path: 'hr', component: Hr, data: { breadcrumb: 'Quản trị Nhân sự' } },
      { path: 'config-review', component: ConfigReview, data: { breadcrumb: 'Cấu hình Đánh giá' } },
      { path: 'partner-data', component: PartnerData, data: { breadcrumb: 'Dữ liệu Đối tác' } },
      { path: 'system-operation', component: SystemOperation, data: { breadcrumb: 'Vận hành hệ thống' } },
      { path: 'security', component: Security, data: { breadcrumb: 'Bảo mật & Tra cứu' } },
    ],
  },
];
