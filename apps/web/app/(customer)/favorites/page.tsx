"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Printer, HeartCrack } from "lucide-react";
import { getFavoriteShops, removeFavoriteShop } from "@/lib/api/favorites";
import type { FavoriteShopItem } from "@easyprint/shared";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    getFavoriteShops()
      .then((res) => setFavorites(res.favorites))
      .catch(() => setLoadError("โหลดรายการโปรดไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (shopId: string) => {
    setRemovingId(shopId);
    try {
      await removeFavoriteShop(shopId);
      setFavorites((prev) => prev.filter((f) => f.shopId !== shopId));
    } catch {
      setLoadError("ลบร้านโปรดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <Heart className="w-4.5 h-4.5 fill-red-500" />
        </div>
        <h1 className="text-xl font-black text-slate-800">ร้านโปรดของฉัน</h1>
      </div>

      {loadError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-slate-200">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-400">
            <HeartCrack size={30} />
          </div>
          <h2 className="text-lg font-semibold text-slate-700">ยังไม่มีร้านโปรด</h2>
          <p className="mt-1 text-sm text-slate-400">
            กดรูปหัวใจที่การ์ดร้านค้าเพื่อบันทึกร้านที่ชอบไว้ที่นี่
          </p>
          <Link
            href="/Dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md"
          >
            ค้นหาร้านถ่ายเอกสาร
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {favorites.map((fav) => (
            <div
              key={fav.shopId}
              className="group border border-orange-200/80 hover:border-orange-400 rounded-xl sm:rounded-2xl p-2 sm:p-3.5 bg-white shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative w-full h-24 xs:h-28 sm:h-36 lg:h-36 bg-slate-200 rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-2.5">
                  {fav.shopPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fav.shopPhotoUrl} alt={fav.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition duration-300" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <Printer className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400/70" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(fav.shopId)}
                    disabled={removingId === fav.shopId}
                    title="เลิกบันทึกร้านโปรด"
                    className="absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xs transition disabled:opacity-50"
                  >
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-red-500 text-red-500" />
                  </button>
                </div>
                <div className="space-y-1 sm:space-y-1.5">
                  <h3 className="text-xs sm:text-base font-black text-orange-500 group-hover:text-orange-600 transition truncate">{fav.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600 font-medium truncate">
                    <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                    <span className="truncate">{fav.address ?? "-"}</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 mt-1 sm:mt-2">
                <Link
                  href={`/shops/${fav.shopId}`}
                  className="w-full block text-center px-3 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-extrabold text-white bg-orange-500 hover:bg-orange-600 rounded-full shadow-xs transition active:scale-95"
                >
                  เลือกบริการ
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
