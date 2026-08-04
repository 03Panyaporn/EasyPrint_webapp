import { apiFetch } from "./client";

export type Address = {
    id: string;
    receiverName: string;
    phone: string;
    address: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
    label: string;
    isDefault: boolean;
};

export function getAddresses() {
    return apiFetch<{ addresses: Address[] }>("/addresses");
}

export function createAddress(data: Omit<Address, "id">) {
    return apiFetch<{ address: Address }>("/addresses", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updateAddress(id: string, data: Partial<Address>) {
    return apiFetch<{ address: Address }>(`/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function deleteAddress(id: string) {
    return apiFetch<{ ok: true }>(`/addresses/${id}`, {
        method: "DELETE",
    });
}

export function setDefaultAddress(id: string) {
    return apiFetch<{ ok: true }>(`/addresses/${id}/default`, {
        method: "PATCH",
    });
}