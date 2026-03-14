import {
  Component,
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
  evaluationType?: 'write' | 'upload'; // lưu local, không từ backend
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

  currentRole: 'MENTOR' | 'MANAGER' | string = 'MENTOR';

  interns: InternItem[] = [];
  selectedInternId: number | null = null;
  evaluation: EvaluationResponse | null = null;

  activeTab: 'write' | 'upload' = 'upload';
  overallComment = '';
  uploadNote = '';
  // Mỗi slot = 1 hàng có nút Tải tệp + Camera + X
  uploadSlots: Array<{ file: File | null }> = [{ file: null }];

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
  isResetting = false;
  showResetModal = false;

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
            // Restore tab đã dùng lần trước cho intern này
            const savedType = localStorage.getItem(`eval_type_${data.internId}`) as 'write' | 'upload' | null;
            this.activeTab = savedType ?? 'upload';
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
    if (!this.selectedInternId) return;
    this.isSaving = true;

    const commentToSave = this.activeTab === 'write'
      ? this.overallComment.trim()
      : (this.uploadNote.trim() || '(Bản nháp - chưa có nhận xét)');

    this.http
      .post<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations`, {
        internId: this.selectedInternId,
        overallComment: commentToSave,
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

  /** Kiểm tra có thể submit không — tuỳ theo tab đang active */
  switchTab(tab: 'write' | 'upload'): void {
    this.activeTab = tab;
    // Lưu lựa chọn tab cho intern này
    if (this.selectedInternId) {
      localStorage.setItem(`eval_type_${this.selectedInternId}`, tab);
    }
  }

  hasNoFiles(): boolean {
    return !this.uploadSlots || this.uploadSlots.every(s => !s.file);
  }

  canSubmit(): boolean {
    if (this.activeTab === 'write') {
      return this.overallComment.trim().length > 0;
    }
    // Tab upload: phải có ít nhất 1 file hoặc có ghi chú
    const hasFile = this.uploadSlots.some(s => s.file !== null);
    const hasNote = this.uploadNote.trim().length > 0;
    return hasFile || hasNote;
  }

  openSubmitConfirm(): void {
    if (!this.canSubmit()) return;
    this.showSubmitModal = true;
  }

  submitEvaluation(): void {
    if (!this.selectedInternId || !this.canSubmit()) return;
    this.showSubmitModal = false;
    this.isSubmitting = true;

    const finalComment = this.activeTab === 'write'
      ? this.overallComment.trim()
      : (this.uploadNote.trim() || '(Đã gửi kèm tệp đính kèm)');

    this.http
      .post<EvaluationResponse>(`${this.apiUrl}/mentor/evaluations`, {
        internId: this.selectedInternId,
        overallComment: finalComment,
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

  // ─── Đánh giá lại ───────────────────────────────────────────────────────
  openResetConfirm(): void {
    this.showResetModal = true;
  }

  confirmReset(): void {
    if (!this.evaluation?.id) return;
    this.showResetModal = false;
    this.isResetting = true;

    this.http
      .post<EvaluationResponse>(
        `${this.apiUrl}/mentor/evaluations/${this.evaluation.id}/reset`,
        {},
      )
      .subscribe({
        next: (data) => {
          this.evaluation = data;
          this.overallComment = data.overallComment ?? '';
          this.isResetting = false;
          this.cdr.detectChanges();
          this.showToast('Đã mở khóa. Bạn có thể chỉnh sửa và gửi lại.');
        },
        error: () => {
          // Nếu backend chưa có endpoint, reset local state
          if (this.evaluation) {
            this.evaluation = { ...this.evaluation, isLocked: false, status: 'DRAFT' };
          }
          this.isResetting = false;
          this.cdr.detectChanges();
          this.showToast('Đã mở khóa đánh giá (local).');
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

  // ─── Upload slots ────────────────────────────────────────────────────────
  addUploadSlot(): void {
    this.uploadSlots.push({ file: null });
  }

  removeSlot(index: number): void {
    this.uploadSlots.splice(index, 1);
    // Đảm bảo luôn có ít nhất 1 slot
    if (this.uploadSlots.length === 0) {
      this.uploadSlots.push({ file: null });
    }
  }

  triggerSlotFileInput(index: number): void {
    // Tìm input[data-slot] tương ứng và click
    const inputs = document.querySelectorAll<HTMLInputElement>('input[data-slot]');
    const input = inputs[index];
    if (input) input.click();
  }

  triggerSlotCamera(index: number): void {
    // Mở input file với capture=camera
    const inputs = document.querySelectorAll<HTMLInputElement>('input[data-slot]');
    const input = inputs[index];
    if (input) {
      input.setAttribute('capture', 'environment');
      input.click();
    }
  }

  onSlotFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.uploadSlots[index] = { file: input.files[0] };
    input.removeAttribute('capture');
    input.value = '';
  }

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3500);
  }
}
