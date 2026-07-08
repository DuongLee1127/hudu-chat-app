export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string | null;
  status: 'online' | 'offline' | 'away';
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  username?: string;
  avatar?: string;
  bio?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface SearchUsersParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ListBlockUserParams {
  page?: number;
  pageSize?: number;
}
