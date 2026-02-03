import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login'; // Import LoginComponent
import { Dashboard } from './dashboard/dashboard'; // Import DashboardComponent

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent }, // Add route for login
  { path: 'dashboard', component: Dashboard }, // Add route for dashboard
];
