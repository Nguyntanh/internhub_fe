import { Component, EventEmitter, Input, Output, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs'; // Import Observable is not needed for this change.
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule

import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component'; // Import BreadcrumbComponent

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, RouterModule, BreadcrumbComponent, MatIconModule], // Add MatIconModule to imports
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  encapsulation: ViewEncapsulation.None,
})
export class Topbar implements OnInit, OnDestroy {
  @Input() isSidebarVisible: boolean = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  public currentRouteMode: string = 'dashboard';
  public showBackArrow: boolean = false; // New property to control back arrow visibility

  constructor(
    public router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event: NavigationEnd) => {
          // Find the currently active route (leaf route) to get its data
          let route = this.activatedRoute.root;
          while (route.firstChild) {
            route = route.firstChild;
          }
          this.currentRouteMode = route.snapshot.data['mode'] || 'dashboard'; // Update mode

          // Determine if back arrow should be shown
          this.showBackArrow = event.urlAfterRedirects.includes('/profile');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Set initial mode and back arrow visibility
    let route = this.activatedRoute.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.currentRouteMode = route.snapshot.data['mode'] || 'dashboard';
    this.showBackArrow = this.router.url.includes('/profile');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  // Method to navigate to user profile page
  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  // New method to navigate back to dashboard
  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
