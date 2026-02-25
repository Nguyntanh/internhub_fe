import { Component, EventEmitter, Input, Output, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface Breadcrumb {
  label: string;
  url: string;
}

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

  breadcrumbs: Breadcrumb[] = [];
  private destroy$ = new Subject<void>();
  public currentRouteMode: string = 'dashboard'; // New property

  constructor(public router: Router, private activatedRoute: ActivatedRoute) {}

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
          return this.buildBreadcrumbs(this.activatedRoute.root);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((breadcrumbs) => {
        this.breadcrumbs = breadcrumbs;
      });

    // Build initial breadcrumbs and set initial mode
    let route = this.activatedRoute.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.currentRouteMode = route.snapshot.data['mode'] || 'dashboard';
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  private buildBreadcrumbs(route: ActivatedRoute): Breadcrumb[] {
    let breadcrumbs: Breadcrumb[] = [];

    // Find the currently active route (leaf route)
    let currentRoute: ActivatedRoute = route; // Ensure currentRoute is not null here
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    const routeData = currentRoute.snapshot.data;
    const title = routeData['title'];
    // const mode = routeData['mode']; // Mode will be used in template

    if (title) {
        breadcrumbs.push({ label: title, url: this.router.url });
    }
    
    return breadcrumbs;
  }

  // Helper function to identify dashboard family routes
  public isDashboardFamilyRoute(url: string): boolean {
    return url.startsWith('/dashboard') ||
           url.startsWith('/execution') ||
           url.startsWith('/management') ||
           url.startsWith('/capacity') ||
           url.startsWith('/approval');
  }
}