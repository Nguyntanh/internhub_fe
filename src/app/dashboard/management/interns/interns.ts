import { Component, OnInit, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui-page-header/ui-page-header.component';
import * as XLSX from 'xlsx';

export type InternStatus = 'In_Progress' | 'Completed' | 'Extended' | 'Terminated';

export interface Intern {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  major: string;
  universityId: number;
  universityName: string;
  deptId: number;
  deptName: string;
  positionId: number;
  posName: string;
  status: InternStatus;
  startDate: string;
  endDate: string;
  mentorId: number;
  managerId: number;
}

interface UserItem { id: number; name: string; email: string; departmentId?: number; phone?: string; }
interface University { id: number; name: string; short: string; }
interface Department { id: number; name: string; }
interface Mentor { id: number; name: string; }
interface Manager { id: number; name: string; }
interface Position { id: number; name: string; departmentId: number; }

@Component({
  selector: 'app-interns',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatRadioModule,
    MatSnackBarModule,
    UiCardComponent,
    UiPageHeaderComponent
  ],
  templateUrl: './interns.html',
  styleUrls: ['./interns.css']
})
export class InternsComponent implements OnInit {
  private API = 'http://localhost:8090/api/interns';
  private API_UNIV = 'http://localhost:8090/api/universities';
  private API_DEPT = 'http://localhost:8090/api/departments';
  private API_POS = 'http://localhost:8090/api/positions';
  private API_MENTOR = 'http://localhost:8090/api/user/mentors';
  private API_MANAGER = 'http://localhost:8090/api/user/managers';
  private API_USERS = 'http://localhost:8090/api/admin/users/all';

  interns: Intern[] = [];
  filtered: Intern[] = [];
  isLoading = true;

  UNIVERSITIES: University[] = [];
  DEPARTMENTS: Department[] = [];
  MENTORS: Mentor[] = [];
  MANAGERS: Manager[] = [];
  ALL_POSITIONS: Position[] = [];
  DEPT_POSITIONS: Record<number, { id: number; name: string }[]> = {};

  // Form & Modals
  internForm!: FormGroup;
  isFormModalOpen = false;
  isEditMode = false;
  editingId: number | null = null;
  
  // Filters
  searchQuery = '';
  filterDept = '';
  filterStatus = '';

  displayedColumns: string[] = ['intern', 'contact', 'major', 'org', 'status', 'actions'];

  readonly STATUS_META: Record<InternStatus, { label: string; cls: string }> = {
    In_Progress: { label: 'Đang thực tập', cls: 'bg-info/10 text-info border-info/20' },
    Completed:   { label: 'Hoàn thành',    cls: 'bg-success/10 text-success border-success/20'  },
    Extended:    { label: 'Gia hạn',        cls: 'bg-warning/10 text-warning border-warning/20'   },
    Terminated:  { label: 'Nghỉ việc',      cls: 'bg-danger/10 text-danger border-danger/20' },
  };

  getStatusMeta(status: string): { label: string; cls: string } {
    const s = status as InternStatus;
    return this.STATUS_META[s] || { label: status, cls: 'bg-gray-100 text-gray-400' };
  }

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    afterNextRender(() => {
      this.buildForm();
      this.loadAllData();
    });
  }

  ngOnInit(): void {}

  loadAllData() {
    this.isLoading = true;
    this.http.get<University[]>(this.API_UNIV).subscribe(res => this.UNIVERSITIES = res);
    this.http.get<Department[]>(this.API_DEPT).subscribe(res => this.DEPARTMENTS = res);
    this.http.get<any[]>(this.API_POS).subscribe(res => {
      this.ALL_POSITIONS = res;
      res.forEach(p => {
        if (!this.DEPT_POSITIONS[p.departmentId]) this.DEPT_POSITIONS[p.departmentId] = [];
        this.DEPT_POSITIONS[p.departmentId].push({ id: p.id, name: p.name });
      });
    });
    this.http.get<Mentor[]>(this.API_MENTOR).subscribe(res => this.MENTORS = res);
    this.http.get<Manager[]>(this.API_MANAGER).subscribe(res => this.MANAGERS = res);
    this.loadInterns();
  }

  loadInterns(): void {
    this.http.get<any[]>(this.API).subscribe({
      next: (res) => {
        this.interns = res.map(i => ({
          ...i,
          deptId: i.departmentId,
          deptName: i.departmentName,
          posName: i.positionName,
        }));
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Không thể tải danh sách thực tập sinh', 'Đóng', { duration: 3000 });
      }
    });
  }

  buildForm(): void {
    this.internForm = this.fb.group({
      fullName:     ['', [Validators.required, Validators.minLength(2)]],
      email:        ['', [Validators.required, Validators.email]],
      phone:        ['', [Validators.required, Validators.pattern(/^(0|\+84)\d{9}$/)]],
      major:        [''],
      universityId: [null],
      departmentId: [null],
      positionId:   [null],
      status:       ['In_Progress'],
      startDate:    ['', Validators.required],
      endDate:      [''],
      mentorId:     [null],
      managerId:    [null],
    });

    this.internForm.get('departmentId')?.valueChanges.subscribe(() => {
      this.internForm.patchValue({ positionId: null }, { emitEvent: false });
    });
  }

  get availablePositions() {
    const deptId = this.internForm.get('departmentId')?.value;
    return deptId ? this.DEPT_POSITIONS[deptId] || [] : [];
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.interns.filter(i => {
      const matchesSearch = !q || i.fullName.toLowerCase().includes(q) || i.email.toLowerCase().includes(q);
      const matchesDept = !this.filterDept || i.deptName === this.filterDept;
      const matchesStatus = !this.filterStatus || i.status === this.filterStatus;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.editingId = null;
    this.internForm.reset({ status: 'In_Progress' });
    this.isFormModalOpen = true;
  }

  openEditModal(intern: Intern) {
    this.isEditMode = true;
    this.editingId = intern.id;
    this.internForm.patchValue({
      ...intern,
      departmentId: intern.deptId
    });
    setTimeout(() => {
      this.internForm.patchValue({ positionId: intern.positionId });
    });
    this.isFormModalOpen = true;
  }

  saveIntern() {
    if (this.internForm.invalid) return;
    const val = this.internForm.getRawValue();
    const request = this.isEditMode 
      ? this.http.put(`${this.API}/${this.editingId}`, val)
      : this.http.post(this.API, val);

    request.subscribe({
      next: () => {
        this.snackBar.open(this.isEditMode ? 'Cập nhật thành công' : 'Thêm mới thành công', 'Đóng', { duration: 3000 });
        this.loadInterns();
        this.isFormModalOpen = false;
      },
      error: () => this.snackBar.open('Có lỗi xảy ra', 'Đóng', { duration: 3000 })
    });
  }

  deleteIntern(id: number) {
    if (!confirm('Bạn có chắc muốn xóa thực tập sinh này?')) return;
    this.http.delete(`${this.API}/${id}`).subscribe(() => {
      this.snackBar.open('Đã xóa', 'Đóng', { duration: 3000 });
      this.loadInterns();
    });
  }

  triggerImport() { document.getElementById('xlsx-input')?.click(); }

  handleImport(event: Event) {
    // Logic import excel similar to original HrInternsComponent
    this.snackBar.open('Chức năng Import đang được xử lý...', 'Đóng', { duration: 2000 });
  }

  getUnivShort(univId: number): string {
    return this.UNIVERSITIES.find(u => u.id === univId)?.short || '';
  }
}
