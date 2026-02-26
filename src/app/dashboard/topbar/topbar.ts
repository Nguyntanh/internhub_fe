import { Component, EventEmitter, Input, Output, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs'; // Import Observable

import { BreadcrumbService, BreadcrumbItem } from '../../shared/breadcrumb.service'; // Import BreadcrumbService and BreadcrumbItem

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  encapsulation: ViewEncapsulation.None,
})
export class Topbar implements OnInit, OnDestroy {
  @Input() isSidebarVisible: boolean = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  breadcrumbs$: Observable<BreadcrumbItem[]>; // Now an observable
  private destroy$ = new Subject<void>();
  public currentRouteMode: string = 'dashboard';

  constructor(
    public router: Router,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService // Inject BreadcrumbService
  ) {
    this.breadcrumbs$ = this.breadcrumbService.breadcrumbs$; // Assign observable
  }

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
      .subscribe(); // No longer subscribing to breadcrumbs here, handled by service

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
}