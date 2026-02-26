import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, Data } from '@angular/router';
import { BehaviorSubject, filter, distinctUntilChanged, map } from 'rxjs';

// New interface for granular breadcrumb items
export interface BreadcrumbItem {
  label: string;        // The display text (e.g., "Dashboard", "Cài đặt", or "<")
  url: string;          // The routerLink for this breadcrumb item
  isLast: boolean;      // True if this is the last item (current page)
  isChevron?: boolean;  // True if this item represents a chevron '<'
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly _breadcrumbs = new BehaviorSubject<BreadcrumbItem[]>([]);
  readonly breadcrumbs$ = this._breadcrumbs.asObservable();

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      distinctUntilChanged(),
      map((event: NavigationEnd) => {
        const fullPathSnapshots = this.getFullPathSnapshots(this.router.routerState.snapshot.root);
        const currentUrl = event.urlAfterRedirects.split('?')[0];

        if (currentUrl.startsWith('/settings')) {
          return this.buildSettingsBreadcrumbs(fullPathSnapshots, currentUrl);
        } else {
          return this.buildNormalBreadcrumbs(fullPathSnapshots);
        }
      })
    ).subscribe((breadcrumbs: BreadcrumbItem[]) => {
      this._breadcrumbs.next(breadcrumbs);
    });
  }

  // Helper to get all ActivatedRouteSnapshots in the current path, excluding empty paths and sorting
  private getFullPathSnapshots(route: ActivatedRouteSnapshot, path: ActivatedRouteSnapshot[] = []): ActivatedRouteSnapshot[] {
    if (route.routeConfig && route.routeConfig.path !== '') {
      path.push(route);
    }

    // Sort children to prioritize routes with specific paths over empty paths
    // This is important for correct breadcrumb segment identification
    if (route.children) {
      route.children.sort((a, b) => {
        const aPath = a.routeConfig?.path || '';
        const bPath = b.routeConfig?.path || '';
        if (aPath === '') return 1; // Empty path last
        if (bPath === '') return -1; // Empty path last
        return 0; // Maintain order
      });
    }

    if (route.firstChild) {
      this.getFullPathSnapshots(route.firstChild, path);
    }
    return path;
  }

  private buildNormalBreadcrumbs(snapshots: ActivatedRouteSnapshot[]): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    let accumulatedUrl = '';

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const routeUrl = snapshot.url.map(segment => segment.path).join('/');
      accumulatedUrl += `/${routeUrl}`;

      const breadcrumbLabel = snapshot.data['breadcrumb'];

      if (breadcrumbLabel) {
        breadcrumbs.push({
          label: breadcrumbLabel,
          url: accumulatedUrl,
          isLast: (i === snapshots.length - 1)
        });
      }
    }
    return breadcrumbs;
  }

  private buildSettingsBreadcrumbs(snapshots: ActivatedRouteSnapshot[], currentFullUrl: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    let accumulatedSettingsPath = ''; // Stores the accumulated path within /settings

    // Add initial '<' to Dashboard
    breadcrumbs.push({
      label: '<',
      url: '/dashboard',
      isLast: false,
      isChevron: true,
    });
    breadcrumbs.push({
      label: 'Dashboard', // The label for the dashboard link itself
      url: '/dashboard',
      isLast: false,
    });


    // Filter snapshots to only include those relevant to the current settings path
    const settingsPathSnapshots = snapshots.filter(s => {
      const path = s.url.map(segment => segment.path).join('/');
      // Include 'settings' segment itself and all children within it
      return path === 'settings' || currentFullUrl.includes(`/settings/${path}`);
    });

    for (let i = 0; i < settingsPathSnapshots.length; i++) {
        const snapshot = settingsPathSnapshots[i];
        const routeSegment = snapshot.url.map(segment => segment.path).join('/');
        const breadcrumbLabel = snapshot.data['breadcrumb'];

        if (breadcrumbLabel) {
            // Reconstruct the full URL for this level
            if (accumulatedSettingsPath === '') {
                accumulatedSettingsPath = `/${routeSegment}`; // e.g., /settings
            } else {
                accumulatedSettingsPath += `/${routeSegment}`; // e.g., /settings/hr
            }

            const parentUrl = accumulatedSettingsPath.substring(0, accumulatedSettingsPath.lastIndexOf('/'));
            const chevronUrl = parentUrl === '' ? '/dashboard' : parentUrl; // if parent is root, link to dashboard

            // Add the clickable chevron
            breadcrumbs.push({
                label: '<',
                url: chevronUrl,
                isLast: false,
                isChevron: true,
            });

            // Add the label for the current level
            breadcrumbs.push({
                label: breadcrumbLabel,
                url: accumulatedSettingsPath,
                isLast: (i === settingsPathSnapshots.length - 1),
                isChevron: false,
            });
        }
    }

    // A final check: if the very last breadcrumb item is a chevron, remove it or ensure it's not the last.
    if (breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1].isChevron) {
        breadcrumbs.pop(); // Remove the trailing chevron
    }
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].isLast = true; // Ensure the last non-chevron is marked as last
    }

    return breadcrumbs;
  }
}
