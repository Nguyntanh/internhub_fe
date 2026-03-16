import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SkillWeight {
  skillId: number;
  weight: number;
}

export interface Task {
  id?: number;
  title: string;
  description: string;
  deadline: string;

  weight?: number;

  internIds?: number[];

  skills?: {
    skillId: number;
    weight: number;
  }[];
}

export interface Intern {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private api = 'http://localhost:8090/api/tasks';
  private userApi = 'http://localhost:8090/api/user';

  constructor(private http: HttpClient) {}

  // mentor xem task
  getMentorTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.api}/mentor`);
  }

  // intern xem task
  getInternTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.api}/intern`);
  }

  // tạo task
  createTask(task: Task): Observable<string> {
    return this.http.post(`${this.api}`, task, { responseType: 'text' });
  }

  // lấy danh sách intern
  getInterns(): Observable<Intern[]> {
    return this.http.get<Intern[]>(`${this.userApi}/interns`);
  }

  getTaskDetail(taskId: number): Observable<any> {
    return this.http.get(`${this.api}/${taskId}`);
  }

  submitTask(taskId: number, data: any): Observable<any> {
    return this.http.post(`${this.api}/${taskId}/submit`, data);
  }

  reviewTask(taskId: number, data: any): Observable<any> {
    return this.http.post(`${this.api}/${taskId}/review`, data);
  }

}