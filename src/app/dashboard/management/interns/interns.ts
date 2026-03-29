import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ExportService } from '../../../services/export.service';
import { API_ENDPOINTS } from '../../../api-endpoints';

interface InternProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  major: string | null;
  universityName: string | null;
  universityId: number | null;
  positionName: string | null;
  departmentName: string | null;
  departmentId: number | null;
  mentorName: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface Department {
  id: number;
  name: string;
}

interface University {
  id: number;
  name: string;
}

@Component({
  selector: 'app-interns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Hồ sơ Intern</h1>
          <p class="text-sm text-gray-500 mt-1">Quản lý danh sách thực tập sinh</p>
        </div>
        <div class="flex gap-2">
          <!-- Lọc phòng ban -->
          <select
            [(ngModel)]="selectedDepartmentId"
            (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option [ngValue]="null">Tất cả phòng ban</option>
            @for (dept of departments; track dept.id) {
              <option [ngValue]="dept.id">{{ dept.name }}</option>
            }
          </select>
          <!-- Lọc trường đại học -->
          <select
            [(ngModel)]="selectedUniversityId"
            (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option [ngValue]="null">Tất cả trường ĐH</option>
            @for (uni of universities; track uni.id) {
              <option [ngValue]="uni.id">{{ uni.name }}</option>
            }
          </select>
          <!-- Nút xuất nhóm Excel -->
          <button
            (click)="exportGroup()"
            [disabled]="isExportingGroup"
            class="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300
                   text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
            {{ isExportingGroup ? 'Đang xuất...' : 'Xuất Excel (nhóm)' }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading) {
        <div class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Error -->
      @if (errorMsg) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-4">
          {{ errorMsg }}
        </div>
      }

      <!-- Bảng danh sách -->
      @if (!isLoading && filteredProfiles.length > 0) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600">Họ tên</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600">Trường ĐH</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600">Vị trí</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600">Phòng ban</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600">Mentor</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600">Trạng thái</th>
                  <th class="px-4 py-3 text-center font-semibold text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (p of filteredProfiles; track p.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3 font-medium text-gray-900">{{ p.name }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ p.email }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ p.universityName ?? '—' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ p.positionName ?? '—' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ p.departmentName ?? '—' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ p.mentorName ?? '—' }}</td>
                    <td class="px-4 py-3">
                      <span [class]="getStatusClass(p.status)">{{ p.status }}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <button
                        (click)="exportIndividual(p.id, p.name)"
                        [disabled]="exportingId === p.id"
                        title="Xuất báo cáo Excel"
                        class="inline-flex items-center gap-1 text-green-700 hover:text-green-900
                               disabled:text-gray-400 text-xs font-medium px-2 py-1 rounded
                               border border-green-300 hover:bg-green-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                        {{ exportingId === p.id ? '...' : 'Excel' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Hiển thị {{ filteredProfiles.length }} / {{ profiles.length }} thực tập sinh
          </div>
        </div>
      }

      @if (!isLoading && filteredProfiles.length === 0 && !errorMsg) {
        <div class="text-center py-20 text-gray-400">
          <p class="text-lg">Không có dữ liệu</p>
        </div>
      }
    </div>
  `,
  styles: ``
})
export class InternsComponent implements OnInit {
  profiles: InternProfile[] = [];
  departments: Department[] = [];
  universities: University[] = [];
  selectedDepartmentId: number | null = null;
  selectedUniversityId: number | null = null;
  isLoading = false;
  isExportingGroup = false;
  exportingId: number | null = null;
  errorMsg = '';

  constructor(
    private http: HttpClient,
    private exportService: ExportService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfiles();
      this.loadDepartments();
      this.loadUniversities();
    }
  }

  get filteredProfiles(): InternProfile[] {
    return this.profiles.filter(p => {
      if (this.selectedDepartmentId && p.departmentId !== this.selectedDepartmentId) {
        return false;
      }
      if (this.selectedUniversityId && p.universityId !== this.selectedUniversityId) {
        return false;
      }
      return true;
    });
  }

  onFilterChange(): void {
    // Filter is reactive via the getter; no action needed
  }

  private loadProfiles(): void {
    this.isLoading = true;
    this.http.get<any[]>(API_ENDPOINTS.Interns.base)
      .subscribe({
        next: (data) => {
          this.profiles = data.map(p => ({
            id: p.id,
            userId: p.userId,
            name: p.fullName ?? '—',
            email: p.email ?? '—',
            major: p.major ?? null,
            universityName: p.universityName ?? null,
            universityId: p.universityId ?? null,
            positionName: p.positionName ?? null,
            departmentName: p.departmentName ?? null,
            departmentId: p.departmentId ?? null,
            mentorName: p.mentorName ?? null,
            status: p.status ?? '—',
            startDate: p.startDate ?? null,
            endDate: p.endDate ?? null,
          }));
          this.isLoading = false;
        },
        error: () => {
          this.errorMsg = 'Không thể tải danh sách intern.';
          this.isLoading = false;
        }
      });
  }

  private loadDepartments(): void {
    this.http.get<any[]>(API_ENDPOINTS.Departments.base)
      .subscribe({
        next: (data) => {
          this.departments = data.map(d => ({ id: d.id, name: d.name }));
        },
        error: () => {}
      });
  }

  private loadUniversities(): void {
    this.http.get<any[]>(API_ENDPOINTS.Universities.base)
      .subscribe({
        next: (data) => {
          this.universities = data.map(u => ({ id: u.id, name: u.name }));
        },
        error: () => {}
      });
  }

  exportIndividual(internId: number, internName: string): void {
    this.exportingId = internId;
    this.exportService.exportInternExcel(internId).subscribe({
      next: (blob) => {
        const safeName = internName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '-');
        const filename = `bao-cao-${safeName}.xlsx`;
        this.exportService.downloadBlob(blob, filename);
        this.exportingId = null;
      },
      error: () => {
        alert('Xuất báo cáo thất bại. Vui lòng thử lại.');
        this.exportingId = null;
      }
    });
  }

  exportGroup(): void {
    this.isExportingGroup = true;
    const deptId = this.selectedDepartmentId ?? undefined;
    const uniId = this.selectedUniversityId ?? undefined;
    this.exportService.exportGroupExcel(deptId, uniId).subscribe({
      next: (blob) => {
        const parts = [];
        if (deptId) parts.push(`phong-ban-${deptId}`);
        if (uniId) parts.push(`truong-${uniId}`);
        const suffix = parts.length > 0 ? parts.join('-') : 'tat-ca';
        this.exportService.downloadBlob(blob, `bao-cao-nhom-${suffix}.xlsx`);
        this.isExportingGroup = false;
      },
      error: () => {
        alert('Xuất báo cáo nhóm thất bại. Vui lòng thử lại.');
        this.isExportingGroup = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const base = 'inline-block px-2 py-0.5 rounded-full text-xs font-medium ';
    switch (status) {
      case 'In_Progress': return base + 'bg-blue-100 text-blue-700';
      case 'Completed':   return base + 'bg-green-100 text-green-700';
      case 'Terminated':  return base + 'bg-red-100 text-red-700';
      case 'Extended':    return base + 'bg-yellow-100 text-yellow-700';
      default:            return base + 'bg-gray-100 text-gray-600';
    }
  }
}