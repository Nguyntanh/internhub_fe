import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule], // Add CommonModule to imports
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  encapsulation: ViewEncapsulation.None,
})
export class Sidebar {
  @Input() isSidebarVisible: boolean = true; // Input to receive sidebar visibility state
}
