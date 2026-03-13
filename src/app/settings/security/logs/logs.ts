import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AuditLogService, AuditLogItem, PagedResult, LogFilter } from './audit-log.service';

@Component({
  selector: 'app-security-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.html',
  styleUrls: ['./logs.css'],
})
export class SecurityLogsComponent implements OnInit, OnDestroy {
  logs: AuditLogItem[] = [];
  actions: string[] = [];
  paged: PagedResult | null = null;
  loading = false;
  selected: AuditLogItem | null = null;

  fromDate = '';
  toDate = '';

  filter: LogFilter = {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  };

  private readonly search$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly svc: AuditLogService) {}

  ngOnInit(): void {
    this.svc.getActions().subscribe({
      next: (data: string[]) => {
        this.actions = data;
      },
    });
    this.loadLogs();
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => {
      this.filter.page = 0;
      this.loadLogs();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLogs(): void {
    this.loading = true;
    this.svc.getLogs(this.filter).subscribe({
      next: (data: PagedResult) => {
        this.paged = data;
        this.logs = data.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    this.search$.next();
  }
  onActionChange(): void {
    this.filter.page = 0;
    this.loadLogs();
  }

  onDateChange(): void {
    this.filter.fromDate = this.fromDate ? `${this.fromDate}T00:00:00` : undefined;
    this.filter.toDate = this.toDate ? `${this.toDate}T23:59:59` : undefined;
    this.filter.page = 0;
    this.loadLogs();
  }

  sort(field: string): void {
    this.filter.sortDir =
      this.filter.sortBy === field ? (this.filter.sortDir === 'asc' ? 'desc' : 'asc') : 'desc';
    this.filter.sortBy = field;
    this.loadLogs();
  }

  sortIcon(field: string): string {
    if (this.filter.sortBy !== field) return '↕';
    return this.filter.sortDir === 'asc' ? '↑' : '↓';
  }

  goTo(page: number): void {
    if (!this.paged) return;
    if (page < 0 || page >= this.paged.totalPages) return;
    this.filter.page = page;
    this.loadLogs();
  }

  get totalPages(): number {
    return this.paged?.totalPages ?? 0;
  }

  pageNumbers(): number[] {
    const cur = this.filter.page;
    const start = Math.max(0, cur - 2);
    const end = Math.min(this.totalPages - 1, cur + 2);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  pageInfo(): string {
    if (!this.paged || !this.paged.totalElements) return '0 kết quả';
    const s = this.paged.page * this.paged.size + 1;
    const e = Math.min(s + this.paged.size - 1, this.paged.totalElements);
    return `${s}–${e} trên ${this.paged.totalElements}`;
  }

  openDetail(log: AuditLogItem): void {
    this.selected = log;
  }
  closeDetail(): void {
    this.selected = null;
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    const pad = (n: number): string => String(n).padStart(2, '0');
    return (
      `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ` +
      `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
    );
  }

  private parse(raw: string): Record<string, unknown> {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  target(raw: string): string {
    const o = this.parse(raw);
    return String(o['target'] ?? o['entity'] ?? o['targetName'] ?? '—');
  }

  summary(raw: string): string {
    const o = this.parse(raw);
    return String(o['summary'] ?? o['message'] ?? o['description'] ?? raw ?? '—');
  }

  prettyJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw || '{}';
    }
  }

  badgeClass(action: string): string {
    const a = (action ?? '').toUpperCase();
    if (a.includes('DELETE')) return 'badge-red';
    if (a.includes('CREATE') || a.includes('ADD')) return 'badge-green';
    if (a.includes('UPDATE') || a.includes('EDIT')) return 'badge-yellow';
    if (a.includes('LOGIN') || a.includes('AUTH')) return 'badge-blue';
    if (a.includes('BACKUP') || a.includes('SYSTEM')) return 'badge-purple';
    return 'badge-gray';
  }

  exportCsv(): void {
    const f: LogFilter = { ...this.filter, page: 0, size: 9999 };
    this.svc.getLogs(f).subscribe({
      next: (data: PagedResult) => {
        const hdr = ['ID', 'Thoi gian', 'Email', 'Ten', 'Hanh dong', 'IP', 'Chi tiet'];
        const rows = data.content.map((l: AuditLogItem) =>
          [
            l.id,
            this.fmtDate(l.createdAt),
            l.userEmail,
            l.userName,
            l.action,
            l.ipAddress || 'Internal',
            this.summary(l.details),
          ]
            .map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`)
            .join(','),
        );
        const csv = [hdr.join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
