import {
  Component,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  NgZone,
  afterNextRender,
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

interface InternItem {
  id: number;
  name: string;
  email: string;
}

interface SkillSummary {
  skillId: number;
  skillName: string;
  averageScore: number;
  totalWeight: number;
  taskCount: number;
}

interface EvaluationResponse {
  id?: number;
  internId: number;
  internName?: string;
  internEmail?: string;
  mentorId?: number;
  mentorName?: string;
  overallComment?: string;
  status?: 'DRAFT' | 'SUBMITTED';
  isLocked?: boolean;
  submittedAt?: string;
  createdAt?: string;
  skillSummaries?: SkillSummary[];
  totalTasksReviewed?: number;
  totalTasksAll?: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './approval.html',
  styleUrl: './approval.css',
})
export class Approval {
  private readonly apiUrl = 'http://localhost:8090/api';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  currentRole: 'MENTOR' | 'MANAGER' | string = 'MENTOR';

  interns: InternItem[] = [];
  selectedInternId: number | null = null;
  evaluation: EvaluationResponse | null = null;

  activeTab: 'write' | 'upload' = 'write';
  overallComment = '';
  uploadNote = '';
  uploadedFiles: File[] = [];

  // Tách isInternsLoading và isLoading để tránh conflict
  isInternsLoading = false;
  isLoading = false;
  isSaving = false;
  isSubmitting = false;
  showSubmitModal = false;

  managerDecision: 'APPROVE' | 'REJECT' | null = null;
  showManagerModal = false;
  pendingDecision: 'APPROVE' | 'REJECT' = 'APPROVE';
  rejectReason = '';

  isExporting = false;

  toasts: Toast[] = [];
  private toastCounter = 0;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    afterNextRender(() => {
      this.detectCurrentRole();
      this.loadInterns();
    });
  }

  private detectCurrentRole(): void {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles: string[] = payload.roles ?? payload.authorities ?? [];
      if (roles.some((r: string) => r.includes('MANAGER'))) {
        this.currentRole = 'MANAGER';
      } else {
        this.currentRole = 'MENTOR';
      }
    } catch {
      this.currentRole = 'MENTOR';
    }
  }

  private loadInterns(): void {
    this.isInternsLoading = true;
    this.http
      .get<any[]>(`${this.apiUrl}/mentor/interns`)
      .pipe(finalize(() => {
        this.isInternsLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            this.interns = data.map((u) => ({
              id: Number(u.id),
              name: u.name,
              email: u.email,
            }));

            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          console.error('[Approval] Không thể tải danh sách intern:', err?.status);
        },
      });
  }

  onInternChange(internId: any): void {
    // Ép kiểu về number để tránh string comparison bug
    const id = internId ? Number(internId) : null;
    this.selectedInternId = id;
    this.evaluation = null;
    this.overallComment = '';
    this.managerDecision = null;
    if (!id) return;
    this.loadEvaluation(id);
  }

  private loadEvaluation(internId: number): void {
    this.isLoading = true;
    this.evaluation = null;
    this.http
      .get<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations/intern/${internId}`)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            this.evaluation = data;
            this.overallComment = data.overallComment ?? '';
            this.cdr.detectChanges();
          });
        },
        error: () => {
          // Intern chưa có evaluation — bình thường, không báo lỗi
          this.evaluation = null;
          this.overallComment = '';
        },
      });
  }

  saveDraft(): void {
    if (!this.selectedInternId || !this.overallComment.trim()) return;
    this.isSaving = true;

    this.http
      .post<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations`, {
        internId: this.selectedInternId,
        overallComment: this.overallComment,
      })
      .subscribe({
        next: (data) => {
          this.evaluation = { ...this.evaluation, ...data };
          this.isSaving = false;
          this.cdr.detectChanges();
          this.showToast('Đã lưu nháp đánh giá.');
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Lưu nháp thất bại.', 'error');
        },
      });
  }

  openSubmitConfirm(): void {
    if (!this.overallComment.trim()) return;
    this.showSubmitModal = true;
  }

  submitEvaluation(): void {
    if (!this.selectedInternId || !this.overallComment.trim()) return;
    this.showSubmitModal = false;
    this.isSubmitting = true;

    this.http
      .post<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations`, {
        internId: this.selectedInternId,
        overallComment: this.overallComment,
      })
      .subscribe({
        next: (saved) => {
          if (!saved.id) {
            this.isSubmitting = false;
            this.showToast('Không lấy được ID đánh giá.', 'error');
            return;
          }
          this.http
            .post<EvaluationResponse>(
              `${this.apiUrl}/mentor/evaluations/${saved.id}/submit`,
              {},
            )
            .subscribe({
              next: (submitted) => {
                this.evaluation = submitted;
                this.isSubmitting = false;
                this.cdr.detectChanges();
                this.showToast('Đã gửi phê duyệt thành công! Micro-tasks đã được khóa.');
              },
              error: (err) => {
                this.isSubmitting = false;
                this.showToast(err?.error?.message ?? 'Gửi phê duyệt thất bại.', 'error');
              },
            });
        },
        error: () => {
          this.isSubmitting = false;
          this.showToast('Lưu nhận xét thất bại.', 'error');
        },
      });
  }

  openManagerDecision(decision: 'APPROVE' | 'REJECT'): void {
    this.pendingDecision = decision;
    this.rejectReason = '';
    this.showManagerModal = true;
  }

  confirmManagerDecision(): void {
    if (this.pendingDecision === 'REJECT' && !this.rejectReason.trim()) return;
    this.showManagerModal = false;
    this.managerDecision = this.pendingDecision;
    const msg =
      this.pendingDecision === 'APPROVE'
        ? 'Đã phê duyệt kết quả đánh giá thành công.'
        : `Đã từ chối. Lý do: ${this.rejectReason}`;
    this.showToast(msg);
  }

  exportReport(): void {
    if (!this.evaluation || !this.selectedInternId) return;
    this.isExporting = true;

    this.http
      .get(
        `${this.apiUrl}/mentor/evaluations/intern/${this.selectedInternId}/export`,
        { responseType: 'blob' },
      )
      .subscribe({
        next: (blob) => {
          this.isExporting = false;
          const intern = this.interns.find((i) => i.id === this.selectedInternId);
          const filename = `danh-gia-${intern?.name ?? 'intern'}-${new Date().toISOString().slice(0, 10)}.pdf`;
          this.downloadBlob(blob, filename);
          this.showToast('Xuất file thành công!');
        },
        error: () => {
          this.isExporting = false;
          this.exportAsText();
        },
      });
  }

  private exportAsText(): void {
    const intern = this.interns.find((i) => i.id === this.selectedInternId);
    const lines: string[] = [
      '===== BÁO CÁO ĐÁNH GIÁ CUỐI KỲ =====',
      `Intern: ${intern?.name ?? ''} (${intern?.email ?? ''})`,
      `Mentor: ${this.evaluation?.mentorName ?? ''}`,
      `Ngày gửi: ${this.evaluation?.submittedAt ?? 'Chưa gửi'}`,
      '',
      '--- BẢNG ĐIỂM KỸ NĂNG ---',
    ];
    this.evaluation?.skillSummaries?.forEach((s) => {
      lines.push(
        `  ${s.skillName}: ${s.averageScore.toFixed(2)}/10  (${s.taskCount} task, trọng số ${s.totalWeight})`,
      );
    });
    lines.push('');
    lines.push('--- NHẬN XÉT TỔNG KẾT ---');
    lines.push(this.evaluation?.overallComment ?? '(Chưa có nhận xét)');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    this.downloadBlob(
      blob,
      `danh-gia-${intern?.name ?? 'intern'}-${new Date().toISOString().slice(0, 10)}.txt`,
    );
    this.showToast('Đã xuất file báo cáo (text).');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  getScoreLabel(score: number): string {
    if (score >= 8.5) return 'Xuất sắc';
    if (score >= 7) return 'Tốt';
    if (score >= 5) return 'Đạt';
    return 'Cần cải thiện';
  }

  triggerFileInput(): void {
    this.fileInput?.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach((f) => this.uploadedFiles.push(f));
    input.value = '';
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3500);
  }
}
