import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-org-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
<div class="p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-semibold text-gray-800">Danh sách phòng ban</h1>
    <button
      (click)="openAddModal()"
      class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors duration-200"
    >
      Thêm phòng ban
    </button>
  </div>

  <!-- Error Message -->
  <div *ngIf="errorMessage" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center justify-between">
    <span>{{ errorMessage }}</span>
    <button (click)="errorMessage = ''" class="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
  </div>

  <!-- Loading -->
  <div *ngIf="isLoading" class="flex justify-center items-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
    <span class="ml-3 text-gray-500">Đang tải...</span>
  </div>

  <!-- Table -->
  <div *ngIf="!isLoading" class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600 w-16">STT</th>
          <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600 w-48">Phòng ban</th>
          <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600">Tên</th>
          <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600">Liên hệ</th>
          <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600 w-28">Status</th>
          <th class="text-left px-6 py-3 text-sm font-semibold text-gray-600 w-28">Hành động</th>
        </tr>
      </thead>
      <tbody>
        <ng-container *ngFor="let dept of departments; let i = index">
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-700 align-top">{{ i + 1 }}</td>
            <td class="px-6 py-4 text-sm text-gray-800 font-medium align-top">{{ dept.name }}</td>
            <td class="px-6 py-4 text-sm text-gray-400 align-top">—</td>
            <td class="px-6 py-4 text-sm text-gray-400 align-top">—</td>
            <td class="px-6 py-4 text-sm text-gray-400 align-top">—</td>
            <td class="px-6 py-4 align-top">
              <div class="flex items-center space-x-3">
                <button (click)="openEditModal(dept)" class="text-blue-500 hover:text-blue-700 text-xs font-medium">Sửa</button>
                <button (click)="confirmDelete(dept)" class="text-red-500 hover:text-red-700 text-xs font-medium">Xóa</button>
              </div>
            </td>
          </tr>
        </ng-container>

        <tr *ngIf="departments.length === 0 && !isLoading">
          <td colspan="6" class="px-6 py-12 text-center text-gray-400">
            Chưa có phòng ban nào. Hãy thêm phòng ban đầu tiên.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Add/Edit Modal -->
<div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black bg-opacity-40" (click)="closeModal()"></div>
  <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-10">
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-800">
        {{ isEditMode ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới' }}
      </h2>
      <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
    </div>

    <div class="px-6 py-4" [formGroup]="departmentForm">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Tên phòng ban <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          formControlName="name"
          placeholder="Nhập tên phòng ban"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          [class.border-red-400]="departmentForm.get('name')?.invalid && departmentForm.get('name')?.touched"
        />
        <p *ngIf="departmentForm.get('name')?.invalid && departmentForm.get('name')?.touched" class="mt-1 text-xs text-red-500">
          Tên phòng ban là bắt buộc.
        </p>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
        <textarea
          formControlName="description"
          rows="3"
          placeholder="Nhập mô tả (tùy chọn)"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        ></textarea>
      </div>
    </div>

    <div class="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
      <button (click)="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">
        Hủy
      </button>
      <button
        (click)="saveDepartment()"
        [disabled]="departmentForm.invalid"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isEditMode ? 'Cập nhật' : 'Thêm mới' }}
      </button>
    </div>
  </div>
</div>

<!-- Delete Confirm Modal -->
<div *ngIf="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center">
  <div class="absolute inset-0 bg-black bg-opacity-40" (click)="cancelDelete()"></div>
  <div class="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 z-10">
    <div class="p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-2">Xác nhận xóa</h3>
      <p class="text-sm text-gray-600 mb-6">
        Bạn có chắc muốn xóa phòng ban <strong>{{ departmentToDelete?.name }}</strong>? Hành động này không thể hoàn tác.
      </p>
      <div class="flex justify-end space-x-3">
        <button (click)="cancelDelete()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Hủy</button>
        <button (click)="deleteDepartment()" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">Xóa</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: []
})
export class OrgStructureComponent implements OnInit {
  private apiUrl = 'http://localhost:8090/api';

  departments: Department[] = [];
  isLoading = false;
  errorMessage = '';

  showModal = false;
  isEditMode = false;
  selectedDepartment: Department | null = null;

  showDeleteModal = false;
  departmentToDelete: Department | null = null;

  departmentForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    description: new FormControl('', [Validators.maxLength(1000)])
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.http.get<Department[]>(`${this.apiUrl}/departments`)
      .subscribe({
        next: (data) => {
          this.departments = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Không thể tải danh sách phòng ban.';
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedDepartment = null;
    this.departmentForm.reset();
    this.showModal = true;
  }

  openEditModal(dept: Department): void {
    this.isEditMode = true;
    this.selectedDepartment = dept;
    this.departmentForm.patchValue({ name: dept.name, description: dept.description || '' });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.departmentForm.reset();
  }

  saveDepartment(): void {
    if (this.departmentForm.invalid) return;

    const payload = {
      name: this.departmentForm.value.name,
      description: this.departmentForm.value.description || ''
    };

    if (this.isEditMode && this.selectedDepartment) {
      this.http.put<Department>(
        `${this.apiUrl}/departments/${this.selectedDepartment.id}`,
        payload
      ).subscribe({
        next: (updated) => {
          const idx = this.departments.findIndex(d => d.id === updated.id);
          if (idx !== -1) this.departments[idx] = updated;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = 'Cập nhật thất bại.';
          console.error(err);
        }
      });
    } else {
      this.http.post<Department>(`${this.apiUrl}/departments`, payload)
        .subscribe({
          next: (created) => {
            this.departments = [...this.departments, created];
            this.closeModal();
          },
          error: (err) => {
            this.errorMessage = 'Thêm phòng ban thất bại.';
            console.error(err);
          }
        });
    }
  }

  confirmDelete(dept: Department): void {
    this.departmentToDelete = dept;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.departmentToDelete = null;
  }

  deleteDepartment(): void {
    if (!this.departmentToDelete) return;
    this.http.delete(`${this.apiUrl}/departments/${this.departmentToDelete.id}`)
      .subscribe({
        next: () => {
          this.departments = this.departments.filter(d => d.id !== this.departmentToDelete!.id);
          this.cancelDelete();
        },
        error: (err) => {
          this.errorMessage = 'Xóa thất bại.';
          console.error(err);
        }
      });
  }
}
