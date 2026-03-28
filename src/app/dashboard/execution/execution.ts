import { Component, OnInit } from '@angular/core';
import { TaskService, TaskResponse } from '../../services/task.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AssignTaskDialogComponent } from './assign-task-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-execution',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './execution.html',
  styleUrl: './execution.css',
})
export class ExecutionComponent implements OnInit {
  tasks: TaskResponse[] = [];
  displayedColumns: string[] = ['title', 'intern', 'deadline', 'priority', 'skills', 'status'];
  snackBar: any;

  constructor(
    private taskService: TaskService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getMyCreatedTasks().subscribe((data) => {
      this.tasks = data;
    });
  }

  openAssignDialog() {
    const dialogRef = this.dialog.open(AssignTaskDialogComponent, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks(); // Refresh danh sách sau khi tạo thành công
        this.snackBar.open('Đã giao nhiệm vụ thành công!', 'Đóng', { duration: 3000 });
      }
    });
  }
}
