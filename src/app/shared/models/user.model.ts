export interface UserCreationRequest {
  name: string;
  email: string;
  roleId: number;
  departmentId: number;
  phone: string;
}

export interface UserProfileResponse {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string; // Optional: URL to user's avatar image
  departmentName?: string; // Optional: Department name for badge
  internshipProfile?: {
    id: number;
    positionName: string;
    universityName: string;
    mentorName: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    status: 'IN_PROGRESS' | 'TERMINATED' | 'COMPLETED' | string; // Backend status
  };
}

export interface ErrorDetails {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

