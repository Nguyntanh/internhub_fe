import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  // ✅ Dùng inject() thay vì constructor injection để tránh lỗi injection token
  private internTaskService = inject(InternTaskService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  activeTasks: MicroTaskResponse[] = [];
  completedTasks: MicroTaskResponse[] = [];
  isLoading = true;
  errorMessage = '';

  // Modal state
  isModalOpen = false;
  selectedTask: MicroTaskResponse | null = null;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  // Accordion state
  activeExpanded = true;
  completedExpanded = true;

  // Expanded task rows
  expandedTaskIds = new Set<number>();

  submissionForm: FormGroup = this.fb.group({
    submissionNote: [''],
    submissionLink: ['', Validators.required],
  });

  // File upload state
  selectedFile: File | null = null;
  isDragOver = false;

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('[Execution] Loading tasks...');

    // Tạm thởi dùng fetch thay vì HttpClient
    const token = localStorage.getItem('jwt_token');
    fetch('http://localhost:8090/api/intern/tasks', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('[Execution] Tasks loaded:', data);
        this.activeTasks = data.filter(
          (t: any) => t.status === 'Todo' || t.status === 'In_Progress' || t.status === 'Submitted',
        );
        this.completedTasks = data.filter(
          (t: any) => t.status === 'Reviewed' || t.status === 'Rejected',
        );
        console.log(
          '[Execution] Active:',
          this.activeTasks.length,
          'Completed:',
          this.completedTasks.length,
        );
        this.isLoading = false; // Set ngay lập tức
        this.zone.run(() => {
          this.cdr.detectChanges(); // Force UI update trong Angular zone
        });
      })
      .catch((err) => {
        console.error('[Execution] Failed to load tasks', err);
        this.errorMessage = 'Không thể tải danh sách nhiệm vụ. Vui lòng thử lại.';
        this.isLoading = false;
      });
  }

  // ✅ Tách riêng: mở modal KHÔNG thông qua row click
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

  // ✅ Toggle expand chỉ gọi khi click vào row (không phải button con)
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
    if (input.files?.[0]) this.handleFileSelect(input.files[0]);
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
    if (this.submissionForm.get('submissionLink')?.invalid) {
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
        const idx = this.activeTasks.findIndex((t) => t.id === updatedTask.id);
        if (idx !== -1) this.activeTasks[idx] = updatedTask;
        setTimeout(() => this.closeModal(), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || 'Nộp bài thất bại. Vui lòng thử lại.';
        this.submitError = msg;
      },
    });
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
    return `Hạn nộp: ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}
