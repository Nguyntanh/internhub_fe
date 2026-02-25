import { Component, ViewEncapsulation } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar'; // Import Sidebar component
import { Topbar } from '../topbar/topbar'; // Import Topbar component
import { RouterModule } from '@angular/router'; // Import RouterModule

@Component({
  selector: 'app-main-layout',
  imports: [Sidebar, Topbar, RouterModule], // Add RouterModule to imports
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  encapsulation: ViewEncapsulation.None,
})
export class MainLayout {
  isSidebarOpen: boolean = true; // State to control sidebar visibility

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
