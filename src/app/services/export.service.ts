import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../api-endpoints';

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private http: HttpClient) {}

  /**
   * Tải file Excel báo cáo 1 intern.
   * JWT interceptor tự thêm Authorization header.
   */
  exportInternExcel(internId: number): Observable<Blob> {
    return this.http.get(API_ENDPOINTS.Export.internExcel(internId), {
      responseType: 'blob',
    });
  }

  /**
   * Tải file Excel báo cáo nhóm.
   * Có thể lọc theo departmentId và/hoặc universityId.
   */
  exportGroupExcel(departmentId?: number, universityId?: number): Observable<Blob> {
    return this.http.get(API_ENDPOINTS.Export.groupExcel(departmentId, universityId), {
      responseType: 'blob',
    });
  }

  /** Trigger download từ Blob */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}