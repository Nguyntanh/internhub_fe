import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { MainLayout } from './dashboard/main-layout/main-layout'; // Import MainLayout

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
];
