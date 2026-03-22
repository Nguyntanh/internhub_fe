import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../auth/role.service'; // Adjust path if necessary
import { InternDashboardComponent } from './intern-dashboard/intern-dashboard.component'; // Adjust path if necessary

@Component({
  selector: 'app-dashboard',
  standalone: true, // Mark as standalone
  imports: [CommonModule, InternDashboardComponent], // Add CommonModule and InternDashboardComponent
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  isIntern: boolean = false;

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.isIntern = this.roleService.isIntern();
  }
}
