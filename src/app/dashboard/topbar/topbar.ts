import { Component, EventEmitter, Input, Output, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs'; // Import Observable is not needed for this change.

import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component'; // Import BreadcrumbComponent

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, RouterModule, BreadcrumbComponent], // Add BreadcrumbComponent to imports
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  encapsulation: ViewEncapsulation.None,
})
export class Topbar implements OnInit, OnDestroy {
  @Input() isSidebarVisible: boolean = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  public currentRouteMode: string = 'dashboard';

  constructor(
    public router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          // Find the currently active route (leaf route) to get its data
          let route = this.activatedRoute.root;
          while (route.firstChild) {
            route = route.firstChild;
          }
          this.currentRouteMode = route.snapshot.data['mode'] || 'dashboard'; // Update mode
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Set initial mode
    let route = this.activatedRoute.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.currentRouteMode = route.snapshot.data['mode'] || 'dashboard';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  // Phương thức điều hướng đến trang hồ sơ người dùng
  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
