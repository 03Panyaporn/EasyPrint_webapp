export interface Shop {
  id: string;
  name: string;
  isOpen: boolean;
  services: string;
  serviceTypes: string[];
  location: string;
  locationCategory: "in_campus" | "off_campus";
  operatingHours: string;
  rating: number;
  reviewCount: number;
  canIssueTaxInvoice: boolean;
  imageUrl?: string;
}

export const MOCK_SHOPS: Shop[] = [
  {
    id: "shop-1",
    name: "ร้านดี พริ้น",
    isOpen: false,
    services: "ประเภทงาน : พรินต์สี พรินต์ขาว-ดำ",
    serviceTypes: ["พรินต์สี", "พรินต์ขาว-ดำ"],
    location: "ในมอ อาคาร 99",
    locationCategory: "in_campus",
    operatingHours: "เปิดทุกวัน 9:00 - 18:00 น.",
    rating: 5.0,
    reviewCount: 12,
    canIssueTaxInvoice: true,
  },
  {
    id: "shop-2",
    name: "ร้านดี พริ้น",
    isOpen: true,
    services: "ประเภทงาน : พรินต์สี พรินต์ขาว-ดำ",
    serviceTypes: ["พรินต์สี", "พรินต์ขาว-ดำ"],
    location: "ในมอ อาคาร 99",
    locationCategory: "in_campus",
    operatingHours: "เปิดทุกวัน 9:00 - 18:00 น.",
    rating: 5.0,
    reviewCount: 12,
    canIssueTaxInvoice: true,
  },
  {
    id: "shop-3",
    name: "ร้านดี พริ้น",
    isOpen: true,
    services: "ประเภทงาน : พรินต์สี พรินต์ขาว-ดำ",
    serviceTypes: ["พรินต์สี", "พรินต์ขาว-ดำ"],
    location: "ในมอ อาคาร 99",
    locationCategory: "in_campus",
    operatingHours: "เปิดทุกวัน 9:00 - 18:00 น.",
    rating: 5.0,
    reviewCount: 12,
    canIssueTaxInvoice: true,
  },
  {
    id: "shop-4",
    name: "ร้านดี พริ้น",
    isOpen: true,
    services: "ประเภทงาน : พรินต์สี พรินต์ขาว-ดำ",
    serviceTypes: ["พรินต์สี", "พรินต์ขาว-ดำ"],
    location: "ในมอ อาคาร 99",
    locationCategory: "in_campus",
    operatingHours: "เปิดทุกวัน 9:00 - 18:00 น.",
    rating: 5.0,
    reviewCount: 12,
    canIssueTaxInvoice: true,
  },
  {
    id: "shop-5",
    name: "ร้านดี พริ้น",
    isOpen: true,
    services: "ประเภทงาน : พรินต์สี พรินต์ขาว-ดำ",
    serviceTypes: ["พรินต์สี", "พรินต์ขาว-ดำ"],
    location: "ในมอ อาคาร 99",
    locationCategory: "in_campus",
    operatingHours: "เปิดทุกวัน 9:00 - 18:00 น.",
    rating: 5.0,
    reviewCount: 12,
    canIssueTaxInvoice: true,
  },
  {
    id: "shop-6",
    name: "ร้านดี พริ้น",
    isOpen: true,
    services: "ประเภทงาน : พรินต์สี พรินต์ขาว-ดำ",
    serviceTypes: ["พรินต์สี", "พรินต์ขาว-ดำ"],
    location: "ในมอ อาคาร 99",
    locationCategory: "in_campus",
    operatingHours: "เปิดทุกวัน 9:00 - 18:00 น.",
    rating: 5.0,
    reviewCount: 12,
    canIssueTaxInvoice: true,
  },
];
