import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, Data } from '@angular/router';
import { BehaviorSubject, filter, distinctUntilChanged, map } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly _breadcrumbs = new BehaviorSubject<Breadcrumb[]>([]);
  readonly breadcrumbs$ = this._breadcrumbs.asObservable();

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      distinctUntilChanged(),
      map((event: NavigationEnd) => {
        const rawBreadcrumbs = this.getRawBreadcrumbs(this.router.routerState.snapshot.root);
        const currentUrl = event.urlAfterRedirects.split('?')[0];

        if (currentUrl.startsWith('/settings')) {
          return this.formatSettingsBreadcrumbs(rawBreadcrumbs, currentUrl);
        } else {
          return rawBreadcrumbs;
        }
      })
    ).subscribe((breadcrumbs: Breadcrumb[]) => {
      this._breadcrumbs.next(breadcrumbs);
    });
  }

  private getRawBreadcrumbs(route: ActivatedRouteSnapshot, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const routeData = route.data;
    const routeUrl = route.url.map(segment => segment.path).join('/');

    if (routeUrl) {
        url += `/${routeUrl}`;
    }

    if (routeData['breadcrumb']) {
        breadcrumbs.push({ label: routeData['breadcrumb'], url: url });
    }

    // Continue to the first child that has a path segment, or all children if it's an empty path
    // For breadcrumbs, we typically follow the "primary" outlet, which is usually the first child.
    if (route.firstChild) {
        return this.getRawBreadcrumbs(route.firstChild, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  private formatSettingsBreadcrumbs(rawBreadcrumbs: Breadcrumb[], currentUrl: string): Breadcrumb[] {
    const formattedBreadcrumbs: Breadcrumb[] = [{ label: '<', url: '/dashboard' }];

    const settingsRelatedBreadcrumbs = rawBreadcrumbs.filter(b => b.url.startsWith('/settings'));

    if (settingsRelatedBreadcrumbs.length > 0) {
      // The last one is the most specific current page
      const last = settingsRelatedBreadcrumbs[settingsRelatedBreadcrumbs.length - 1];

      // The second to last (if exists) is its direct parent within settings
      const parent = settingsRelatedBreadcrumbs.length > 1 ? settingsRelatedBreadcrumbs[settingsRelatedBreadcrumbs.length - 2] : undefined;

      if (parent && parent.label !== last.label) {
        formattedBreadcrumbs.push({
          label: `${parent.label} > ${last.label}`,
          url: last.url
        });
      } else {
        formattedBreadcrumbs.push({
          label: last.label,
          url: last.url
        });
      }
    }
    return formattedBreadcrumbs;
  }
}
