export interface UserResponse {
  id: number;
  username: string;
  email: string;
  phoneNumber: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface RegisterResponse {
  user: UserResponse;
  message: string;
}

export interface AuthConfig {
  googleEnabled: boolean;
  googleAuthorizationUrl: string;
}

export interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  category: string;
  itemCondition: string;
  status: "AVAILABLE" | "SOLD" | string;
  imageUrl: string | null;
  sellerId: number;
  sellerUsername: string;
  createdAt: string;
}

export interface ProductInput {
  title: string;
  description?: string | null;
  price: number;
  category: string;
  itemCondition: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiErrorBody {
  message?: string;
  details?: string[];
}
