import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// ── Khớp với InternshipPositionResponse.java ──
interface InternshipPosition {
  id: number;
  name: string;
  description?: string;
  departmentId?: number;
  departmentName?: string;
}

// ── Khớp với DepartmentResponse.java ──
interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  positions?: InternshipPosition[];
  memberNames?: string[];
}

// ── Khớp với DepartmentRequest.java ──
interface DepartmentPayload {
  name: string;
  description?: string;
  leaderIds?: number[];
}

// ── Khớp với InternshipPositionRequest.java ──
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
export class OrgStructureComponent implements OnInit {
  private apiUrl = 'http://localhost:8090/api';

  // ── Tab ──
  activeTab: 'departments' | 'positions' = 'departments';

  // ── Data ──
  departments: Department[] = [];
  allPositions: InternshipPosition[] = [];

  // ── UI state ──
  isLoading = false;
  isLoadingPositions = false;
  errorMessage = '';
  expandedDeptId: number | null = null;

  // ── Dept modal ──
  showDeptModal = false;
  isEditDeptMode = false;
  selectedDept: Department | null = null;
  departmentForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    description: new FormControl('')
  });

  // ── Delete dept modal ──
  showDeleteDeptModal = false;
  deptToDelete: Department | null = null;

  // ── Position modal ──
  showPositionModal = false;
  isEditPositionMode = false;
  selectedPosition: InternshipPosition | null = null;
  targetDeptForPosition: Department | null = null;
  positionForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    description: new FormControl('', [Validators.maxLength(1000)]),
    departmentId: new FormControl<number | null>(null)
  });

  // ── Delete position modal ──
  showDeletePositionModal = false;
  positionToDelete: InternshipPosition | null = null;

  // ── Toast notifications ──
  toasts: { id: number; message: string; type: 'success' | 'error' }[] = [];
  private toastCounter = 0;

  constructor(private http: HttpClient) {}

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 3000);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  // ──────────── Tab ────────────

  switchTab(tab: 'departments' | 'positions'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    if (tab === 'positions') {
      // Luôn load lại từ server khi chuyển tab — tránh stale cache
      this.loadAllPositions();
    }
  }

  // ──────────── Load ────────────

  loadDepartments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.http.get<Department[]>(`${this.apiUrl}/departments`).subscribe({
      next: (depts) => {
        this.departments = depts;
        this.isLoading = false;
        // Đồng bộ allPositions từ departments ngay sau khi load
        // để tab Vị trí thực tập có data ngay cả khi chưa chuyển tab
        this.allPositions = depts.flatMap(d => d.positions ?? []);
      },
      error: () => { this.errorMessage = 'Không thể tải danh sách phòng ban.'; this.isLoading = false; }
    });
  }

  loadAllPositions(): void {
    this.isLoadingPositions = true;
    this.http.get<InternshipPosition[]>(`${this.apiUrl}/positions`).subscribe({
      next: (positions) => {
        this.allPositions = positions;
        // Cập nhật ngược lại dept.positions để 2 tab luôn đồng nhất
        this.departments = this.departments.map(d => ({
          ...d,
          positions: positions.filter(p => p.departmentId === d.id)
        }));
        this.isLoadingPositions = false;
      },
      error: () => { this.errorMessage = 'Không thể tải danh sách vị trí.'; this.isLoadingPositions = false; }
    });
  }

  // ──────────── Helpers ────────────

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

  // ──────────── Department CRUD ────────────

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

  // ──────────── Position CRUD ────────────

  /** Từ tab Phòng ban — dept đã biết trước */
  openAddPositionFromDept(dept: Department, event: Event): void {
    event.stopPropagation();
    this.isEditPositionMode = false;
    this.selectedPosition = null;
    this.targetDeptForPosition = dept;
    this.positionForm.reset();
    this.positionForm.patchValue({ departmentId: dept.id });
    this.showPositionModal = true;
  }

  /** Từ tab Vị trí — người dùng tự chọn phòng ban */
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

    // Ưu tiên dept từ context (click từ panel phòng ban), sau đó mới lấy từ form select
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
