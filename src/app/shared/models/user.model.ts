export interface UserCreationRequest {
  name: string;
  email: string;
  roleId: string;
  departmentId: string;
  phone: string;
}

export interface ErrorDetails {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
