import { Component, ViewEncapsulation } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar'; // Import Sidebar component
import { Topbar } from '../topbar/topbar'; // Import Topbar component
import { RouterModule } from '@angular/router'; // Import RouterModule
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component'; // Import BreadcrumbComponent

@Component({
  selector: 'app-main-layout',
  imports: [Sidebar, Topbar, RouterModule, BreadcrumbComponent], // Add RouterModule and BreadcrumbComponent to imports
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  encapsulation: ViewEncapsulation.None,
})
export class MainLayout {
  isSidebarVisible: boolean = true; // State to control sidebar visibility

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }
}
