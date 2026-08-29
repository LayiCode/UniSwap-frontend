import type {
  AuthConfig,
  AuthResponse,
  ChatMessage,
  CodeResponse,
  Conversation,
  CreatePurchaseRequestInput,
  CreateReportInput,
  PageResponse,
  Product,
  ProductInput,
  PublicUser,
  PurchaseRequest,
  RegisterResponse,
  Report,
  ReportStatus,
  SendMessageInput,
  UpdateProfileInput,
  UpdateReportStatusInput,
  UserResponse,
  ApiErrorBody,
} from "./types";
import { setWakingServer } from "@/lib/wakingServer";

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
  retryAfterSeconds?: number;

  constructor(status: number, message: string, details?: string[], retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// Render's free tier lets the backend go to sleep after ~15 min of no traffic
// and cold-starts it on the next request. That first wake-up request usually
// fails with a network error or a 502/503/504 gateway error while the instance
// boots. We detect those sleep signatures and retry a couple of times with a
// short backoff (the first attempt wakes it, a retry hits the warm app),
// showing a "Waking UniSwap up…" banner while we wait.
const WAKING_RETRY_DELAYS_MS = [4000, 8000];

function isRetriableWakingStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const attempt = async (): Promise<T> => {
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
      let retryAfterSeconds: number | undefined;
      try {
        const body: ApiErrorBody = await res.json();
        if (body.message) message = body.message;
        if (Array.isArray(body.details)) details = body.details;
        if (typeof body.retryAfterSeconds === "number")
          retryAfterSeconds = body.retryAfterSeconds;
      } catch {
        // non-JSON error body — keep the fallback message
      }
      throw new ApiError(res.status, message, details, retryAfterSeconds);
    }

    // Several endpoints respond 200 with an empty body (e.g. login-code,
    // resend-verification-code, forgot-password, reset-password). Calling
    // res.json() on those throws "Unexpected end of JSON input", so read the
    // text and only parse when there is actually something to parse.
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  };

  for (let i = 0; i <= WAKING_RETRY_DELAYS_MS.length; i++) {
    try {
      const result = await attempt();
      setWakingServer(false);
      return result;
    } catch (err) {
      const networkFailed = err instanceof ApiError && err.status === 0;
      const gatewayError =
        err instanceof ApiError && isRetriableWakingStatus(err.status);
      const canRetry = i < WAKING_RETRY_DELAYS_MS.length && (networkFailed || gatewayError);
      if (!canRetry) {
        setWakingServer(false);
        throw err;
      }
      setWakingServer(true);
      await sleep(WAKING_RETRY_DELAYS_MS[i]);
    }
  }
  // Unreachable: the loop always returns or throws on the final iteration.
  throw new ApiError(0, "Cannot reach the server. Is the backend running?");
}

// Rewrites image URLs so they render correctly in the browser. Images hosted
// on the backend (local /uploads proxy) run through the same-origin /uploads
// rewrite, so the backend origin is stripped. External origins — like Supabase
// Storage URLs from the multi-image feature — are left fully intact.
export function imageUrl(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  return src.replace(/^https?:\/\/[^/]+(?=\/uploads)/, "");
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
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc";
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

  resendVerificationCode(email: string): Promise<CodeResponse> {
    return request("/auth/resend-verification-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Passwordless login, step 1: emails a one-time code. Resolves with the code
  // itself when email delivery failed (fallback for campus inboxes).
  requestLoginCode(email: string): Promise<CodeResponse> {
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

  // Partial update of the current user's profile (display name, bio, location).
  updateProfile(data: UpdateProfileInput): Promise<UserResponse> {
    return request("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Replaces the current user's avatar. Field name must be "file".
  uploadAvatar(file: File): Promise<UserResponse> {
    const form = new FormData();
    form.append("file", file);
    return request("/users/me/avatar", {
      method: "POST",
      body: form,
    });
  },

  // Public profile lookup for another user (email/phone withheld).
  getPublicUser(id: number | string): Promise<PublicUser> {
    return request(`/users/${id}`);
  },

  // Public profile's currently-available listings for this seller.
  getUserProducts(
    id: number | string,
    page = 0,
    size = 12
  ): Promise<PageResponse<Product>> {
    return request(`/users/${id}/products?page=${page}&size=${size}`);
  },

  getProducts(query: ProductQuery = {}): Promise<PageResponse<Product>> {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.category) params.set("category", query.category);
    if (query.condition) params.set("condition", query.condition);
    if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
    if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
    if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
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

  getFavorites(page = 0, size = 12): Promise<PageResponse<Product>> {
    return request(`/favorites?page=${page}&size=${size}`);
  },

  addFavorite(productId: number | string): Promise<void> {
    return request(`/favorites/${productId}`, { method: "POST" });
  },

  removeFavorite(productId: number | string): Promise<void> {
    return request(`/favorites/${productId}`, { method: "DELETE" });
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

  uploadImages(id: number | string, files: File[]): Promise<Product> {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return request(`/products/${id}/images`, {
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

  // ── Purchase requests ────────────────────────────────────────────────
  // scope: "received" = requests on my listings (seller view, default),
  //        "sent"     = requests I made (buyer view).
  createPurchaseRequest(data: CreatePurchaseRequestInput): Promise<PurchaseRequest> {
    return request("/purchases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPurchaseRequests(
    scope: "received" | "sent" = "received",
    page = 0,
    size = 12,
  ): Promise<PageResponse<PurchaseRequest>> {
    return request(`/purchases?scope=${scope}&page=${page}&size=${size}`);
  },

  acceptPurchaseRequest(id: number | string): Promise<PurchaseRequest> {
    return request(`/purchases/${id}/accept`, { method: "POST" });
  },

  declinePurchaseRequest(id: number | string): Promise<PurchaseRequest> {
    return request(`/purchases/${id}/decline`, { method: "POST" });
  },

  cancelPurchaseRequest(id: number | string): Promise<PurchaseRequest> {
    return request(`/purchases/${id}/cancel`, { method: "POST" });
  },

  // ── Reports & moderation (queue is admin-only) ──────────────────────
  createReport(data: CreateReportInput): Promise<Report> {
    return request("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getReports(status?: ReportStatus, page = 0, size = 20): Promise<PageResponse<Report>> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    return request(`/reports?${params.toString()}`);
  },

  updateReportStatus(id: number | string, data: UpdateReportStatusInput): Promise<Report> {
    return request(`/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
