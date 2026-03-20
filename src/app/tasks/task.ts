import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TaskService, Task, Intern } from '../services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatRadioModule
  ],
  templateUrl: './tasks.html'
})
export class Tasks implements OnInit {

  tasks: any[] = [];
  interns: Intern[] = [];
  skills: any[] = [];

  selectedSkillId: number | null = null;

  loading = false;
  loadingInterns = false;

  displayedColumns: string[] = ['stt', 'title', 'difficulty', 'deadline', 'status', 'submission', 'intern', 'actions'];

  selectedInternId: number | null = null;
  showInternBox = false;

  searchText = '';
  statusFilter = '';

  selectedTask: any = null;
  taskDetail: any = null;
  showTaskModal = false;

  isEditing = false;
  showEditInternBox = false;

  // Review modal
  showReviewModal = false;
  reviewTaskData: any = null;
  reviewScore: number | null = null;
  reviewComment: string = '';

  editForm: any = {
    title: '',
    description: '',
    deadline: null,
    weight: 1,
    internId: null
  };

  newTask: any = {
    title: '',
    description: '',
    weight: 1,
    deadline: null
  };

  constructor(
    private taskService: TaskService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef   // FIX 1: inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadInterns();
    this.loadSkills();
  }

  loadTasks(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.taskService.getMentorTasks().subscribe({
      next: (data: any[]) => {
        if (data.length === 0) {
          this.tasks = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        // Enrich từng task với detail để lấy assignedInterns + submissionLink
        const detailRequests = data.map(task =>
          this.taskService.getTaskDetail(task.id).pipe(
            catchError(() => of(task)) // fallback về task gốc nếu lỗi
          )
        );
        forkJoin(detailRequests).subscribe({
          next: (details: any[]) => {
            this.tasks = details.map((detail, i) => ({
              ...data[i],
              ...detail,
              weight: data[i].skills?.[0]?.weight ?? detail.weight ?? 1
            }));
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            // Fallback: dùng list data nếu detail request fail
            this.tasks = data.map(task => ({
              ...task,
              weight: task.skills?.[0]?.weight ?? 1
            }));
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Lỗi load tasks:', error);
        this.tasks = [];
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open(
          'Không thể tải danh sách task. Vui lòng kiểm tra kết nối!',
          'Đóng',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  loadInterns(): void {
    this.loadingInterns = true;

    this.taskService.getInterns().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.interns = data.map(item => ({
            id: item.id,
            name: item.name || item.fullName || item.username || 'Không có tên',
            email: item.email || ''
          }));
        } else if (data && data.content && Array.isArray(data.content)) {
          this.interns = data.content.map((item: any) => ({
            id: item.id,
            name: item.name || item.fullName || item.username || 'Không có tên',
            email: item.email || ''
          }));
        } else {
          this.interns = [];
        }
        this.loadingInterns = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Lỗi load interns:', error);
        this.interns = [];
        this.loadingInterns = false;
        this.cdr.detectChanges();
        this.snackBar.open('Không thể tải danh sách Intern', 'Đóng', { duration: 5000 });
      }
    });
  }

  loadSkills(): void {
    this.taskService.getSkills().subscribe({
      next: (data) => {
        this.skills = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Lỗi load skills:', error);
        this.skills = [];
        this.snackBar.open('Không thể tải danh sách Skill', 'Đóng', { duration: 3000 });
      }
    });
  }

  getStars(weight: number): number[] {
    return Array(weight).fill(0);
  }

  get filteredTasks(): any[] {
    return this.tasks.filter(task => {
      const matchesSearch = task.title?.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesStatus = this.statusFilter ? task.status === this.statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }

  selectIntern(id: number): void {
    this.selectedInternId = id;
    this.showInternBox = false;
  }

  isInternSelected(id: number): boolean {
    return this.selectedInternId === id;
  }

  getInternName(id: number): string {
    if (!id) return '';
    const intern = this.interns.find(i => i.id === id);
    return intern ? intern.name : `Intern #${id}`;
  }

  getSkillName(skillId: number): string {
    if (!skillId) return '';
    const skill = this.skills.find(s => s.id === skillId);
    return skill ? skill.name : `Skill #${skillId}`;
  }

  createTask(): void {
    if (!this.newTask.title || !this.newTask.deadline) {
      this.snackBar.open('Vui lòng nhập tiêu đề và thời hạn', 'Đóng', { duration: 3000 });
      return;
    }
    if (!this.selectedSkillId) {
      this.snackBar.open('Vui lòng chọn Skill', 'Đóng', { duration: 3000 });
      return;
    }
    if (!this.selectedInternId) {
      this.snackBar.open('Vui lòng chọn 1 Intern', 'Đóng', { duration: 3000 });
      return;
    }

    const deadlineDate = new Date(this.newTask.deadline);
    deadlineDate.setHours(23, 59, 59);

    const payload: Task = {
      title: this.newTask.title,
      description: this.newTask.description,
      deadline: deadlineDate.toISOString(),
      internIds: [this.selectedInternId],
      skills: [{ skillId: this.selectedSkillId, weight: this.newTask.weight ?? 1 }]
    };

    this.taskService.createTask(payload).subscribe({
      next: () => {
        this.snackBar.open('Tạo task thành công', 'Đóng', { duration: 3000 });
        // FIX 3: dùng setTimeout để tránh NG0100 — reset form SAU khi Angular đã check xong cycle hiện tại
        setTimeout(() => {
          this.resetNewTaskForm();
          this.cdr.detectChanges();
        }, 0);
        this.loadTasks();
      },
      error: (error) => {
        console.error('Lỗi tạo task:', error);
        this.snackBar.open('Tạo task thất bại: ' + (error.message || 'Vui lòng thử lại'), 'Đóng', { duration: 5000 });
      }
    });
  }

  resetNewTaskForm(): void {
    this.newTask = { title: '', description: '', weight: 1, deadline: null };
    this.selectedInternId = null;
    this.selectedSkillId = null;
    this.showInternBox = false;
  }

  viewTask(task: any): void {
    this.taskService.getTaskDetail(task.id).subscribe({
      next: (data) => {
        this.selectedTask = task;
        this.taskDetail = { ...data, weight: task.weight };
        if (data.skills && data.skills.length > 0) {
          this.selectedSkillId = data.skills[0].skillId;
        }
        setTimeout(() => {
          this.showTaskModal = true;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Lỗi load task detail:', error);
        this.snackBar.open('Không thể tải chi tiết task', 'Đóng', { duration: 3000 });
      }
    });
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.isEditing = false;
    this.showEditInternBox = false;
  }

  startEditing(): void {
    this.isEditing = true;
    this.editForm = {
      title: this.taskDetail?.title || '',
      description: this.taskDetail?.description || '',
      deadline: this.taskDetail?.deadline ? new Date(this.taskDetail.deadline) : null,
      weight: this.taskDetail?.weight || 1,
      internId: this.taskDetail?.assignedInterns?.[0]?.id || null
    };
    if (this.taskDetail?.skills?.length > 0) {
      this.selectedSkillId = this.taskDetail.skills[0].skillId;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.showEditInternBox = false;
  }

  selectEditIntern(id: number): void {
    this.editForm.internId = id;
    this.showEditInternBox = false;
  }

  saveEdit(): void {
    if (!this.selectedTask) return;
    if (!this.editForm.title || !this.editForm.deadline) {
      this.snackBar.open('Vui lòng nhập tiêu đề và thời hạn', 'Đóng', { duration: 3000 });
      return;
    }
    if (!this.selectedSkillId) {
      this.snackBar.open('Vui lòng chọn Skill', 'Đóng', { duration: 3000 });
      return;
    }
    if (!this.editForm.internId) {
      this.snackBar.open('Vui lòng chọn 1 Intern', 'Đóng', { duration: 3000 });
      return;
    }

    const deadlineDate = new Date(this.editForm.deadline);
    deadlineDate.setHours(23, 59, 59);

    const payload = {
      title: this.editForm.title,
      description: this.editForm.description,
      deadline: deadlineDate.toISOString(),
      internIds: [this.editForm.internId],
      skills: [{ skillId: this.selectedSkillId, weight: this.editForm.weight }]
    };

    this.taskService.updateTask(this.selectedTask.id, payload).subscribe({
      next: () => {
        this.snackBar.open('Cập nhật task thành công', 'Đóng', { duration: 3000 });
        this.loadTasks();
        this.isEditing = false;
        this.showTaskModal = false;
      },
      error: (error) => {
        console.error('Lỗi update task:', error);
        this.snackBar.open('Cập nhật task thất bại', 'Đóng', { duration: 3000 });
      }
    });
  }

  // ─── Review ────────────────────────────────────────────────────────────────

  openReviewModal(task: any): void {
    // FIX NG0100: set data trước, mở modal sau 1 tick để tránh ExpressionChanged
    this.reviewScore = null;
    this.reviewComment = '';
    this.reviewTaskData = null;

    this.taskService.getTaskDetail(task.id).subscribe({
      next: (detail) => {
        this.reviewTaskData = { ...task, ...detail, weight: task.weight };
        // setTimeout 0 đảm bảo Angular đã hoàn thành cycle hiện tại trước khi set showReviewModal
        setTimeout(() => {
          this.showReviewModal = true;
          this.cdr.detectChanges();
        }, 0);
      },
      error: () => {
        this.reviewTaskData = task;
        setTimeout(() => {
          this.showReviewModal = true;
          this.cdr.detectChanges();
        }, 0);
        this.snackBar.open('Không thể tải chi tiết task', 'Đóng', { duration: 3000 });
      }
    });
  }

  closeReviewModal(): void {
    // setTimeout tránh NG0100: Angular đã check [disabled] binding trong cycle hiện tại,
    // set showReviewModal=false ngay lập tức làm expression thay đổi sau khi đã check
    setTimeout(() => {
      this.showReviewModal = false;
      this.reviewTaskData = null;
      this.reviewScore = null;
      this.reviewComment = '';
      this.cdr.detectChanges();
    }, 0);
  }

  isValidScore(): boolean {
    if (this.reviewScore === null || this.reviewScore === undefined) return false;
    const v = Number(this.reviewScore);
    // UI dùng thang 0-10 cho dễ nhập, gửi backend sẽ chia đôi về 0-5
    return !isNaN(v) && v >= 0 && v <= 10;
  }

  submitReview(): void {
    if (!this.isValidScore()) {
      this.snackBar.open('Điểm phải từ 0 đến 10', 'Đóng', { duration: 3000 });
      return;
    }

    // FIX 4: Backend ReviewTaskRequest cần `skills[]` chứa skillId, ratingScore, reviewComment
    // Không phải `score` hay `comment` ở root level
    const task = this.reviewTaskData;
    const taskSkillId = task?.skills?.[0]?.skillId ?? null;

    if (!taskSkillId) {
      this.snackBar.open('Task này chưa có skill — không thể chấm điểm', 'Đóng', { duration: 4000 });
      return;
    }

    // UI thang 0-10 → backend thang 0-5 (chia đôi, làm tròn 2 chữ số)
    const backendScore = Math.round((Number(this.reviewScore) ) * 100) / 100;

    const payload = {
      skills: [
        {
          skillId: taskSkillId,
          ratingScore: backendScore,
          reviewComment: this.reviewComment || ''
        }
      ]
    };

    this.taskService.reviewTask(task.id, payload).subscribe({
      next: () => {
        this.closeReviewModal(); // đóng trước, load sau — tránh NG0100
        this.snackBar.open('Chấm điểm thành công!', 'Đóng', { duration: 3000 });
        setTimeout(() => this.loadTasks(), 50); // đợi modal đóng xong rồi reload
      },
      error: (error) => {
        // Backend trả plain text "Task reviewed successfully" → HttpClient parse lỗi
        // nhưng status vẫn là 200 → treat như thành công
        if (error?.status === 200 || error?.status === 0) {
          this.closeReviewModal();
          this.snackBar.open('Chấm điểm thành công!', 'Đóng', { duration: 3000 });
          setTimeout(() => this.loadTasks(), 50);
          return;
        }
        console.error('Lỗi review task:', error);
        const msg = error?.error?.message || error?.message || 'Chấm điểm thất bại';
        this.snackBar.open(msg, 'Đóng', { duration: 4000 });
      }
    });
  }

  deleteTask(task: any): void {
    if (!confirm('Bạn có chắc muốn xóa task?')) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.snackBar.open('Đã xóa task', 'Đóng', { duration: 3000 });
        this.loadTasks();
        this.closeTaskModal();
      },
      error: (error) => {
        console.error('Lỗi xóa task:', error);
        this.snackBar.open('Xóa task thất bại', 'Đóng', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warn';
      case 'submitted': return 'accent';
      case 'reviewed': return 'primary';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'border-orange-200 bg-orange-50';
      case 'submitted': return 'border-yellow-200 bg-yellow-50';
      case 'reviewed': return 'border-green-200 bg-green-50';
      default: return '';
    }
  }

  canReview(task: any): boolean {
    return !!(task?.submissionLink || task?.status === 'Submitted');
  }

  refreshData(): void {
    this.loadTasks();
    this.loadInterns();
    this.loadSkills();
  }
}
