import { Component, OnInit } from '@angular/core';
import { TaskService, Task, Intern } from '../services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

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
  loadingInterns = false; // Thêm state loading riêng cho interns

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
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadInterns();
    this.loadSkills();
  }

  loadTasks(): void {
    this.loading = true;

    this.taskService.getMentorTasks().subscribe({
      next: (data: any[]) => {
        this.tasks = data.map(task => {
          let weight = 1;
          if (task.skills && task.skills.length > 0) {
            weight = task.skills[0].weight ?? 1;
          }
          return {
            ...task,
            weight
          };
        });
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Lỗi load tasks:', error);
        this.tasks = [];
        this.loading = false;
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
    console.log('Đang tải danh sách interns...');

    this.taskService.getInterns().subscribe({
      next: (data: any) => {
        console.log('Dữ liệu interns nhận được:', data);
        
        // Xử lý dữ liệu nếu API trả về format khác
        if (Array.isArray(data)) {
          // Map dữ liệu để đảm bảo đúng format
          this.interns = data.map(item => ({
            id: item.id,
            name: item.name || item.fullName || item.username || 'Không có tên',
            email: item.email || ''
          }));
          console.log('Interns sau khi xử lý:', this.interns);
        } else if (data && data.content && Array.isArray(data.content)) {
          // Trường hợp API trả về page object
          this.interns = data.content.map((item: any) => ({
            id: item.id,
            name: item.name || item.fullName || item.username || 'Không có tên',
            email: item.email || ''
          }));
        } else {
          this.interns = [];
          console.warn('Dữ liệu interns không đúng format:', data);
        }

        this.loadingInterns = false;
        
        if (this.interns.length === 0) {
          this.snackBar.open(
            'Không có intern nào trong hệ thống',
            'Đóng',
            { duration: 3000 }
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Chi tiết lỗi load interns:', error);
        this.interns = [];
        this.loadingInterns = false;
        
        let errorMessage = 'Không thể tải danh sách Intern';
        if (error.status === 404) {
          errorMessage = 'API không tìm thấy. Vui lòng kiểm tra đường dẫn!';
        } else if (error.status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau!';
        } else if (error.status === 0) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra network!';
        }
        
        this.snackBar.open(
          errorMessage,
          'Đóng',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  loadSkills(): void {
    this.taskService.getSkills().subscribe({
      next: (data) => {
        console.log('Skills loaded:', data);
        this.skills = Array.isArray(data) ? data : [];
      },
      error: (error) => {
        console.error('Lỗi load skills:', error);
        this.skills = [];
        this.snackBar.open(
          'Không thể tải danh sách Skill',
          'Đóng',
          { duration: 3000 }
        );
      }
    });
  }

  getStars(weight: number): number[] {
    return Array(weight).fill(0);
  }

  get filteredTasks(): any[] {
    return this.tasks.filter(task => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(this.searchText.toLowerCase());

      const matchesStatus = this.statusFilter
        ? task.status === this.statusFilter
        : true;

      return matchesSearch && matchesStatus;
    });
  }

  selectIntern(id: number): void {
    this.selectedInternId = id;
    this.showInternBox = false; // Tự động đóng box sau khi chọn
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
      this.snackBar.open(
        'Vui lòng nhập tiêu đề và thời hạn',
        'Đóng',
        { duration: 3000 }
      );
      return;
    }

    if (!this.selectedSkillId) {
      this.snackBar.open(
        'Vui lòng chọn Skill',
        'Đóng',
        { duration: 3000 }
      );
      return;
    }

    if (!this.selectedInternId) {
      this.snackBar.open(
        'Vui lòng chọn 1 Intern',
        'Đóng',
        { duration: 3000 }
      );
      return;
    }

    const deadlineDate = new Date(this.newTask.deadline);
    deadlineDate.setHours(23, 59, 59);

    const payload: Task = {
      title: this.newTask.title,
      description: this.newTask.description,
      deadline: deadlineDate.toISOString(),
      internIds: [this.selectedInternId],
      skills: [
        {
          skillId: this.selectedSkillId,
          weight: this.newTask.weight ?? 1
        }
      ]
    };

    console.log('Creating task with payload:', payload);

    this.taskService.createTask(payload).subscribe({
      next: (response) => {
        console.log('Task created:', response);
        this.snackBar.open(
          'Tạo task thành công',
          'Đóng',
          { duration: 3000 }
        );

        this.loadTasks();
        this.resetNewTaskForm();
      },
      error: (error) => {
        console.error('Lỗi tạo task:', error);
        this.snackBar.open(
          'Tạo task thất bại: ' + (error.message || 'Vui lòng thử lại'),
          'Đóng',
          { duration: 5000 }
        );
      }
    });
  }

  resetNewTaskForm(): void {
    this.newTask = {
      title: '',
      description: '',
      weight: 1,
      deadline: null
    };
    this.selectedInternId = null;
    this.selectedSkillId = null;
    this.showInternBox = false;
  }

  viewTask(task: any): void {
    this.taskService.getTaskDetail(task.id).subscribe({
      next: (data) => {
        this.selectedTask = task;
        this.taskDetail = {
          ...data,
          weight: task.weight
        };
        if (data.skills && data.skills.length > 0) {
          this.selectedSkillId = data.skills[0].skillId;
        }
        setTimeout(() => {
          this.showTaskModal = true;
        });
      },
      error: (error) => {
        console.error('Lỗi load task detail:', error);
        this.snackBar.open(
          'Không thể tải chi tiết task',
          'Đóng',
          { duration: 3000 }
        );
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
      deadline: this.taskDetail?.deadline
        ? new Date(this.taskDetail.deadline)
        : null,
      weight: this.taskDetail?.weight || 1,
      internId: this.taskDetail?.assignedInterns?.[0]?.id || null
    };
    if (this.taskDetail?.skills && this.taskDetail.skills.length > 0) {
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
      this.snackBar.open(
        'Vui lòng nhập tiêu đề và thời hạn',
        'Đóng',
        { duration: 3000 }
      );
      return;
    }

    if (!this.selectedSkillId) {
      this.snackBar.open(
        'Vui lòng chọn Skill',
        'Đóng',
        { duration: 3000 }
      );
      return;
    }

    if (!this.editForm.internId) {
      this.snackBar.open(
        'Vui lòng chọn 1 Intern',
        'Đóng',
        { duration: 3000 }
      );
      return;
    }

    const deadlineDate = new Date(this.editForm.deadline);
    deadlineDate.setHours(23, 59, 59);

    const payload = {
      title: this.editForm.title,
      description: this.editForm.description,
      deadline: deadlineDate.toISOString(),
      internIds: [this.editForm.internId],
      skills: [
        {
          skillId: this.selectedSkillId,
          weight: this.editForm.weight
        }
      ]
    };

    this.taskService.updateTask(this.selectedTask.id, payload).subscribe({
      next: () => {
        this.snackBar.open(
          'Cập nhật task thành công',
          'Đóng',
          { duration: 3000 }
        );
        this.loadTasks();
        this.isEditing = false;
        this.showTaskModal = false;
      },
      error: (error) => {
        console.error('Lỗi update task:', error);
        this.snackBar.open(
          'Cập nhật task thất bại',
          'Đóng',
          { duration: 3000 }
        );
      }
    });
  }

  // Review methods
  openReviewModal(task: any): void {
    this.reviewTaskData = task;
    this.reviewScore = null;
    this.reviewComment = '';
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.reviewTaskData = null;
    this.reviewScore = null;
    this.reviewComment = '';
  }

  isValidScore(): boolean {
    return this.reviewScore !== null && 
           this.reviewScore >= 0 && 
           this.reviewScore <= 10 && 
           !isNaN(this.reviewScore);
  }

  submitReview(): void {
    if (!this.isValidScore()) {
      this.snackBar.open('Điểm phải từ 0 đến 10', 'Đóng', { duration: 3000 });
      return;
    }

    this.taskService.reviewTask(this.reviewTaskData.id, {
      score: this.reviewScore,
      comment: this.reviewComment || 'Reviewed by mentor'
    }).subscribe({
      next: () => {
        this.snackBar.open('Chấm điểm thành công', 'Đóng', { duration: 3000 });
        this.loadTasks();
        this.closeReviewModal();
      },
      error: (error) => {
        console.error('Lỗi review task:', error);
        this.snackBar.open('Chấm điểm thất bại', 'Đóng', { duration: 3000 });
      }
    });
  }

  deleteTask(task: any): void {
    if (!confirm("Bạn có chắc muốn xóa task?")) return;

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
    switch(status?.toLowerCase()) {
      case 'pending':
        return 'warn';
      case 'submitted':
        return 'accent';
      case 'reviewed':
        return 'primary';
      default:
        return '';
    }
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'pending':
        return 'border-orange-200 bg-orange-50';
      case 'submitted':
        return 'border-yellow-200 bg-yellow-50';
      case 'reviewed':
        return 'border-green-200 bg-green-50';
      default:
        return '';
    }
  }

  // Helper method để kiểm tra có thể review không
  canReview(task: any): boolean {
    return task?.submissionLink || task?.status === 'Submitted';
  }

  // Refresh data
  refreshData(): void {
    this.loadTasks();
    this.loadInterns();
    this.loadSkills();
  }
}