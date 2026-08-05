import type {
  AuthConfig,
  AuthResponse,
  ChatMessage,
  Conversation,
  PageResponse,
  Product,
  ProductInput,
  RegisterResponse,
  SendMessageInput,
  UserResponse,
  ApiErrorBody,
} from "./types";

const TOKEN_KEY = "uniswap_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  if (!res.ok) {
    // A 401 means the token is gone/expired/revoked. Drop it immediately and
    // tell AuthContext to reset state so the UI reflects "logged out" without
    // waiting for a full page reload.
    if (res.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("uniswap:unauthorized"));
      }
    }
    let message = `Request failed with status ${res.status}`;
    let details: string[] | undefined;
    try {
      const body: ApiErrorBody = await res.json();
      if (body.message) message = body.message;
      if (Array.isArray(body.details)) details = body.details;
    } catch {
      // non-JSON error body — keep the fallback message
    }
    throw new ApiError(res.status, message, details);
  }

  // Several endpoints respond 200 with an empty body (e.g. login-code,
  // resend-verification-code, forgot-password, reset-password). Calling
  // res.json() on those throws "Unexpected end of JSON input", so read the
  // text and only parse when there is actually something to parse.
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// Strips the backend origin from image URLs so they route through the
// same-origin /uploads proxy instead of hitting the backend directly.
export function imageUrl(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  return src.replace(/^https?:\/\/[^/]+/, "");
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export interface ProductQuery {
  search?: string;
  category?: string;
  page?: number;
  size?: number;
}

export const api = {
  // Creates the account (emailVerified=false) and emails a signup code. Does
  // NOT log you in — you must confirm the code on /verify-email first.
  register(data: {
    username: string;
    email: string;
    password: string;
    phoneNumber: string;
  }): Promise<RegisterResponse> {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  verifyEmail(email: string, code: string): Promise<{ message: string }> {
    return request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  // Password login with email + password.
  login(email: string, password: string): Promise<AuthResponse> {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // Live username-availability check for the register form.
  checkUsername(username: string): Promise<{ available: boolean }> {
    const params = new URLSearchParams({ username });
    return request(`/auth/check-username?${params.toString()}`);
  },

  resendVerificationCode(email: string): Promise<void> {
    return request("/auth/resend-verification-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Passwordless login, step 1: emails a one-time code.
  requestLoginCode(email: string): Promise<void> {
    return request("/auth/login-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Passwordless login, step 2: exchange the code for a token.
  loginWithCode(email: string, code: string): Promise<AuthResponse> {
    return request("/auth/login-code/verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  forgotPassword(email: string): Promise<void> {
    return request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    return request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    });
  },

  getAuthConfig(): Promise<AuthConfig> {
    return request("/auth/config");
  },

  getMe(): Promise<UserResponse> {
    return request("/users/me");
  },

  getProducts(query: ProductQuery = {}): Promise<PageResponse<Product>> {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.category) params.set("category", query.category);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.size !== undefined) params.set("size", String(query.size));
    const qs = params.toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },

  getProduct(id: number | string): Promise<Product> {
    return request(`/products/${id}`);
  },

  getMyListings(page = 0, size = 12): Promise<PageResponse<Product>> {
    return request(`/products/my-listings?page=${page}&size=${size}`);
  },

  createProduct(data: ProductInput): Promise<Product> {
    return request("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateProduct(id: number | string, data: ProductInput): Promise<Product> {
    return request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  uploadImage(id: number | string, file: File): Promise<Product> {
    const form = new FormData();
    form.append("file", file);
    return request(`/products/${id}/image`, {
      method: "POST",
      body: form,
    });
  },

  markSold(id: number | string): Promise<Product> {
    return request(`/products/${id}/sold`, { method: "PATCH" });
  },

  deleteProduct(id: number | string): Promise<void> {
    return request(`/products/${id}`, { method: "DELETE" });
  },

  getConversations(): Promise<Conversation[]> {
    return request("/chat/conversations");
  },

  getMessages(withUserId: number): Promise<ChatMessage[]> {
    return request(`/chat/messages?with=${withUserId}`);
  },

  sendMessage(data: SendMessageInput): Promise<ChatMessage> {
    return request("/chat/messages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getUnreadCount(): Promise<{ count: number }> {
    return request("/chat/unread-count");
  },
};
