import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  RegisterShopInput,
  ChangeEmailInput,
  DeleteAccountInput,
  UpdateProfileInput,
} from "@easyprint/shared";
import { apiFetch } from "./client";

export type PublicUser = {
  id: string;
  email: string;
  role: "shop_owner" | "customer" | "admin";
  firstname: string;
  lastname: string;
  phone: string;
  address: string | null;
  createdAt: string;
};

export type PublicShop = {
  id: string;
  ownerId: string;
  name: string;
  phone: string | null;
  address: string | null;
  serviceTypes: string[] | null;
  deliveryMethods: string[] | null;
  googleMapLink: string | null;
  idCardUrl: string | null;
  shopPhotoUrl: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  deliveryEnabled: boolean;
  createdAt: string;
};

export function register(input: RegisterInput) {
  return apiFetch<{ user: PublicUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function registerShop(input: RegisterShopInput) {
  return apiFetch<{ user: PublicUser; shop: PublicShop }>("/auth/register/shop", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput) {
  return apiFetch<{ user: PublicUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiFetch<{ ok: true }>("/auth/logout", { method: "POST" });
}

export function getMe() {
  return apiFetch<{ user: PublicUser }>("/auth/me");
}

export function forgotPassword(input: ForgotPasswordInput) {
  return apiFetch<{ ok: true; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resetPassword(input: ResetPasswordInput) {
  return apiFetch<{ ok: true }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function changePassword(input: ChangePasswordInput) {
  return apiFetch<{ ok: true }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProfile(input: UpdateProfileInput) {
  return apiFetch<{ user: PublicUser }>("/auth/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function changeEmail(input: ChangeEmailInput) {
  return apiFetch<{ ok: true }>("/auth/change-email", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteAccount(input: DeleteAccountInput) {
  return apiFetch<{ ok: true }>("/auth/me", {
    method: "DELETE",
    body: JSON.stringify(input),
  });
}
