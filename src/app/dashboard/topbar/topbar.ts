import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  encapsulation: ViewEncapsulation.None,
})
export class Topbar {
  @Input() isSidebarOpen: boolean = true; // Input to receive sidebar state
  @Output() toggleSidebar = new EventEmitter<void>(); // Output to emit toggle event

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
}
