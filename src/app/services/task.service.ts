import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../api-endpoints';

export interface SkillWeight {
  skillName: string;
  weight: number;
}

export interface TaskResponse {
  id: number;
  title: string;
  description: string;
  status: string;
  internName: string;
  deadline: Date;
  skills: SkillWeight[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  getMyCreatedTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${API_ENDPOINTS}/api/tasks/my-created-tasks`);
  }

  assignTask(taskData: any): Observable<any> {
    return this.http.post(`${API_ENDPOINTS}/api/tasks/assign`, taskData);
  }
}
