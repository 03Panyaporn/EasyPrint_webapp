"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface ShopLocationMapProps {
  address: string;
  shopName: string;
  className?: string;
}

// หมุดสีแดงวาดเองด้วย inline SVG แทน marker เริ่มต้นของ Leaflet
// (marker เริ่มต้นอ้าง path รูปภาพที่มักพังตอน build กับ bundler ของ Next.js — ใช้ divIcon แทนเลยไม่ต้องพึ่ง asset ไฟล์ใดๆ)
const PIN_SVG = `<svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 0C7.6 0 0 7.6 0 17c0 12.1 17 29 17 29s17-16.9 17-29C34 7.6 26.4 0 17 0z" fill="#F46A2F"/>
  <circle cx="17" cy="17" r="6.5" fill="#ffffff"/>
</svg>`;

type GeocodeResult = { lat: number; lon: number; approximate: boolean };

// ที่อยู่ไทยระดับหมู่บ้าน (เช่น "19 หมู่ 2 ต.แม่กา") มักไม่มีใน OpenStreetMap ตรงเป๊ะ
// แยกที่อยู่เป็นส่วนๆ (บ้านเลขที่/หมู่, ตำบล, อำเภอ, จังหวัด) แล้วต่อด้วยคอมมา — ช่วยให้ geocoder แยกส่วนที่อยู่ได้แม่นขึ้นมากกว่าข้อความยาวรวด
// ไล่ค้นหาจากที่อยู่เต็มก่อน แล้วค่อยๆ ตัดให้กว้างขึ้น (ตำบล → อำเภอ → จังหวัด) จนกว่าจะเจอพิกัด
// ผลจากการตัดให้กว้างขึ้นถือเป็นตำแหน่ง "โดยประมาณ" ไม่ใช่ตำแหน่งร้านเป๊ะๆ
function buildFallbackQueries(address: string): string[] {
  const tambonIdx = address.indexOf("ต.");
  const amphoeIdx = address.indexOf("อ.");
  const changwatIdx = address.indexOf("จ.");

  const houseMoo = tambonIdx > 0 ? address.slice(0, tambonIdx).trim() : "";
  const tambon = tambonIdx >= 0 ? address.slice(tambonIdx, amphoeIdx >= 0 ? amphoeIdx : undefined).trim() : "";
  const amphoe = amphoeIdx >= 0 ? address.slice(amphoeIdx, changwatIdx >= 0 ? changwatIdx : undefined).trim() : "";
  const changwat = changwatIdx >= 0 ? address.slice(changwatIdx).trim() : "";

  const parts = [houseMoo, tambon, amphoe, changwat].filter(Boolean);
  if (parts.length < 2) return [address];

  const queries = [parts.join(", ")]; // ที่อยู่เต็ม คั่นด้วยคอมมา — ลองก่อนเป็นอันดับแรก
  for (let dropFrom = 1; dropFrom < parts.length; dropFrom++) {
    queries.push(parts.slice(dropFrom).join(", "));
  }
  return Array.from(new Set(queries));
}

async function geocode(address: string): Promise<GeocodeResult | null> {
  const queries = buildFallbackQueries(address);
  for (let i = 0; i < queries.length; i++) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=th&q=${encodeURIComponent(queries[i])}`
    );
    const results: { lat: string; lon: string }[] = await res.json();
    if (results.length) {
      return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), approximate: i > 0 };
    }
  }
  return null;
}

// แผนที่ตำแหน่งร้าน — geocode ที่อยู่ผ่าน Nominatim (OpenStreetMap) แล้วปักหมุดแดงเอง
// เลือกทางนี้แทนการฝัง Google Maps ด้วยข้อความค้นหา เพราะที่อยู่ร้าน (หมู่/ตำบล) มักไม่ตรงกับสถานที่ที่ Google รู้จักแบบเป๊ะๆ
// ทำให้ embed ของ Google โชว์ผลลัพธ์ธุรกิจใกล้เคียงหลายจุดแทนหมุดเดียว — วิธีนี้เราคุมตำแหน่งหมุดเองได้ 100%
export default function ShopLocationMap({ address, shopName, className }: ShopLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "found" | "not-found" | "error">("loading");
  const [approximate, setApproximate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");
      try {
        const hit = await geocode(address);
        if (cancelled) return;
        if (!hit) {
          setStatus("not-found");
          return;
        }

        // @ts-ignore
        const leafletModule: any = await import("leaflet");
        const L = leafletModule.default ?? leafletModule;
        if (cancelled || !containerRef.current) return;

        if (!mapRef.current) {
          mapRef.current = L.map(containerRef.current, {
            scrollWheelZoom: false, // กัน scroll หน้าเว็บโดนแย่งตอนเลื่อนเมาส์ผ่านแผนที่
            zoomControl: false, // เอาปุ่ม +/- ออก ให้ดูเป็นภาพแผนที่นิ่งๆ มากกว่าเครื่องมือแผนที่แบบเต็ม
            dragging: false, // ให้เป็นภาพแผนที่แสดงตำแหน่งเฉยๆ ไม่ต้องลากดูรอบๆ ได้
          });
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }).addTo(mapRef.current);
        }

        mapRef.current.setView([hit.lat, hit.lon], hit.approximate ? 13 : 16);

        if (markerRef.current) {
          markerRef.current.remove();
        }
        const pinIcon = L.divIcon({
          html: PIN_SVG,
          className: "",
          iconSize: [34, 46],
          iconAnchor: [17, 46],
          popupAnchor: [0, -40],
        });
        markerRef.current = L.marker([hit.lat, hit.lon], { icon: pinIcon }).addTo(mapRef.current).bindPopup(shopName);

        setApproximate(hit.approximate);
        setStatus("found");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [address, shopName]);

  // ทำลาย map instance ตอน component unmount กันปัญหา Leaflet init ซ้ำบน container เดิม
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={containerRef} className="w-full h-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
          กำลังโหลดแผนที่...
        </div>
      )}
      {status === "not-found" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400 text-sm px-6 text-center">
          ไม่พบตำแหน่งบนแผนที่สำหรับที่อยู่นี้
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400 text-sm px-6 text-center">
          โหลดแผนที่ไม่สำเร็จ
        </div>
      )}
      {status === "found" && approximate && (
        <span className="absolute bottom-3 left-3 text-[11px] font-bold text-slate-600 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-xs z-[500]">
          ตำแหน่งโดยประมาณ (ระดับพื้นที่ใกล้เคียง)
        </span>
      )}
    </div>
  );
}
