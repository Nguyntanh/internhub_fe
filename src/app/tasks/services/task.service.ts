import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

import { MicroTask, TaskDetail } from '../models/task.model'
import { SubmitTaskRequest } from '../models/submit-task.model'
import { ReviewTaskRequest } from '../models/review-task.model'

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private baseUrl = "http://localhost:8090/api/tasks"

  constructor(private http: HttpClient) {}

  getTasksByIntern(internId: number): Observable<MicroTask[]> {

    return this.http.get<MicroTask[]>(
      `${this.baseUrl}/intern/${internId}`
    )

  }

  getTaskDetail(taskId: number): Observable<TaskDetail> {

    return this.http.get<TaskDetail>(
      `${this.baseUrl}/${taskId}`
    )

  }

  submitTask(taskId: number, data: SubmitTaskRequest){

    return this.http.post(
      `${this.baseUrl}/${taskId}/submit`,
      data
    )

  }

  reviewTask(taskId: number, data: ReviewTaskRequest){

    return this.http.post(
      `${this.baseUrl}/${taskId}/review`,
      data
    )

  }

}