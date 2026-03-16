import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-assign-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="text-xl font-bold">Giao nhiệm vụ mới</h2>
    <mat-dialog-content class="mat-typography">
      <form [formGroup]="taskForm" class="flex flex-col gap-4 pt-2">
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Chọn Thực tập sinh</mat-label>
            <mat-select formControlName="internId" (selectionChange)="onInternChange($event.value)">
              <mat-option *ngFor="let intern of interns" [value]="intern.id">
                {{ intern.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Hạn chót (Deadline)</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="deadline" />
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Tiêu đề nhiệm vụ</mat-label>
          <input matInput formControlName="title" placeholder="VD: Thiết kế giao diện Login" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Mô tả chi tiết</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-semibold text-gray-700">Kỹ năng đánh giá & Trọng số</h3>
            <button type="button" mat-button color="primary" (click)="addSkill()">
              <mat-icon>add</mat-icon> Thêm kỹ năng
            </button>
          </div>

          <div
            formArrayName="skills"
            *ngFor="let skill of skillForms.controls; let i = index"
            class="flex gap-4 mb-2 items-center"
          >
            <div [formGroupName]="i" class="flex gap-4 flex-1">
              <mat-form-field appearance="outline" class="flex-[2]">
                <mat-label>Kỹ năng</mat-label>
                <mat-select formControlName="skillId">
                  <mat-option *ngFor="let s of suggestedSkills" [value]="s.id">{{
                    s.name
                  }}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Trọng số (1-5)</mat-label>
                <input matInput type="number" formControlName="weight" min="1" max="5" />
              </mat-form-field>
            </div>
            <button mat-icon-button color="warn" (click)="removeSkill(i)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-4">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-raised-button color="primary" [disabled]="taskForm.invalid" (click)="onSubmit()">
        Giao việc
      </button>
    </mat-dialog-actions>
  `,
})
export class AssignTaskDialogComponent implements OnInit {
  taskForm: FormGroup;
  interns: any[] = [];
  suggestedSkills: any[] = [];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private userService: UserService,
    private dialogRef: MatDialogRef<AssignTaskDialogComponent>,
  ) {
    this.taskForm = this.fb.group({
      internId: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      deadline: ['', Validators.required],
      priorityWeight: [1],
      skills: this.fb.array([]),
    });
  }

  ngOnInit() {
    // Load danh sách Intern (Bạn cần đảm bảo UserService có hàm này)
    this.userService.getInterns().subscribe((res) => (this.interns = res));
  }

  get skillForms() {
    return this.taskForm.get('skills') as FormArray;
  }

  addSkill(skillId = '', weight = 1) {
    const skillGroup = this.fb.group({
      skillId: [skillId, Validators.required],
      weight: [weight, [Validators.required, Validators.min(1), Validators.max(5)]],
    });
    this.skillForms.push(skillGroup);
  }

  removeSkill(index: number) {
    this.skillForms.removeAt(index);
  }

  onInternChange(internId: number) {
    // Gọi API lấy kỹ năng gợi ý khi chọn Intern
    this.taskService.getSuggestedSkills(internId).subscribe((skills) => {
      this.suggestedSkills = skills;
      // Clear skills cũ và thêm gợi ý mặc định nếu muốn
      while (this.skillForms.length) this.removeSkill(0);
      skills.forEach((s) => this.addSkill(s.id, 1));
    });
  }

  onSubmit() {
    if (this.taskForm.valid) {
      this.taskService.assignTask(this.taskForm.value).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }
}
