import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule

@Component({
  selector: 'app-topbar',
  imports: [CommonModule], // Add CommonModule to imports
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  encapsulation: ViewEncapsulation.None,
})
export class Topbar {
  @Input() isSidebarVisible: boolean = true; // Input to receive sidebar visibility state
  @Output() toggleSidebar = new EventEmitter<void>(); // Output to emit toggle event

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
}
