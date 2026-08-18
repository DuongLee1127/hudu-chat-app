export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
}

export interface LoginResult {
  email: string;
  username: string;
  bio: string;
  avatar: string;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResult {
  id: string;
  email: string;
  username: string;
}
