import { Component, Input, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string; // SVG path or a class for an icon font
  routerLink: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule], // Add CommonModule and RouterModule to imports
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  encapsulation: ViewEncapsulation.None,
})
export class Sidebar implements OnInit, OnDestroy {
  @Input() isSidebarVisible: boolean = true;
  private destroy$ = new Subject<void>();

  dashboardMenuItems: MenuItem[] = [
    { label: 'Tổng quan', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', routerLink: '/dashboard' },
    { label: 'Thực thi', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', routerLink: '/dashboard/execution' }, // Assuming an execution route
    { label: 'Quản lý', icon: 'M19 11H5m14 0a2 2 0 012 2v2a2 2 0 01-2 2m0-6V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h2m7-5a2 2 0 01-2 2H9a2 2 0 01-2-2m7-4a2 2 0 01-2-2H9a2 2 0 00-2 2m7-4a2 2 0 01-2-2H9a2 2 0 00-2 2', routerLink: '/dashboard/management' }, // Assuming a management route
    { label: 'Năng lực', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M10 16h.01', routerLink: '/dashboard/capacity' }, // Assuming a capacity route
    { label: 'Phê duyệt', icon: 'M5 13l4 4L19 7', routerLink: '/dashboard/approval' }, // Assuming an approval route
  ];

  settingsMenuItems: MenuItem[] = [
    { label: 'Quản trị Nhân sự', icon: 'M17 20h-5V4H7m5 16V4a2 2 0 012-2h4a2 2 0 012 2v16H17zm-5 0h5', routerLink: '/settings/hr' },
    { label: 'Cấu hình Đánh giá', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', routerLink: '/settings/config-review' },
    { label: 'Dữ liệu Đối tác', icon: 'M19 11H5m14 0a2 2 0 012 2v2a2 2 0 01-2 2m0-6V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h2m7-5a2 2 0 01-2 2H9a2 2 0 01-2-2m7-4a2 2 0 01-2-2H9a2 2 0 00-2 2m7-4a2 2 0 01-2-2H9a2 2 0 00-2 2', routerLink: '/settings/partner-data' },
    { label: 'Vận hành hệ thống', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', routerLink: '/settings/system-operation' },
    { label: 'Bảo mật & Tra cứu', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.007 12.007 0 002 12c0 2.292.741 4.475 2.11 6.368L12 22l7.89-3.632A12.007 12.007 0 0022 12c0-2.292-.741-4.475-2.11-6.368z', routerLink: '/settings/security' },
  ];

  currentMenuItems: MenuItem[] = [];
  activeRoute: string = '';

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  get isSettingsRouteActive(): boolean {
    return this.router.url.startsWith('/settings');
  }

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateMenuBasedOnRoute();
      });

    this.updateMenuBasedOnRoute(); // Initial menu setup
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateMenuBasedOnRoute(): void {
    const currentUrl = this.router.url;
    if (currentUrl.startsWith('/settings')) {
      this.currentMenuItems = this.settingsMenuItems;
    } else {
      this.currentMenuItems = this.dashboardMenuItems;
    }
    this.activeRoute = currentUrl;
  }
}

