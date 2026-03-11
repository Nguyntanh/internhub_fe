import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InternshipProfileResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  avatar: string | null;
  universityName: string;
  major: string;
  startDate: string;
  endDate: string;
  status: string;
  positionName: string;
  departmentName: string;
  mentorId: number | null;
  mentorName: string | null;
  mentorEmail: string | null;
  managerId: number | null;
  managerName: string | null;
  managerEmail: string | null;
}

export interface SupervisorResponse {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  roleName: string;
  departmentName: string;
  assignedInternCount: number;
}

export interface AssignSupervisorRequest {
  internshipProfileId: number;
  mentorId?: number | null;
  managerId?: number | null;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HrInternService {
  private readonly API_URL = 'http://localhost:8090/api/hr/interns';

  constructor(private readonly http: HttpClient) {}

  getInterns(
    page = 0,
    size = 10,
    keyword?: string,
    status?: string,
  ): Observable<PageResponse<InternshipProfileResponse>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (keyword) params = params.set('keyword', keyword);
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<InternshipProfileResponse>>(this.API_URL, { params });
  }

  getInternById(id: number): Observable<InternshipProfileResponse> {
    return this.http.get<InternshipProfileResponse>(`${this.API_URL}/${id}`);
  }

  getAvailableMentors(): Observable<SupervisorResponse[]> {
    return this.http.get<SupervisorResponse[]>(`${this.API_URL}/mentors/available`);
  }

  getAvailableManagers(): Observable<SupervisorResponse[]> {
    return this.http.get<SupervisorResponse[]>(`${this.API_URL}/managers/available`);
  }

  assignSupervisors(request: AssignSupervisorRequest): Observable<InternshipProfileResponse> {
    return this.http.post<InternshipProfileResponse>(`${this.API_URL}/assign-supervisors`, request);
  }

  getInternsByMentor(mentorId: number): Observable<InternshipProfileResponse[]> {
    return this.http.get<InternshipProfileResponse[]>(`${this.API_URL}/by-mentor/${mentorId}`);
  }

  getInternsByManager(managerId: number): Observable<InternshipProfileResponse[]> {
    return this.http.get<InternshipProfileResponse[]>(`${this.API_URL}/by-manager/${managerId}`);
  }
}
