import { Component, OnInit } from '@angular/core';
import { TaskService, Task, Intern } from '../services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html'
})
export class Tasks implements OnInit {

  tasks: Task[] = [];
  interns: Intern[] = [];

  selectedInternIds: number[] = [];

  showInternBox = false;

  newTask: Task = {
    title: '',
    description: '',
    weight: 1,
    deadline: ''
  };

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadInterns();
  }

  loadTasks(): void {
    this.taskService.getMentorTasks().subscribe({
      next: (data) => {
        this.tasks = data;
      },
      error: () => {
        this.tasks = [];
      }
    });
  }

  loadInterns(): void {
    this.taskService.getInterns().subscribe({
      next: (data) => {
        this.interns = data;
      },
      error: () => {
        this.interns = [];
      }
    });
  }

  toggleIntern(id: number): void {

    if (this.selectedInternIds.includes(id)) {
      this.selectedInternIds =
        this.selectedInternIds.filter(i => i !== id);
    } else {
      this.selectedInternIds.push(id);
    }

  }

  isInternSelected(id: number): boolean {
    return this.selectedInternIds.includes(id);
  }

  getInternName(id: number): string {

    const intern = this.interns.find(i => i.id === id);

    return intern ? intern.name : '';

  }

  createTask(): void {

    if (!this.newTask.title || !this.newTask.deadline) {
      alert("Vui lòng nhập title và deadline");
      return;
    }

    if (this.selectedInternIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 intern");
      return;
    }

    const payload: Task = {
      title: this.newTask.title,
      description: this.newTask.description,
      deadline: this.newTask.deadline + "T23:59:59",
      internIds: this.selectedInternIds,
      skills: [
        {
          skillId: 1,
          weight: this.newTask.weight ?? 1
        }
      ]
    };

    console.log("Payload gửi lên:", payload);

    this.taskService.createTask(payload).subscribe({

      next: () => {

        this.loadTasks();

        this.newTask = {
          title: '',
          description: '',
          weight: 1,
          deadline: ''
        };

        this.selectedInternIds = [];
        this.showInternBox = false;

      },

      error: (err) => {
        console.error("Create task error:", err);
        alert("Tạo task thất bại");
      }

    });

  }

}