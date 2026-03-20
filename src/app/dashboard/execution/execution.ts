import { Component, OnInit, inject, ChangeDetectorRef, NgZone, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { InternTaskService } from '../../shared/services/intern-task.service';
import { MicroTaskResponse, MicroTaskStatus } from '../../shared/models/micro-task.model';

@Component({
  selector: 'app-execution',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './execution.html',
  styleUrl: './execution.css',
})
export class Execution implements OnInit {
  private internTaskService = inject(InternTaskService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  activeTasks: MicroTaskResponse[] = [];
  completedTasks: MicroTaskResponse[] = [];
  isLoading = true;
  errorMessage = '';

  isModalOpen = false;
  selectedTask: MicroTaskResponse | null = null;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  activeExpanded = true;
  completedExpanded = true;

  expandedTaskIds = new Set<number>();

  submissionForm: FormGroup = this.fb.group({
    submissionNote: [''],
    submissionLink: ['', Validators.required],
  });

  selectedFile: File | null = null;
  isDragOver = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTasks();
    } else {
      this.isLoading = false;
    }
  }

  // FIX: Dùng InternTaskService (HttpClient + JwtInterceptor) thay vì fetch() thủ công
  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.internTaskService.getMyTasks().subscribe({
      next: (data: MicroTaskResponse[]) => {
        this.zone.run(() => {
          this.splitTasks(data);
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        console.error('[Execution] Failed to load tasks', err);
        this.zone.run(() => {
          if (err?.status === 401 || err?.status === 403) {
            this.errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
          } else {
            this.errorMessage = 'Không thể tải danh sách nhiệm vụ.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  // FIX: Tách logic phân loại task ra helper để dùng lại sau submit
  private splitTasks(tasks: MicroTaskResponse[]): void {
    this.activeTasks = tasks.filter(
      (t) => t.status === 'Todo' || t.status === 'In_Progress' || t.status === 'Submitted',
    );
    this.completedTasks = tasks.filter(
      (t) => t.status === 'Reviewed' || t.status === 'Rejected',
    );
  }

  openSubmitModal(task: MicroTaskResponse, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    this.selectedTask = task;
    this.isModalOpen = true;
    this.submitSuccess = false;
    this.submitError = '';
    this.selectedFile = null;
    this.submissionForm.reset();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedTask = null;
    this.submitSuccess = false;
    this.submitError = '';
    this.selectedFile = null;
  }

  toggleTaskExpand(taskId: number): void {
    if (this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.delete(taskId);
    } else {
      this.expandedTaskIds.add(taskId);
    }
  }

  isTaskExpanded(taskId: number): boolean {
    return this.expandedTaskIds.has(taskId);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFileSelect(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.handleFileSelect(input.files[0]);
    }
  }

  handleFileSelect(file: File): void {
    const allowedTypes = ['application/pdf', 'application/zip', 'image/jpeg', 'image/png'];
    const maxSize = 20 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.submitError = 'Chỉ chấp nhận file PDF, ZIP, JPG, PNG.';
      return;
    }
    if (file.size > maxSize) {
      this.submitError = 'File không được vượt quá 20MB.';
      return;
    }
    this.submitError = '';
    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onSubmit(): void {
    if (!this.selectedTask) return;

    if (this.submissionForm.invalid) {
      this.submissionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    const request = {
      submissionLink: this.submissionForm.value.submissionLink,
      submissionNote: this.submissionForm.value.submissionNote || undefined,
    };

    this.internTaskService.submitTask(this.selectedTask.id, request).subscribe({
      next: (updatedTask) => {
        this.isSubmitting = false;
        this.submitSuccess = true;

        // FIX: Cập nhật đúng list sau khi submit
        // Nếu task trả về status Reviewed/Rejected → chuyển sang completedTasks
        // Nếu trả về Submitted → cập nhật tại chỗ trong activeTasks
        this.updateTaskInLists(updatedTask);

        setTimeout(() => this.closeModal(), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || 'Nộp bài thất bại.';
        this.submitError = msg;
      },
    });
  }

  // FIX: Helper cập nhật task đúng list sau khi có status mới từ server
  private updateTaskInLists(updatedTask: MicroTaskResponse): void {
    const isCompleted =
      updatedTask.status === 'Reviewed' || updatedTask.status === 'Rejected';

    if (isCompleted) {
      // Xóa khỏi active, thêm vào completed
      this.activeTasks = this.activeTasks.filter((t) => t.id !== updatedTask.id);
      const alreadyInCompleted = this.completedTasks.some((t) => t.id === updatedTask.id);
      if (!alreadyInCompleted) {
        this.completedTasks = [updatedTask, ...this.completedTasks];
      }
    } else {
      // Cập nhật tại chỗ trong activeTasks (e.g. Todo→Submitted)
      const idx = this.activeTasks.findIndex((t) => t.id === updatedTask.id);
      if (idx !== -1) {
        this.activeTasks = [
          ...this.activeTasks.slice(0, idx),
          updatedTask,
          ...this.activeTasks.slice(idx + 1),
        ];
      }
    }
    this.cdr.detectChanges();
  }

  getStatusLabel(status: MicroTaskStatus): string {
    const map: Record<MicroTaskStatus, string> = {
      Todo: 'Chưa bắt đầu',
      In_Progress: 'Đang thực hiện',
      Submitted: 'Đã nộp',
      Reviewed: 'Đã đánh giá',
      Rejected: 'Bị từ chối',
    };
    return map[status] || status;
  }

  getStatusClass(status: MicroTaskStatus): string {
    const map: Record<MicroTaskStatus, string> = {
      Todo: 'status-todo',
      In_Progress: 'status-inprogress',
      Submitted: 'status-submitted',
      Reviewed: 'status-reviewed',
      Rejected: 'status-rejected',
    };
    return map[status] || '';
  }

  canSubmit(status: MicroTaskStatus): boolean {
    return status === 'Todo' || status === 'In_Progress';
  }

  formatDeadline(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `Hạn nộp: ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}
