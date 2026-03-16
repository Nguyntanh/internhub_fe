import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  email?: string;
  fullName?: string;
}

export interface TaskDetail {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: string;
  weight: number;
  score?: number;
  reviewComment?: string;
  submissionLink?: string;
  submission_link?: string;
  submissionNote?: string;
  submission_note?: string;
  assignedInterns: Intern[];
  skills?: {
    skillId: number;
    weight: number;
    ratingScore?: number;
    reviewComment?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private api = 'http://localhost:8090/api/tasks';
  private userApi = 'http://localhost:8090/api/user';
  private skillApi = 'http://localhost:8090/api/skills';

  constructor(private http: HttpClient) {}

  // ================= AUTH HEADER =================
  private getAuthHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  // ================= ERROR HANDLER =================
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Có lỗi xảy ra';

    if (error.status === 0) {
      errorMessage = 'Không thể kết nối tới server';
    } else if (error.status === 401) {
      errorMessage = 'Bạn chưa đăng nhập hoặc token đã hết hạn';
    } else {
      errorMessage = `Server trả về lỗi ${error.status}`;
    }

    console.error('HTTP Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // ================= TASK APIs =================

  getMentorTasks(): Observable<TaskDetail[]> {
    return this.http
      .get<any[]>(`${this.api}/mentor`, this.getAuthHeaders())
      .pipe(
        map(tasks => tasks.map(task => this.mapTaskResponse(task))),
        catchError(this.handleError)
      );
  }

  getInternTasks(): Observable<TaskDetail[]> {
    return this.http
      .get<any[]>(`${this.api}/intern`, this.getAuthHeaders())
      .pipe(
        map(tasks => tasks.map(task => this.mapTaskResponse(task))),
        catchError(this.handleError)
      );
  }

  createTask(task: Task): Observable<string> {
    return this.http
      .post(`${this.api}`, task, {
        ...this.getAuthHeaders(),
        responseType: 'text'
      })
      .pipe(catchError(this.handleError));
  }

  getTaskDetail(taskId: number): Observable<TaskDetail> {
    return this.http
      .get<any>(`${this.api}/${taskId}`, this.getAuthHeaders())
      .pipe(
        map(task => this.mapTaskResponse(task)),
        catchError(this.handleError)
      );
  }

  updateTask(taskId: number, task: any): Observable<string> {
    return this.http
      .put(`${this.api}/${taskId}`, task, {
        ...this.getAuthHeaders(),
        responseType: 'text'
      })
      .pipe(catchError(this.handleError));
  }

  deleteTask(taskId: number): Observable<string> {
    return this.http
      .delete(`${this.api}/${taskId}`, {
        ...this.getAuthHeaders(),
        responseType: 'text'
      })
      .pipe(catchError(this.handleError));
  }

  submitTask(taskId: number, data: any): Observable<any> {
    return this.http
      .post(`${this.api}/${taskId}/submit`, data, this.getAuthHeaders())
      .pipe(catchError(this.handleError));
  }

  reviewTask(taskId: number, data: any): Observable<any> {
    return this.http
      .post(`${this.api}/${taskId}/review`, data, this.getAuthHeaders())
      .pipe(catchError(this.handleError));
  }

  // ================= USER APIs =================

  getInterns(): Observable<Intern[]> {
    return this.http
      .get<Intern[]>(`${this.userApi}/interns`, this.getAuthHeaders())
      .pipe(catchError(this.handleError));
  }

  // ================= SKILL APIs =================

  getSkills(): Observable<any[]> {
    return this.http
      .get<any[]>(this.skillApi, this.getAuthHeaders())
      .pipe(catchError(this.handleError));
  }

  // ================= RESPONSE MAPPER =================

  private mapTaskResponse(task: any): TaskDetail {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      status: task.status,
      weight: task.weight || 1,
      score: task.score,
      reviewComment: task.reviewComment || task.review_comment,
      submissionLink: task.submissionLink || task.submission_link || task.submitdate,
      submission_link: task.submission_link || task.submitdate,
      submissionNote: task.submissionNote || task.submission_note,
      submission_note: task.submission_note,
      assignedInterns: task.assignedInterns || [],
      skills: task.skills || []
    };
  }
}