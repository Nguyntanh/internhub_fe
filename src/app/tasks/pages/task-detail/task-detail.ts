import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { TaskService } from '../../services/task.service'
import { TaskDetail } from '../../models/task.model'

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-detail.html'
})
export class TaskDetailComponent implements OnInit {

  task?: TaskDetail

  submissionLink: string = ""
  submissionNote: string = ""

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {

    const taskId = this.route.snapshot.params['id']

    this.taskService.getTaskDetail(taskId)
      .subscribe({
        next: (res) => {
          this.task = res
        },
        error: () => {
          alert("Failed to load task")
        }
      })
  }

  submitTask() {

    if (!this.task) return

    const body = {
      submissionLink: this.submissionLink,
      submissionNote: this.submissionNote
    }

    this.taskService.submitTask(this.task.id, body)
      .subscribe({
        next: () => alert("Task submitted successfully"),
        error: () => alert("Submit failed")
      })
  }

  reviewTask() {

    if (!this.task) return

    const body = {
      skills: this.task.skills.map(skill => ({
        skillId: skill.skillId,
        score: skill.score ?? 0,
        comment: skill.comment ?? ""
      }))
    }

    this.taskService.reviewTask(this.task.id, body)
      .subscribe({
        next: () => alert("Review submitted successfully"),
        error: () => alert("Review failed")
      })
  }
}