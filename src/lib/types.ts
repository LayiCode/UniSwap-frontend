export interface UserResponse {
  id: number;
  username: string;
  email: string;
  phoneNumber: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  emailVerified: boolean;
  admin: boolean;
  createdAt: string;
}

/** Minimal profile of another user, shown on profiles and seller surfaces. */
export interface PublicUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  createdAt: string;
  activeListingsCount: number;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  location?: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface RegisterResponse {
  user: UserResponse;
  message: string;
  /** Present only when the verification email couldn't be delivered. */
  verificationCode?: string | null;
}

/** Response from login-code / resend-verification-code (may carry a fallback code). */
export interface CodeResponse {
  verificationCode?: string | null;
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
  status: "AVAILABLE" | "SOLD" | "REMOVED" | string;
  imageUrl: string | null;
  // All photos in display order (index 0 = the cover). Only present on
  // detail lookups; list endpoints return null and imageUrl is the fallback.
  imageUrls?: string[] | null;
  sellerId: number;
  sellerUsername: string;
  sellerDisplayName: string | null;
  sellerAvatarUrl: string | null;
  location: string | null;
  createdAt: string;
  favorited: boolean;
  purchaseRequested?: boolean;
}

export interface ProductInput {
  title: string;
  description?: string | null;
  price: number;
  category: string;
  itemCondition: string;
  location?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  senderUsername: string;
  receiverId: number;
  receiverUsername: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  otherUserId: number;
  otherUsername: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface SendMessageInput {
  receiverId: number;
  message: string;
}

export type PurchaseRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export interface PurchaseRequest {
  id: number;
  productId: number;
  productTitle: string;
  productImageUrl: string | null;
  productPrice: number;
  productStatus: string;
  sellerId: number;
  sellerUsername: string;
  buyerId: number;
  buyerUsername: string;
  message: string | null;
  status: PurchaseRequestStatus;
  createdAt: string;
  decidedAt: string | null;
}

export interface CreatePurchaseRequestInput {
  productId: number;
  message?: string;
}

export type ReportReason = "SPAM" | "INAPPROPRIATE" | "SCAM" | "DUPLICATE" | "OTHER";
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

export interface Report {
  id: number;
  productId: number;
  productTitle: string;
  productImageUrl: string | null;
  productPrice: number;
  productStatus: string;
  sellerId: number;
  sellerUsername: string;
  reporterId: number;
  reporterUsername: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface CreateReportInput {
  productId: number;
  reason: ReportReason;
  details?: string;
}

export interface UpdateReportStatusInput {
  status: ReportStatus;
  removeProduct?: boolean;
}

export interface ApiErrorBody {
  message?: string;
  details?: string[];
  retryAfterSeconds?: number;
}
