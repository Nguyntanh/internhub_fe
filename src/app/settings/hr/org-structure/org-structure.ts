import { Component, afterNextRender, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

interface InternshipPosition {
  id: number;
  name: string;
  description?: string;
  departmentId?: number;
  departmentName?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  positions?: InternshipPosition[];
  memberNames?: string[];
}

interface DepartmentPayload {
  name: string;
  description?: string;
  leaderIds?: number[];
}

interface PositionPayload {
  name: string;
  description?: string;
  departmentId?: number | null;
}

@Component({
  selector: 'app-org-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './org-structure.html',
  styleUrls: ['./org-structure.css']
})
export class OrgStructureComponent {
  private apiUrl = 'http://localhost:8090/api';

  activeTab: 'departments' | 'positions' = 'departments';

  departments: Department[] = [];
  allPositions: InternshipPosition[] = [];

  // ── Khởi tạo isLoading = true ngay từ đầu để tránh ExpressionChangedAfterItHasBeenCheckedError
  isLoading = true;
  isLoadingPositions = false;
  errorMessage = '';
  expandedDeptId: number | null = null;

  showDeptModal = false;
  isEditDeptMode = false;
  selectedDept: Department | null = null;
  departmentForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    description: new FormControl('')
  });

  showDeleteDeptModal = false;
  deptToDelete: Department | null = null;

  showPositionModal = false;
  isEditPositionMode = false;
  selectedPosition: InternshipPosition | null = null;
  targetDeptForPosition: Department | null = null;
  positionForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    description: new FormControl('', [Validators.maxLength(1000)]),
    departmentId: new FormControl<number | null>(null)
  });

  showDeletePositionModal = false;
  positionToDelete: InternshipPosition | null = null;

  toasts: { id: number; message: string; type: 'success' | 'error' }[] = [];
  private toastCounter = 0;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    afterNextRender(() => {
      this.loadDepartments();
    });
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 3000);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  switchTab(tab: 'departments' | 'positions'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    if (tab === 'positions') {
      this.loadAllPositions();
    }
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.http.get<Department[]>(`${this.apiUrl}/departments`)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges(); // thông báo Angular cập nhật UI
      }))
      .subscribe({
        next: (depts) => {
          this.departments = depts;
          this.allPositions = depts.flatMap(d => d.positions ?? []);
        },
        error: (err) => {
          console.error('Load departments error:', err);
          this.errorMessage = 'Không thể tải danh sách phòng ban. Vui lòng thử lại.';
        }
      });
  }

  loadAllPositions(): void {
    this.isLoadingPositions = true;
    this.http.get<InternshipPosition[]>(`${this.apiUrl}/positions`)
      .pipe(finalize(() => {
        this.isLoadingPositions = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (positions) => {
          this.allPositions = positions;
          this.departments = this.departments.map(d => ({
            ...d,
            positions: positions.filter(p => p.departmentId === d.id)
          }));
        },
        error: (err) => {
          console.error('Load positions error:', err);
          this.errorMessage = 'Không thể tải danh sách vị trí.';
        }
      });
  }

  getMemberCount(dept: Department): number { return dept.memberNames?.length ?? 0; }
  getMemberNames(dept: Department): string[] { return dept.memberNames ?? []; }
  getPositions(dept: Department): InternshipPosition[] { return dept.positions ?? []; }
  getDeptName(departmentId?: number): string {
    if (!departmentId) return '—';
    return this.departments.find(d => d.id === departmentId)?.name ?? '—';
  }

  toggleExpand(deptId: number): void {
    this.expandedDeptId = this.expandedDeptId === deptId ? null : deptId;
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getAvatarColor(name: string): string {
    const palette = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#6366f1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  openAddDeptModal(): void {
    this.isEditDeptMode = false;
    this.selectedDept = null;
    this.departmentForm.reset();
    this.showDeptModal = true;
  }

  openEditDeptModal(dept: Department, event: Event): void {
    event.stopPropagation();
    this.isEditDeptMode = true;
    this.selectedDept = dept;
    this.departmentForm.patchValue({ name: dept.name, description: dept.description || '' });
    this.showDeptModal = true;
  }

  closeDeptModal(): void { this.showDeptModal = false; this.departmentForm.reset(); }

  saveDepartment(): void {
    if (this.departmentForm.invalid) return;
    const payload: DepartmentPayload = {
      name: this.departmentForm.value.name!,
      description: this.departmentForm.value.description || '',
      leaderIds: []
    };
    if (this.isEditDeptMode && this.selectedDept) {
      this.http.put<Department>(`${this.apiUrl}/departments/${this.selectedDept.id}`, payload).subscribe({
        next: (updated) => {
          updated.positions = this.selectedDept?.positions ?? [];
          updated.memberNames = this.selectedDept?.memberNames ?? [];
          const idx = this.departments.findIndex(d => d.id === updated.id);
          if (idx !== -1) this.departments[idx] = updated;
          this.closeDeptModal();
          this.showToast(`Đã cập nhật phòng ban "${updated.name}" thành công.`);
        },
        error: () => { this.showToast('Cập nhật phòng ban thất bại.', 'error'); }
      });
    } else {
      this.http.post<Department>(`${this.apiUrl}/departments`, payload).subscribe({
        next: (created) => {
          created.positions = [];
          this.departments = [...this.departments, created];
          this.closeDeptModal();
          this.showToast(`Đã thêm phòng ban "${created.name}" thành công.`);
        },
        error: () => { this.showToast('Thêm phòng ban thất bại.', 'error'); }
      });
    }
  }

  confirmDeleteDept(dept: Department, event: Event): void {
    event.stopPropagation();
    this.deptToDelete = dept;
    this.showDeleteDeptModal = true;
  }

  cancelDeleteDept(): void { this.showDeleteDeptModal = false; this.deptToDelete = null; }

  deleteDepartment(): void {
    if (!this.deptToDelete) return;
    this.http.delete(`${this.apiUrl}/departments/${this.deptToDelete.id}`).subscribe({
      next: () => {
        const deletedId = this.deptToDelete!.id;
        const deletedName = this.deptToDelete!.name;
        this.departments = this.departments.filter(d => d.id !== deletedId);
        this.allPositions = this.allPositions.filter(p => p.departmentId !== deletedId);
        if (this.expandedDeptId === deletedId) this.expandedDeptId = null;
        this.cancelDeleteDept();
        this.showToast(`Đã xóa phòng ban "${deletedName}".`);
      },
      error: () => { this.showToast('Xóa phòng ban thất bại.', 'error'); this.cancelDeleteDept(); }
    });
  }

  openAddPositionFromDept(dept: Department, event: Event): void {
    event.stopPropagation();
    this.isEditPositionMode = false;
    this.selectedPosition = null;
    this.targetDeptForPosition = dept;
    this.positionForm.reset();
    this.positionForm.patchValue({ departmentId: dept.id });
    this.showPositionModal = true;
  }

  openAddPositionFromTab(): void {
    this.isEditPositionMode = false;
    this.selectedPosition = null;
    this.targetDeptForPosition = null;
    this.positionForm.reset();
    this.showPositionModal = true;
  }

  openEditPositionModal(position: InternshipPosition, dept: Department | null, event: Event): void {
    event.stopPropagation();
    this.isEditPositionMode = true;
    this.selectedPosition = position;
    this.targetDeptForPosition = dept;
    this.positionForm.patchValue({
      name: position.name,
      description: position.description || '',
      departmentId: position.departmentId ?? null
    });
    this.showPositionModal = true;
  }

  closePositionModal(): void {
    this.showPositionModal = false;
    this.positionForm.reset();
    this.targetDeptForPosition = null;
  }

  savePosition(): void {
    if (this.positionForm.invalid) return;

    const deptId: number | null =
      this.targetDeptForPosition?.id
      ?? (this.positionForm.value.departmentId as number | null)
      ?? null;

    const payload: PositionPayload = {
      name: this.positionForm.value.name!,
      description: this.positionForm.value.description || '',
      departmentId: deptId
    };

    if (this.isEditPositionMode && this.selectedPosition) {
      this.http.put<InternshipPosition>(`${this.apiUrl}/positions/${this.selectedPosition.id}`, payload).subscribe({
        next: (updated) => {
          this.departments = this.departments.map(d => ({
            ...d,
            positions: d.positions?.map(p => p.id === updated.id ? updated : p) ?? []
          }));
          const idx = this.allPositions.findIndex(p => p.id === updated.id);
          if (idx !== -1) this.allPositions[idx] = updated;
          this.closePositionModal();
          this.showToast(`Đã cập nhật vị trí "${updated.name}" thành công.`);
        },
        error: () => { this.showToast('Cập nhật vị trí thất bại.', 'error'); }
      });
    } else {
      this.http.post<InternshipPosition>(`${this.apiUrl}/positions`, payload).subscribe({
        next: (created) => {
          if (created.departmentId) {
            this.departments = this.departments.map(d =>
              d.id === created.departmentId
                ? { ...d, positions: [...(d.positions ?? []), created] }
                : d
            );
          }
          this.allPositions = [...this.allPositions, created];
          this.closePositionModal();
          this.showToast(`Đã thêm vị trí "${created.name}" thành công.`);
        },
        error: (err) => {
          console.error('Add position error:', err);
          this.showToast('Thêm vị trí thất bại.', 'error');
        }
      });
    }
  }

  confirmDeletePosition(position: InternshipPosition, event: Event): void {
    event.stopPropagation();
    this.positionToDelete = position;
    this.showDeletePositionModal = true;
  }

  cancelDeletePosition(): void { this.showDeletePositionModal = false; this.positionToDelete = null; }

  deletePosition(): void {
    if (!this.positionToDelete) return;
    this.http.delete(`${this.apiUrl}/positions/${this.positionToDelete.id}`).subscribe({
      next: () => {
        const deletedId = this.positionToDelete!.id;
        const deletedName = this.positionToDelete!.name;
        this.departments = this.departments.map(d => ({
          ...d,
          positions: d.positions?.filter(p => p.id !== deletedId) ?? []
        }));
        this.allPositions = this.allPositions.filter(p => p.id !== deletedId);
        this.cancelDeletePosition();
        this.showToast(`Đã xóa vị trí "${deletedName}".`);
      },
      error: () => { this.showToast('Xóa vị trí thất bại.', 'error'); this.cancelDeletePosition(); }
    });
  }
}
