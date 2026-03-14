import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'

import { TaskService } from '../../services/task.service'
import { MicroTask } from '../../models/task.model'

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './task-list.html'
})
export class TaskListComponent implements OnInit {

  tasks: MicroTask[] = []

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {

    const internId = 1

    this.taskService.getTasksByIntern(internId)
      .subscribe(res => {
        this.tasks = res
      })
  }
}