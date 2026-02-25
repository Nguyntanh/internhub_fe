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

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.buildBreadcrumbs(this.activatedRoute.root)),
        takeUntil(this.destroy$)
      )
      .subscribe((breadcrumbs) => {
        this.breadcrumbs = breadcrumbs;
      });

    // Build initial breadcrumbs
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
    let currentUrl: string = '';

    const isDashboardOrSettings = this.router.url.startsWith('/dashboard') || this.router.url.startsWith('/settings');

    if (isDashboardOrSettings) {
      breadcrumbs.push({ label: 'Dashboard', url: '/dashboard' });
      currentUrl += '/dashboard';
    }

    let currentActivatedRoute: ActivatedRoute | null = route.root;

    // Traverse the route tree to collect breadcrumb data
    while (currentActivatedRoute) {
      const childrenRoutes: ActivatedRoute[] = currentActivatedRoute.children.filter(child => child.outlet === 'primary');

      if (childrenRoutes.length === 0) {
        break; // No more primary children, stop traversing
      }

      // Move to the next primary child route
      currentActivatedRoute = childrenRoutes[0];
      
      // Ensure currentActivatedRoute is not null after assignment before accessing its properties
      if (!currentActivatedRoute) {
        break;
      }

      const routeSnapshot = currentActivatedRoute.snapshot;
      const pathSegments = routeSnapshot.url.map(segment => segment.path);
      const path = pathSegments.join('/');

      if (path && !path.startsWith('dashboard')) { // Avoid duplicating 'dashboard' segment if already added implicitly
        currentUrl += `/${path}`;
      }

      const label = routeSnapshot.data['breadcrumb'];

      if (label && !breadcrumbs.some(b => b.label === label)) {
        breadcrumbs.push({ label, url: currentUrl });
      }
    }
    
    // Special handling for the root /dashboard route to only show 'Dashboard'
    if (this.router.url === '/dashboard' && breadcrumbs.length > 1 && breadcrumbs[0].label === 'Dashboard') {
      breadcrumbs = [{ label: 'Dashboard', url: '/dashboard' }];
    } else if (!isDashboardOrSettings && breadcrumbs.length > 0) {
      // Clear breadcrumbs if not in dashboard or settings routes (e.g. on '/' or '/login')
      breadcrumbs = [];
    }

    return breadcrumbs;
  }
}
