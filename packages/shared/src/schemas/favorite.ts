// ── ร้านโปรดของลูกค้า ──
// GET /favorites → รายชื่อร้านโปรด, PUT /favorites/:shopId = บันทึก, DELETE /favorites/:shopId = เลิกบันทึก
// ไม่มี request body จึงไม่มี Zod schema — shopId ตรวจรูปแบบ UUID + ร้านต้องอนุมัติแล้วที่ฝั่ง route

export interface FavoriteShopItem {
  shopId: string;
  name: string;
  shopPhotoUrl: string | null;
  address: string | null;
  createdAt: string; // ISO — เวลาที่กดบันทึก
}

export interface FavoriteShopListResponse {
  favorites: FavoriteShopItem[];
}
