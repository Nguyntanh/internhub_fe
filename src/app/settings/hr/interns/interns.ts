import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import {
  HrInternService,
  InternshipProfileResponse,
  SupervisorResponse,
  AssignSupervisorRequest,
} from './hr-intern.service';

@Component({
  selector: 'app-hr-interns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interns.html',
  styleUrl: './interns.css',
})
export class HrInternsComponent implements OnInit, OnDestroy {
  interns: InternshipProfileResponse[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Filter
  searchKeyword = '';

  // Supervisors
  mentors: SupervisorResponse[] = [];
  managers: SupervisorResponse[] = [];

  // Edit state
  editingMentor: { [key: number]: boolean } = {};
  editingManager: { [key: number]: boolean } = {};
  selectedMentor: { [key: number]: number | null } = {};
  selectedManager: { [key: number]: number | null } = {};

  // Assign all modal
  showAssignModal = false;
  selectedIntern: InternshipProfileResponse | null = null;
  assignMentorId: number | null = null;
  assignManagerId: number | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  constructor(
    private readonly hrInternService: HrInternService,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loadInterns();
    this.loadSupervisors();

    this.search$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe((keyword) => {
      this.currentPage = 0;
      this.loadInterns(keyword);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInterns(keyword?: string): void {
    this.loading = true;
    this.error = null;

    this.hrInternService
      .getInterns(this.currentPage, this.pageSize, keyword ?? this.searchKeyword ?? undefined)
      .subscribe({
        next: (response) => {
          this.interns = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.loading = false;

          this.interns.forEach((intern) => {
            this.editingMentor[intern.id] = false;
            this.editingManager[intern.id] = false;
            this.selectedMentor[intern.id] = intern.mentorId;
            this.selectedManager[intern.id] = intern.managerId;
          });
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Không thể tải danh sách interns. Vui lòng thử lại.';
          console.error('Error loading interns:', err);
        },
      });
  }

  loadSupervisors(): void {
    this.hrInternService.getAvailableMentors().subscribe({
      next: (mentors) => (this.mentors = mentors),
      error: (err) => console.error('Error loading mentors:', err),
    });

    this.hrInternService.getAvailableManagers().subscribe({
      next: (managers) => (this.managers = managers),
      error: (err) => console.error('Error loading managers:', err),
    });
  }

  onSearch(keyword: string): void {
    this.search$.next(keyword);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadInterns();
  }

  startEditMentor(intern: InternshipProfileResponse): void {
    this.editingMentor[intern.id] = true;
    this.selectedMentor[intern.id] = intern.mentorId;
  }

  startEditManager(intern: InternshipProfileResponse): void {
    this.editingManager[intern.id] = true;
    this.selectedManager[intern.id] = intern.managerId;
  }

  cancelEditMentor(intern: InternshipProfileResponse): void {
    this.editingMentor[intern.id] = false;
    this.selectedMentor[intern.id] = intern.mentorId;
  }

  cancelEditManager(intern: InternshipProfileResponse): void {
    this.editingManager[intern.id] = false;
    this.selectedManager[intern.id] = intern.managerId;
  }

  saveMentor(intern: InternshipProfileResponse): void {
    const request: AssignSupervisorRequest = {
      internshipProfileId: intern.id,
      mentorId: this.selectedMentor[intern.id],
      managerId: intern.managerId,
    };

    this.hrInternService.assignSupervisors(request).subscribe({
      next: (updated) => {
        const index = this.interns.findIndex((i) => i.id === updated.id);
        if (index !== -1) this.interns[index] = updated;
        this.editingMentor[intern.id] = false;
      },
      error: (err) => {
        console.error('Error assigning mentor:', err);
        alert('Không thể gán mentor. Vui lòng thử lại.');
      },
    });
  }

  saveManager(intern: InternshipProfileResponse): void {
    const request: AssignSupervisorRequest = {
      internshipProfileId: intern.id,
      mentorId: intern.mentorId,
      managerId: this.selectedManager[intern.id],
    };

    this.hrInternService.assignSupervisors(request).subscribe({
      next: (updated) => {
        const index = this.interns.findIndex((i) => i.id === updated.id);
        if (index !== -1) this.interns[index] = updated;
        this.editingManager[intern.id] = false;
      },
      error: (err) => {
        console.error('Error assigning manager:', err);
        alert('Không thể gán manager. Vui lòng thử lại.');
      },
    });
  }

  openAssignModal(intern: InternshipProfileResponse): void {
    this.selectedIntern = intern;
    this.assignMentorId = intern.mentorId;
    this.assignManagerId = intern.managerId;
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedIntern = null;
    this.assignMentorId = null;
    this.assignManagerId = null;
  }

  saveAssignModal(): void {
    if (!this.selectedIntern) return;

    const request: AssignSupervisorRequest = {
      internshipProfileId: this.selectedIntern.id,
      mentorId: this.assignMentorId,
      managerId: this.assignManagerId,
    };

    this.hrInternService.assignSupervisors(request).subscribe({
      next: (updated) => {
        const index = this.interns.findIndex((i) => i.id === updated.id);
        if (index !== -1) this.interns[index] = updated;
        this.closeAssignModal();
      },
      error: (err) => {
        console.error('Error assigning supervisors:', err);
        alert('Không thể gán supervisor. Vui lòng thử lại.');
      },
    });
  }

  viewDetails(intern: InternshipProfileResponse): void {
    console.log('View details for intern:', intern);
  }

  editIntern(intern: InternshipProfileResponse): void {
    console.log('Edit intern:', intern);
  }

  createNewProfile(): void {
    console.log('Create new intern profile');
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  generateInternCode(id: number, department: string | null): string {
    const deptPrefix = department ? department.substring(0, 2).toUpperCase() : 'IT';
    return `${deptPrefix}${String(id).padStart(3, '0')}`;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - 2);
    let end = Math.min(this.totalPages - 1, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
