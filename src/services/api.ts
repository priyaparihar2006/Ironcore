import { API_BASE } from "../lib/api";

// Same-origin relative path (shared with lib/api.ts) — see that file for why.
const BASE_URL = API_BASE;

export type Role = "USER" | "TRAINER" | "ADMIN";

// Matches sanitizeUser(User) in api.ts — full User minus passwordHash
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  fitnessGoal?: string;
  status: "ACTIVE" | "INACTIVE";
  joinedDate: string;
  avatar?: string;
  assignedTrainerId?: string;
}

export interface UserProfile {
  userId: string;
  currentWeight: number;
  targetWeight: number;
  height: number;
  bodyFatPercentage: number;
  muscleMass: number;
  emergencyContact?: string;
  bio?: string;
}

export interface UserMembership {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: "ACTIVE" | "EXPIRED" | "PENDING" | "CANCELLED";
  startDate: string;
  expiryDate: string;
  billingCycle: "monthly" | "annual";
  pricePaid: number;
  autoRenew: boolean;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

// Distinct shape — /auth/me does NOT return {token, user} like login/register
export interface MeResponse {
  user: AuthUser;
  profile: UserProfile | null;
  membership: UserMembership | null;
}

function getToken(): string | null {
  return localStorage.getItem("ironcore_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      // api.ts / auth.ts always use `error`
      message = body.error || message;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string, rememberMe: boolean) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    fitnessGoal?: string;
  }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),

  getMe: () => request<MeResponse>("/auth/me"),

  updateProfile: (data: Partial<AuthUser & UserProfile>) =>
    request<any>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};