import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
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
interface University {
  id: number;
  name: string;
  short: string;
}

interface Department {
  id: number;
  name: string;
}

interface Mentor {
  id: number;
  name: string;
}

interface Manager {
  id: number;
  name: string;
}

interface Position {
  id: number;
  name: string;
  departmentId: number;
}

@Component({
  selector: 'app-hr-interns',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: `./intern-profile-management.html`,
  styleUrl: `./intern-profile.css`,
})
export class HrInternsComponent implements OnInit {

  private API = 'http://localhost:8090/api/interns';
  private API_UNIV = 'http://localhost:8090/api/universities';
  private API_DEPT = 'http://localhost:8090/api/departments';
  private API_POS = 'http://localhost:8090/api/positions';
  private API_MENTOR = 'http://localhost:8090/api/user/mentors';
  private API_MANAGER = 'http://localhost:8090/api/user/managers';
  UNIVERSITIES: University[] = [];
  DEPARTMENTS: Department[] = [];
  MENTORS: Mentor[] = [];
  MANAGERS: Manager[] = [];
  ALL_POSITIONS: Position[] = [];
  DEPT_POSITIONS: Record<number, { id: number; name: string }[]> = {};


  readonly STATUS_META: Record<InternStatus, { label: string; cls: string }> = {
    In_Progress: { label: 'Đang thực tập', cls: 's-inprogress' },
    Completed: { label: 'Hoàn thành', cls: 's-completed' },
    Extended: { label: 'Gia hạn', cls: 's-extended' },
    Terminated: { label: 'Nghỉ việc', cls: 's-terminated' },
  };

  readonly STATUS_KEYS = Object.keys(this.STATUS_META) as InternStatus[];

  interns: Intern[] = [];
  filtered: Intern[] = [];

  searchQuery = '';
  filterDept = '';
  filterPos = '';
  filterUniv = '';
  filterStatus = '';
  filterPositionOptions: string[] = [];

  isFormModalOpen = false;
  isDeleteModalOpen = false;
  isStatusModalOpen = false;
  isEditMode = false;

  editingId: number | null = null;
  deletingIntern: Intern | null = null;
  statusIntern: Intern | null = null;
  selectedStatus: InternStatus = 'In_Progress';

  duplicateError = '';
  toastMessage = '';
  showToastFlag = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  internForm!: FormGroup;

  get availablePositions() {
    return this.DEPT_POSITIONS[this.internForm.get('departmentId')?.value] || [];
  }

  get hasActiveFilter(): boolean {
    return !!(this.searchQuery || this.filterDept || this.filterPos || this.filterUniv || this.filterStatus);
  }

  constructor(private fb: FormBuilder, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.buildForm();

    this.loadUniversities();
    this.loadDepartments();
    this.loadPositions();
    this.loadInterns();
    this.loadManagers();
    this.loadMentors();

    this.cdr.detectChanges();

  }

  loadMentors() {
    this.http.get<Mentor[]>(this.API_MENTOR)
      .subscribe(res => this.MENTORS = res);
  }
  loadManagers() {
    this.http.get<Manager[]>(this.API_MANAGER)
      .subscribe(res => this.MANAGERS = res);
  }
  loadUniversities() {
    this.http.get<University[]>(this.API_UNIV)
      .subscribe(res => {
        this.UNIVERSITIES = res;
        console.log('Universities trong DB:', res.map(u => u.name)); // ← thêm
      });
  }
  loadDepartments() {
    this.http.get<Department[]>(this.API_DEPT)
      .subscribe(res => {
        this.DEPARTMENTS = res;
        console.log('Departments trong DB:', res.map(d => d.name)); // ← thêm
      });
  }
  loadPositions() {
    this.DEPT_POSITIONS = {};
    this.http.get<any[]>(this.API_POS).subscribe(res => {
      this.ALL_POSITIONS = res.map(p => ({  // ← lưu toàn bộ danh sách
        id: p.id,
        name: p.name,
        departmentId: p.departmentId
      }));

      res.forEach(p => {
        if (!this.DEPT_POSITIONS[p.departmentId]) {
          this.DEPT_POSITIONS[p.departmentId] = [];
        }
        this.DEPT_POSITIONS[p.departmentId].push({ id: p.id, name: p.name });
      });


      console.log('ALL_POSITIONS:', this.ALL_POSITIONS);
    });
  }


  loadInterns(): void {
    this.http.get<any[]>(this.API).subscribe(res => {

      this.interns = res.map(i => ({
        id: i.id,
        fullName: i.fullName,
        email: i.email,
        phone: i.phone,

        major: i.major,

        universityId: i.universityId,
        universityName: i.universityName,

        deptId: i.departmentId,
        deptName: i.departmentName,

        positionId: i.positionId,
        posName: i.positionName,

        status: i.status,

        startDate: i.startDate,
        endDate: i.endDate,

        mentorId: i.mentorId,
        managerId: i.managerId
      }));

      this.applyFilters();
      this.cdr.detectChanges();
    });
  }

  buildForm(): void {
    this.internForm = this.fb.group({
      fullName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZÀ-ỹà-ỹĂăÂâĐđÊêÔôƠơƯư\s]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(0|\+84)\d{9}$/)]],
      major: [''],
      universityId: [null],
      departmentId: [null],
      positionId:   [null],
      status: ['In_Progress'],
      startDate: ['', Validators.required],
      endDate: [''],
      mentorId: [''],
      managerId: [''],
    },{
      validators: (group: AbstractControl) => {
        const start = group.get('startDate')?.value;
        const end   = group.get('endDate')?.value;
        if (start && end && new Date(end) <= new Date(start)) {
          return { dateRange: true };
        }
        return null;
      }
    });

    this.internForm.get('departmentId')?.valueChanges.subscribe(() => {
      this.internForm.patchValue({ positionId: null }, { emitEvent: false });
    });
    this.internForm.get('endDate')?.valueChanges.subscribe(endDate => {
      if (!endDate) return;
      const now = new Date();
      const end = new Date(endDate);
      if (end < now) {
        this.internForm.patchValue({ status: 'Completed' }, { emitEvent: false });
      }
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.interns.filter(i => {
      if (q && !i.fullName.toLowerCase().includes(q) && !i.email.toLowerCase().includes(q)) return false;
      if (this.filterDept && i.deptName !== this.filterDept) return false;
      if (this.filterPos && i.posName !== this.filterPos) return false;
      if (this.filterUniv && i.universityId !== Number(this.filterUniv)) return false;
      if (this.filterStatus && i.status !== this.filterStatus) return false;
      return true;
    });
  }

  onDeptFilterChange(): void {
    this.filterPos = '';
    const dept = this.DEPARTMENTS.find(d => d.name === this.filterDept);
    this.filterPositionOptions = dept
      ? (this.DEPT_POSITIONS[dept.id] || []).map(p => p.name)
      : [];
    this.applyFilters();
    this.cdr.detectChanges();
  }

  clearAllFilters(): void {
    this.searchQuery = this.filterDept = this.filterPos = this.filterUniv = this.filterStatus = '';
    this.filterPositionOptions = [];
    this.applyFilters();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.duplicateError = '';
    this.internForm.reset({ status: 'In_Progress' });
    this.isFormModalOpen = true;
    this.cdr.detectChanges();
  }

  openEditModal(intern: Intern): void {
    this.isEditMode = true;
    this.editingId = intern.id;
    this.duplicateError = '';

    // Reset form trước
    this.internForm.reset({ status: 'In_Progress' });

    // Patch departmentId TRƯỚC, có emitEvent: true để trigger valueChanges → load positions
    this.internForm.patchValue({ departmentId: intern.deptId }, { emitEvent: true });

    // Sau đó patch các field còn lại, patch positionId SAU CÙNG
    this.internForm.patchValue({
      fullName:     intern.fullName,
      email:        intern.email,
      phone:        intern.phone,
      major:        intern.major,
      universityId: intern.universityId,

      startDate:    intern.startDate,
      endDate:      intern.endDate,
      mentorId:     intern.mentorId,
      managerId:    intern.managerId,

      status:       this.resolveStatus(intern.status, intern.endDate)
    }, { emitEvent: false });

    // Patch positionId sau cùng — lúc này availablePositions đã có data
    setTimeout(() => {
      this.internForm.patchValue({ positionId: intern.positionId }, { emitEvent: false });
    }, 0);

    this.isFormModalOpen = true;
    this.cdr.detectChanges();
  }
  private resolveStatus(currentStatus: InternStatus, endDate: string | null): InternStatus {
    if (!endDate) return currentStatus;
    const end = new Date(endDate);
    if (!isNaN(end.getTime()) && end < new Date()) {
      return 'Completed';
    }
    return currentStatus;
  }
  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.duplicateError = '';
  }

  saveIntern(): void {
    this.duplicateError = '';
    if (this.internForm.invalid) { this.internForm.markAllAsTouched(); return; }

    const val = this.internForm.getRawValue();

    const dupEmail = this.interns.find(i => i.email === val.email && i.id !== this.editingId);
    if (dupEmail) { this.duplicateError = `Email "${val.email}" đã tồn tại trong hệ thống.`; return; }

    if (this.isEditMode && this.editingId) {

      this.http.put(`${this.API}/${this.editingId}`, val)
        .subscribe(() => {
          this.showToastMessage('Cập nhật hồ sơ thành công!');
          this.loadInterns();
          this.closeFormModal();
        });

    } else {

      this.http.post(this.API, val)
        .subscribe(() => {
          this.showToastMessage('Tạo hồ sơ thực tập sinh thành công!');
          this.loadInterns();
          this.closeFormModal();
        });

    }
  }

  openDeleteModal(intern: Intern): void {
    this.deletingIntern = intern;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deletingIntern = null;
  }

  confirmDelete(): void {
    if (!this.deletingIntern) return;

    this.http.delete(`${this.API}/${this.deletingIntern.id}`)
      .subscribe(() => {
        this.showToastMessage('Đã xóa hồ sơ thực tập sinh.');
        this.loadInterns();
        this.closeDeleteModal();
      });
  }

  openStatusModal(intern: Intern): void {
    this.statusIntern = intern;
    this.selectedStatus = intern.status;
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.statusIntern = null;
  }

  saveStatus(): void {
    if (!this.statusIntern) return;

    this.http.patch(`${this.API}/${this.statusIntern.id}/status`, { status: this.selectedStatus })
      .subscribe(() => {
        this.showToastMessage('Cập nhật trạng thái thành công!');
        this.loadInterns();
        this.closeStatusModal();
      });
  }

  triggerImport(): void {
    document.getElementById('xlsx-input')?.click();
  }

  handleImport(event: Event): void {
    console.log('handleImport được gọi!');
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData: any[] = XLSX.utils.sheet_to_json(
          worksheet,
          {
            header: 1,
            defval: '',
            raw: false
          } as any
        );

        // Bỏ header row (dòng đầu tiên)
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);

        const internsToImport = rows
          .filter((row: any[]) => row.some((cell: any) => cell !== ''))
          .map((row: any[], index: number) => this.mapRowToIntern(row, headers, index));

        // Kiểm tra lỗi cơ bản trước khi gửi
        const errors = internsToImport
          .map(i => i.error)
          .filter(Boolean);

        if (errors.length > 0) {
          console.log('Chi tiết lỗi:', errors); // ← thêm dòng này
          this.showToastMessage(`Có ${errors.length} dòng lỗi: ${errors.join(', ')}`);
          return;
        }

        // Gửi lần lượt từng intern (hoặc dùng Promise.all nếu muốn nhanh hơn)
        this.importInternsSequentially(internsToImport.map(i => i.data));

      } catch (err) {
        console.error('Lỗi đọc file Excel:', err);
        this.showToastMessage('File Excel không hợp lệ hoặc bị hỏng!');
      }
    };

    reader.readAsArrayBuffer(file);
    input.value = ''; // reset input file

  }

  private mapRowToIntern(row: any[], headers: string[], rowIndex: number): { data?: any; error?: string } {
    const fullName   = (row[0] || '').toString().trim();
    const email      = (row[1] || '').toString().trim();
    const phone      = (row[2] || '').toString().trim();
    const major      = (row[3] || '').toString().trim();
    const university = (row[4] || '').toString().trim();
    const department = (row[5] || '').toString().trim();
    const position   = (row[6] || '').toString().trim();
    const startDate  = row[7] ?? '';
    const endDate    = row[8] ?? '';
    const statusRaw  = (row[9] || '').toString().trim();

    if (!fullName || !email || !phone) {
      return { error: `Dòng ${rowIndex + 2}: Thiếu họ tên / email / SĐT` };
    }

    // Tìm university
    const universityObj = university
      ? this.UNIVERSITIES.find(u =>
        u.name.toLowerCase().replace(/\s+/g, ' ') === university.toLowerCase().replace(/\s+/g, ' ') ||
        u.name.toLowerCase().includes(university.toLowerCase())
      )
      : null;
    const universityId = universityObj?.id ?? null;

    // ── Tìm position trước trong ALL_POSITIONS ──
    let positionId:   number | null = null;
    let departmentId: number | null = null;

    if (position) {
      const posNorm = position.toLowerCase().replace(/\s+/g, ' ').trim();
      const positionObj = this.ALL_POSITIONS.find(p =>
        p.name.toLowerCase().replace(/\s+/g, ' ').trim() === posNorm ||
        p.name.toLowerCase().includes(posNorm)
      );

      if (positionObj) {
        positionId   = positionObj.id;
        departmentId = positionObj.departmentId; // ← lấy departmentId từ position
      } else {
        console.warn(`Dòng ${rowIndex + 2}: Không tìm thấy vị trí "${position}"`);
        console.log('Positions có sẵn:', this.ALL_POSITIONS.map(p => p.name));
      }
    }


    if (department) {
      const deptNorm = department.toLowerCase().replace(/\s+/g, ' ').trim();
      const deptObj = this.DEPARTMENTS.find(d =>
        d.name.toLowerCase().replace(/\s+/g, ' ').trim() === deptNorm ||
        d.name.toLowerCase().includes(deptNorm)
      );

      if (deptObj) {

        if (departmentId && departmentId !== deptObj.id) {
          console.warn(`Dòng ${rowIndex + 2}: Dept từ Excel (${deptObj.name}) khác dept của position (id:${departmentId}), dùng dept của position`);
        }

        if (!departmentId) departmentId = deptObj.id;
      }
    }

    // Format ngày
    const formatDate = (val: any): string | null => {
      if (!val) return null;
      if (typeof val === 'number') {
        return new Date(Math.floor(val - 25569) * 86400 * 1000).toISOString().split('T')[0];
      }
      return val.toString().trim() || null;
    };

    const end = formatDate(endDate);
    let resolvedStatus = this.mapStatus(statusRaw);
    if (end && new Date(end) < new Date()) {
      resolvedStatus = 'Completed';
    }

    return {
      data: {
        fullName,
        email,
        phone:        phone.replace(/\D/g, ''),
        major,
        universityId,
        departmentId,
        positionId,
        startDate:    formatDate(startDate),
        endDate:      end,
        status:       resolvedStatus,
        mentorId:     null,
        managerId:    null,
      }
    };
  }

  private mapStatus(raw: string): InternStatus {
    const s = (raw || '').toLowerCase().trim();
    if (s.includes('hoàn thành'))   return 'Completed';
    if (s.includes('gia hạn'))      return 'Extended';
    if (s.includes('nghỉ') || s.includes('chấm dứt')) return 'Terminated';
    return 'In_Progress';
  }

  private async importInternsSequentially(interns: any[]) {
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const intern of interns) {
      try {
        const existing = this.interns.find(i => i.email === intern.email);

        if (existing) {
          skipCount++;
        } else {
          console.log('Sending intern:', intern);  // ← thêm để xem deptId/positionId có null không
          await this.http.post(this.API, intern).toPromise();
          successCount++;
        }

      } catch (err: any) {
        if (err?.status === 409) {
          skipCount++;
        } else {
          console.warn('Lỗi import:', intern.email, err);
          errorCount++;
        }
      }
    }

    let msg = `Import hoàn tất: ${successCount} thành công`;
    if (skipCount > 0)  msg += `, ${skipCount} bỏ qua (email trùng)`;
    if (errorCount > 0) msg += `, ${errorCount} lỗi`;
    this.showToastMessage(msg);

    if (successCount > 0) this.loadInterns();
  }

  getDeptName(deptId: string): string {
    return this.DEPARTMENTS.find(d => String(d.id) === deptId)?.name || '—';
  }

  getUnivShort(univId: string): string {
    return this.UNIVERSITIES.find(u => String(u.id) === univId)?.short || '—';
  }

  getUnivFull(univId: number): string {
    return this.UNIVERSITIES.find(u => u.id === univId)?.name || '';
  }

  avatarColor(name: string): string {
    const c = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#6366f1','#f97316'];
    return c[name.charCodeAt(0) % c.length];
  }

  isInvalid(field: string): boolean {
    const ctrl = this.internForm.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  getError(field: string): string {
    const ctrl = this.internForm.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.errors['required'])   return 'Trường này là bắt buộc.';
    if (ctrl.errors['email'])      return 'Email không hợp lệ.';
    if (ctrl.errors['minlength'])  return `Tối thiểu ${ctrl.errors['minlength'].requiredLength} ký tự.`;
    if (ctrl.errors['pattern']) {
      if (field === 'fullName') return 'Họ tên không được chứa ký tự đặc biệt hoặc số.';
      return 'Số điện thoại không hợp lệ (VD: 0901234567).';
    }
    return 'Giá trị không hợp lệ.';
  }

  showToastMessage(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = msg;
    this.showToastFlag = true;
    this.toastTimer = setTimeout(() => (this.showToastFlag = false), 3000);
  }

  trackById(_: number, item: Intern): number {
    return item.id;
  }

  protected readonly String = String;
}
