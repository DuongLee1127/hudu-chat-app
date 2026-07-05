export interface UpdateProfilePayload {
  username: string;
  avatar: string;
  bio: string;
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
