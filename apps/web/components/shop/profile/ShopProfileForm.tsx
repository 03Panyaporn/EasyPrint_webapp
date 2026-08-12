"use client";

import { useEffect, useState, useRef } from "react";
import { getMyShopProfile, updateShopProfile, type MyShopProfile, type ShopOpeningHours } from "@/lib/api/shops";
import { isShopOpenNow, isShopTempClosed } from "@/lib/shopHours";
import { uploadFile } from "@/lib/api/uploads";
import { Store, Camera, Loader2, MapPin, Clock, Info, ExternalLink, FileText, Save, AlertTriangle, Calendar } from "lucide-react";

const DAYS = [
  { id: "mon", label: "จันทร์" },
  { id: "tue", label: "อังคาร" },
  { id: "wed", label: "พุธ" },
  { id: "thu", label: "พฤหัสบดี" },
  { id: "fri", label: "ศุกร์" },
  { id: "sat", label: "เสาร์" },
  { id: "sun", label: "อาทิตย์" },
];

const PROVINCES = [
  "กระบี่", "กรุงเทพมหานคร", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", 
  "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", 
  "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", 
  "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", 
  "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", 
  "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", 
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", 
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", 
  "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", 
  "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

const DEFAULT_HOURS: ShopOpeningHours[] = DAYS.map((d) => ({
  day: d.id,
  isOpen: true,
  openTime: "08:00",
  closeTime: "18:00",
}));

export default function ShopProfileForm() {
  const [shop, setShop] = useState<MyShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);


  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shopPhotoUrl, setShopPhotoUrl] = useState("");
  
  // Address fields
  const [houseNo, setHouseNo] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [googleMapLink, setGoogleMapLink] = useState("");
  
  // Keep original fields for backward compatibility if needed
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [facebook, setFacebook] = useState("");
  const [lineId, setLineId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [openingHours, setOpeningHours] = useState<ShopOpeningHours[]>(DEFAULT_HOURS);

  // Temporary close
  const [tempCloseStart, setTempCloseStart] = useState("");
  const [tempCloseEnd, setTempCloseEnd] = useState("");
  const [tempCloseReason, setTempCloseReason] = useState("");

  // Status is derived dynamically from openingHours and tempClose settings
  const isShopOpen = !isShopTempClosed(tempCloseStart, tempCloseEnd) && isShopOpenNow(openingHours);

  // Status modal
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "open" | "close" | "cancel-temp-close" | null;
    currentSchedule: string;
    currentTime: string;
    reason: string;
    tempCloseDateRange?: string;
  }>({
    isOpen: false,
    type: null,
    currentSchedule: "",
    currentTime: "",
    reason: "",
    tempCloseDateRange: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getMyShopProfile();
      const s = res.shop;
      setShop(s);
      setName(s.name || "");
      setPhone(s.phone || "");
      setEmail(s.email || "");
      setFacebook(s.facebook || "");
      setLineId(s.lineId || "");
      setDescription(s.description || "");
      setLatitude(s.latitude || "");
      setLongitude(s.longitude || "");
      setShopPhotoUrl(s.shopPhotoUrl || "");
      setGoogleMapLink(s.googleMapLink || "");
      setTempCloseStart(s.tempCloseStart || "");
      setTempCloseEnd(s.tempCloseEnd || "");
      setTempCloseReason(s.tempCloseReason || "");
      
      // Parse address string back into components
      if (s.address) {
        let sub = "", dist = "", prov = "", zip = "";
        let rest = s.address.trim();

        // Extract zipcode (last 5 digits)
        const zipMatch = rest.match(/(\d{5})$/);
        if (zipMatch) {
          zip = zipMatch[1];
          rest = rest.replace(zip, "").trim();
        }

        const provIdx = rest.lastIndexOf("จ.");
        if (provIdx !== -1) {
          prov = rest.substring(provIdx + 2).trim();
          rest = rest.substring(0, provIdx).trim();
        }

        const distIdx = rest.lastIndexOf("อ.");
        if (distIdx !== -1) {
          dist = rest.substring(distIdx + 2).trim();
          rest = rest.substring(0, distIdx).trim();
        }

        const subIdx = rest.lastIndexOf("ต.");
        if (subIdx !== -1) {
          sub = rest.substring(subIdx + 2).trim();
          rest = rest.substring(0, subIdx).trim();
        }

        setHouseNo(rest);
        setSubdistrict(sub);
        setDistrict(dist);
        setProvince(prov);
        setZipcode(zip);
      }
      
      if (s.openingHours && s.openingHours.length > 0) {
        setOpeningHours(s.openingHours);
      } else {
        setOpeningHours(DEFAULT_HOURS);
      }
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลร้านได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    if (!name.trim()) {
      setError("กรุณากรอกชื่อร้าน");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!houseNo.trim()) {
      setError("กรุณากรอกที่อยู่ (บ้านเลขที่)");
      return;
    }
    if (!subdistrict.trim()) {
      setError("กรุณากรอกตำบล/แขวง");
      return;
    }
    if (!district.trim()) {
      setError("กรุณากรอกอำเภอ/เขต");
      return;
    }
    if (!province.trim()) {
      setError("กรุณาเลือกจังหวัด");
      return;
    }
    if (!zipcode.trim()) {
      setError("กรุณากรอกรหัสไปรษณีย์");
      return;
    }

    // Combine address
    const combinedAddress = [
      houseNo,
      subdistrict ? `ต.${subdistrict}` : "",
      district ? `อ.${district}` : "",
      province ? `จ.${province}` : "",
      zipcode
    ].filter(Boolean).join(" ");

    try {
      setSaving(true);
      await updateShopProfile({
        name,
        description: description || null,
        phone,
        email: email || null,
        facebook: facebook || null,
        lineId: lineId || null,
        address: combinedAddress || houseNo || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        shopPhotoUrl: shopPhotoUrl || null,
        openingHours,
        googleMapLink: googleMapLink || null,
        tempCloseStart: tempCloseStart || null,
        tempCloseEnd: tempCloseEnd || null,
        tempCloseReason: tempCloseReason || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError("");
      const res = await uploadFile(file, "shop-photo");
      if (res.url) {
        setShopPhotoUrl(res.url);
      }
    } catch (err: any) {
      setError(err.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateHour = (dayId: string, field: keyof ShopOpeningHours, value: any) => {
    setOpeningHours((prev) =>
      prev.map((h) => (h.day === dayId ? { ...h, [field]: value } : h))
    );
  };

  const applyMondayHoursToAll = () => {
    const mon = openingHours.find(h => h.day === "mon" || h.day === "จันทร์");
    if (!mon) return;
    
    setOpeningHours(prev => prev.map(h => ({
      ...h,
      isOpen: mon.isOpen,
      openTime: mon.openTime,
      closeTime: mon.closeTime
    })));
  };


  const handleToggleStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // rely on derived state
    
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;
    const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const currentDayStr = dayMap[now.getDay()];
    const todayHours = openingHours.find(h =>
      h.day === currentDayStr ||
      h.day === DAYS.find(d => d.id === currentDayStr)?.label
    );
    const scheduleStr = todayHours?.isOpen
      ? `${todayHours.openTime} - ${todayHours.closeTime} น.`
      : "ปิดทำการ";

    if (isShopOpen) {
      // User wants to CLOSE → show modal
      setStatusModal({
        isOpen: true,
        type: "close",
        currentSchedule: scheduleStr,
        currentTime: currentTimeStr,
        reason: ""
      });
    } else {
      // User wants to OPEN
      if (isShopTempClosed(tempCloseStart, tempCloseEnd)) {
        // Was temp-closed → show cancel temp close modal
        const formatDate = (dateStr: string) => {
          if (!dateStr) return "";
          const d = new Date(dateStr);
          return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        };
        const dateRangeStr = `${formatDate(tempCloseStart)} – ${formatDate(tempCloseEnd)}`;

        setStatusModal({
          isOpen: true,
          type: "cancel-temp-close",
          currentSchedule: scheduleStr,
          currentTime: currentTimeStr,
          reason: "",
          tempCloseDateRange: dateRangeStr
        });
      } else {
        // Outside normal hours → show popup asking to open outside hours
        setStatusModal({
          isOpen: true,
          type: "open",
          currentSchedule: scheduleStr,
          currentTime: currentTimeStr,
          reason: ""
        });
      }
    }
  };

  const handleConfirmStatusModal = async () => {
    let newStart = tempCloseStart;
    let newEnd = tempCloseEnd;
    let newReason = tempCloseReason;

    if (statusModal.type === "close") {
      if (!statusModal.reason.trim()) return;
      newReason = statusModal.reason;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      newStart = todayStr;
      newEnd = todayStr;
    } else if (statusModal.type === "open" || statusModal.type === "cancel-temp-close") {
      // Open outside hours — requires a reason, but cancel-temp-close DOES NOT need a reason
      if (statusModal.type === "open" && !statusModal.reason.trim()) return;
      
      // Clear any temp close so the derived state becomes "open"
      newStart = "";
      newEnd = "";
      newReason = "";
    }
    
    setTempCloseStart(newStart);
    setTempCloseEnd(newEnd);
    setTempCloseReason(newReason);
    setStatusModal(prev => ({ ...prev, isOpen: false }));

    // Save to API immediately
    const combinedAddress = [
      houseNo,
      subdistrict ? `ต.${subdistrict}` : "",
      district ? `อ.${district}` : "",
      province ? `จ.${province}` : "",
      zipcode
    ].filter(Boolean).join(" ");

    try {
      setSaving(true);
      await updateShopProfile({
        name,
        description: description || null,
        phone,
        email: email || null,
        facebook: facebook || null,
        lineId: lineId || null,
        address: combinedAddress || houseNo || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        shopPhotoUrl: shopPhotoUrl || null,
        openingHours,
        googleMapLink: googleMapLink || null,
        tempCloseStart: newStart || null,
        tempCloseEnd: newEnd || null,
        tempCloseReason: newReason || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "บันทึกข้อมูลไม่สำเร็จ");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
              <Store size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">โปรไฟล์ร้านค้า</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">จัดการข้อมูลร้านค้าของคุณให้ลูกค้ามองเห็น</p>
        </div>
        
        <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="text-sm font-medium">
            <div className="text-gray-500 mb-0.5">สถานะร้าน</div>
            <div className={isShopOpen ? "text-green-600" : "text-red-500"}>
              {isShopOpen ? "เปิดร้านให้บริการ" : "ปิดร้านชั่วคราว"}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isShopOpen}
              onChange={handleToggleStatus}
            />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
      </div>

      {error && (
        <div className="fixed top-24 right-4 z-50 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-right-8 fade-in duration-300 flex items-center gap-2 max-w-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="fixed top-24 right-4 z-50 p-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-right-8 fade-in duration-300 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          บันทึกข้อมูลเรียบร้อยแล้ว
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* 1. รูปโปรไฟล์ร้าน */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-6">1. รูปโปรไฟล์ร้าน <span className="text-red-500 ml-1">*</span></h2>
            <div className="flex-1 flex flex-col items-center justify-center w-full pt-4">
              <div className="relative mb-6 w-full max-w-[240px]">
                <div className="w-full aspect-[4/3] rounded-2xl bg-orange-600 text-white flex flex-col items-center justify-center overflow-hidden shadow-sm border border-orange-100">
                  {shopPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shopPhotoUrl} alt="Shop logo" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Store className="w-12 h-12 mb-1" />
                      <span className="font-bold text-xl leading-tight">EasyPrint</span>
                      <span className="text-xs uppercase tracking-wider">SHOP</span>
                    </>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-3 -right-3 bg-white p-2.5 rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-orange-600 transition z-10"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>
              <div className="text-xs text-gray-500 text-center leading-relaxed">
                แนะนำขนาด 800x800px<br/>ไฟล์ JPG, PNG ขนาดไม่เกิน 2MB
              </div>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="mt-6 w-full py-2.5 px-4 rounded-xl border border-orange-200 text-orange-600 font-medium text-sm hover:bg-orange-50 transition"
              >
                {uploadingPhoto ? "กำลังอัปโหลด..." : "เปลี่ยนรูปภาพ"}
              </button>
            </div>
          </div>
        </div>

        {/* 2. ข้อมูลทั่วไป */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-6">2. ข้อมูลทั่วไป</h2>
            <div className="space-y-5 flex-1 flex flex-col">
              <div>
                <label className="text-[15px] font-medium text-gray-700 mb-1.5 block">ชื่อร้าน <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-2.5 text-[15px] placeholder:text-[15px] placeholder:text-gray-400 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" 
                  placeholder="เช่น EasyPrint Shop"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-[15px] font-medium text-gray-700 mb-1.5 block">คำอธิบายร้าน <span className="text-gray-400 font-normal text-xs ml-1">(ไม่บังคับ)</span></label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value.substring(0, 300))} 
                  className="w-full px-4 py-3 text-[15px] placeholder:text-[15px] placeholder:text-gray-400 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition resize-none flex-1 min-h-[100px]" 
                  placeholder="ร้านถ่ายเอกสารและงานพิมพ์ครบวงจร..."
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {description.length}/300
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ที่ตั้งร้าน */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">3. ที่ตั้งร้าน</h2>
        
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
          <div className="md:col-span-2">
            <label className="text-[15px] font-medium text-gray-700 mb-1.5 block">ที่อยู่ <span className="text-red-500">*</span></label>
            <input type="text" value={houseNo} onChange={(e) => setHouseNo(e.target.value)} className="w-full px-4 py-2.5 text-[15px] placeholder:text-[15px] placeholder:text-gray-400 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" placeholder="บ้านเลขที่, หมู่, ซอย, ถนน" />
          </div>
          
          <div>
            <label className="text-[15px] font-medium text-gray-700 mb-1.5 block">ตำบล/แขวง <span className="text-red-500">*</span></label>
            <input type="text" value={subdistrict} onChange={(e) => setSubdistrict(e.target.value)} className="w-full px-4 py-2.5 text-[15px] placeholder:text-[15px] placeholder:text-gray-400 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" placeholder="แม่กา" />
          </div>
          
          <div>
            <label className="text-[15px] font-medium text-gray-700 mb-1.5 block">อำเภอ/เขต <span className="text-red-500">*</span></label>
            <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-4 py-2.5 text-[15px] placeholder:text-[15px] placeholder:text-gray-400 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" placeholder="เมืองพะเยา" />
          </div>

          <div>
            <label className="text-[15px] font-medium text-gray-700 mb-1.5 block">จังหวัด <span className="text-red-500">*</span></label>
            <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full px-4 py-2.5 text-[15px] rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition bg-white">
              <option value="">เลือกจังหวัด</option>
              {PROVINCES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-[15px] font-medium text-gray-700 mb-1.5 block">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
            <input type="text" value={zipcode} onChange={(e) => setZipcode(e.target.value)} className="w-full px-4 py-2.5 text-[15px] placeholder:text-[15px] placeholder:text-gray-400 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition" placeholder="56000" />
          </div>

          <div className="md:col-span-2">
            <label className="text-[15px] font-medium text-gray-700 mb-1.5 block">ลิงก์ Google Maps <span className="text-gray-400 font-normal text-xs ml-1">(ไม่บังคับ)</span></label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={googleMapLink} onChange={(e) => setGoogleMapLink(e.target.value)} placeholder="https://maps.google.com/..." className="flex-1 px-4 py-2.5 text-[15px] placeholder:text-[15px] placeholder:text-gray-400 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition min-w-0" />
              {googleMapLink ? (
                <a 
                  href={googleMapLink.startsWith('http') ? googleMapLink : `https://${googleMapLink}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 rounded-xl text-blue-600 font-bold hover:bg-blue-50 transition shadow-sm text-sm whitespace-nowrap"
                >
                  ดูตำแหน่งบน Google Maps <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button 
                  type="button" 
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-100 rounded-xl text-gray-400 font-bold bg-gray-50 transition shadow-sm cursor-not-allowed text-sm whitespace-nowrap"
                >
                  ดูตำแหน่งบน Google Maps <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">วางลิงก์ Google Maps ของร้านค้า</p>
          </div>
        </div>
      </div>

      {/* 4. เวลาทำการ */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
          <h2 className="text-xl font-bold text-gray-900">4. เวลาทำการ <span className="text-red-500 ml-1">*</span></h2>
          <button
            type="button"
            onClick={applyMondayHoursToAll}
            className="text-xs px-3 py-1.5 bg-orange-50 text-orange-600 font-bold rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
          >
            ใช้เวลาเดียวกันทุกวัน
          </button>
        </div>
        
        <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-bold text-gray-700 mb-6 px-2">
          <div className="col-span-2">วัน</div>
          <div className="col-span-2">สถานะ</div>
          <div className="col-span-3 text-center">เวลาเปิด</div>
          <div className="col-span-3 text-center">เวลาปิด</div>
          <div className="col-span-2 text-center">ชั่วโมงทำการ</div>
        </div>
        
        <div className="space-y-1">
          {openingHours.map(hour => {
            const dayLabel = DAYS.find(d => d.id === hour.day)?.label || hour.day;
            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center py-4 md:py-3 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 rounded-xl transition-colors" key={hour.day}>
                
                <div className="md:col-span-2 font-bold text-gray-800">{dayLabel}</div>
                
                <div className="md:col-span-2 flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hour.isOpen} 
                      onChange={(e) => updateHour(hour.day, "isOpen", e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className={"w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all " + (hour.isOpen ? "bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white" : "bg-red-400")}></div>
                  </label>
                  <span className={"text-sm font-bold " + (hour.isOpen ? "text-green-600" : "text-gray-500")}>
                    {hour.isOpen ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
                
                <div className="md:col-span-3">
                  <div className="relative">
                    <input 
                      type="time" 
                      lang="th-TH"
                      disabled={!hour.isOpen} 
                      value={hour.openTime} 
                      onChange={(e) => updateHour(hour.day, "openTime", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition" 
                    />
                  </div>
                </div>
                
                <div className="md:col-span-3">
                  <div className="relative">
                    <input 
                      type="time" 
                      lang="th-TH"
                      disabled={!hour.isOpen} 
                      value={hour.closeTime} 
                      onChange={(e) => updateHour(hour.day, "closeTime", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition" 
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2 md:text-center text-sm font-medium mt-2 md:mt-0">
                  {hour.isOpen ? (
                    <span className="text-gray-600">{hour.openTime} - {hour.closeTime}</span>
                  ) : (
                    <span className="text-red-500 font-bold">ปิดทำการ</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. ปิดร้านชั่วคราว */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">5. ปิดร้านชั่วคราว</h2>
        
        <div className="grid md:grid-cols-4 gap-5 mb-6">
          <div className="col-span-1 space-y-1.5">
            <label className="text-[15px] font-medium text-gray-700">วันที่เริ่มปิด</label>
            <input 
              type="date"
              value={tempCloseStart}
              onChange={(e) => setTempCloseStart(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
            />
          </div>
          <div className="col-span-1 space-y-1.5">
            <label className="text-[15px] font-medium text-gray-700">วันที่เปิดปกติ</label>
            <input 
              type="date"
              value={tempCloseEnd}
              onChange={(e) => setTempCloseEnd(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[15px] font-medium text-gray-700">เหตุผลที่ปิด (ลูกค้าจะมองเห็น)</label>
            <input 
              type="text"
              value={tempCloseReason}
              onChange={(e) => setTempCloseReason(e.target.value)}
              placeholder="เช่น ร้านหยุดเทศกาลสงกรานต์"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
            />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-xl flex items-center gap-4 mt-6 border border-orange-200">
          <div className="w-7 h-7 rounded-full bg-orange-400 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-[16px] font-bold">i</span>
          </div>
          <div className="text-[13px] text-orange-800 font-medium space-y-1.5">
            <p>หากต้องการปิดร้านชั่วคราว ลูกค้าจะไม่สามารถสั่งงานได้</p>
            <p>หลังจากปิดร้านชั่วคราว สถานะร้านจะเปลี่ยนเป็น &quot;เปิดให้บริการ&quot; โดยอัตโนมัติ</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          type="submit" 
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังบันทึก...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>บันทึกข้อมูลร้านค้า</span>
            </>
          )}
        </button>
      </div>

      {/* Status Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5 sm:p-8 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-7">
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 relative">
                  <Store className="w-5 h-5 text-orange-500" />
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-white text-[7px] font-bold px-1 py-px rounded border border-white whitespace-nowrap ${statusModal.type === "open" || statusModal.type === "cancel-temp-close" ? "bg-green-500" : "bg-red-500"}`}>
                    {statusModal.type === "open" || statusModal.type === "cancel-temp-close" ? "OPEN" : "CLOSE"}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight">
                    {statusModal.type === "cancel-temp-close" ? "เปิดร้านและยกเลิกการปิดชั่วคราว" : statusModal.type === "open" ? "เปิดร้านนอกเวลาทำการ" : "ปิดร้านในเวลาทำการ"}
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {statusModal.type === "cancel-temp-close" ? "ยกเลิกการตั้งค่าปิดร้านชั่วคราวและเปิดให้บริการทันที" : statusModal.type === "open" ? "ตั้งค่าการเปิดร้านชั่วคราวนอกเวลาทำการปกติ" : "ตั้งค่าการปิดร้านชั่วคราวระหว่างเวลาทำการปกติ"}
                  </p>
                </div>
              </div>

              {/* Time info */}
              <div className="bg-slate-50 px-4 py-4 rounded-xl border border-slate-100 mb-6 flex flex-col gap-2">
                {statusModal.type === "cancel-temp-close" ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-700 text-sm font-bold">ช่วงเวลาที่ตั้งปิดร้านชั่วคราว</span>
                      <span className="font-bold text-orange-600 text-sm">{statusModal.tempCloseDateRange}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><Clock size={12} className="text-blue-400"/>เวลาทำการปกติ:</span>
                      <span className="font-bold text-slate-900">{statusModal.currentSchedule}</span>
                    </div>
                    {statusModal.type === "open" && (
                      <>
                        <div className="h-px bg-slate-200 w-full" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1.5"><Clock size={12} className="text-slate-400"/>เวลาปัจจุบัน:</span>
                          <span className="font-bold text-slate-900">{statusModal.currentTime}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Warning banner */}
              <div className="bg-orange-50/80 px-4 py-3.5 rounded-xl mb-6 border border-orange-100 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#f95a14] text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-base font-bold shadow-sm shadow-orange-200">!</div>
                <div>
                  <p className="font-bold text-[#f95a14] text-[15px] mb-1">
                    {statusModal.type === "cancel-temp-close" ? "ร้านจะหยุดให้บริการตามที่ตั้งไว้" : statusModal.type === "open" ? "ขณะนี้อยู่นอกเวลาทำการที่ร้านกำหนดไว้" : "ขณะนี้อยู่ในเวลาทำการของร้าน"}
                  </p>
                  <p className="text-[13px] leading-relaxed text-orange-600/80">
                    {statusModal.type === "cancel-temp-close" ? (
                      <>
                        หากคุณเปิดร้านตอนนี้ การตั้งค่าปิดร้านชั่วคราวจะถูกยกเลิก<br/>และร้านจะเปิดให้บริการทันที
                      </>
                    ) : statusModal.type === "open" ? "ต้องการเปิดร้านเพื่อให้ลูกค้าสามารถสั่งซื้อได้หรือไม่?" : "การปิดร้านจะทำให้ลูกค้าไม่สามารถสั่งซื้อกับร้านได้ชั่วคราว"}
                  </p>
                </div>
              </div>

              {/* Reason input (Not needed for cancel-temp-close) */}
              {statusModal.type !== "cancel-temp-close" && (
                <div className="mb-4">
                  <label className="text-sm font-bold text-slate-800 mb-2 block">
                    {statusModal.type === "open" ? "เหตุผลในการเปิดร้านนอกเวลาทำการ" : "เหตุผลในการปิดร้าน"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={statusModal.reason}
                      onChange={(e) => setStatusModal(prev => ({ ...prev, reason: e.target.value.substring(0, 200) }))}
                      placeholder={statusModal.type === "open" ? "เช่น เปิดรับงานเร่งด่วน / มีพนักงานพร้อมให้บริการ" : "เช่น เครื่องพิมพ์ขัดข้อง / มีงานจำนวนมาก"}
                      className="w-full px-3 py-3 text-sm placeholder:text-slate-400/80 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition resize-none h-[80px] bg-white shadow-sm"
                    />
                    <div className="absolute bottom-2 right-3 text-xs text-slate-400">{statusModal.reason.length}/200</div>
                  </div>
                </div>
              )}

              {/* Note (Not needed for cancel-temp-close) */}
              {statusModal.type !== "cancel-temp-close" && (
                <div className="bg-blue-50/70 px-4 py-3 rounded-xl border border-blue-100 text-xs text-blue-700 mb-6">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center text-[9px] font-black">i</span>
                    หมายเหตุ
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-blue-700/80 leading-relaxed">
                    <li>สถานะนี้เป็นการเปลี่ยนแปลงชั่วคราว เมื่อถึงเวลาตามตาราง ร้านจะกลับสู่สถานะปกติโดยอัตโนมัติ</li>
                    <li>หากต้องการปิดร้านล่วงหน้า ให้ใช้เมนู &ldquo;ปิดร้านชั่วคราว&rdquo;</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2 flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                className="px-6 py-2.5 rounded-full font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition text-sm min-w-[100px] shadow-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={statusModal.type !== "cancel-temp-close" && !statusModal.reason.trim()}
                onClick={handleConfirmStatusModal}
                className="px-8 py-2.5 rounded-full font-bold text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm min-w-[120px] shadow-sm"
              >
                {statusModal.type === "cancel-temp-close" ? "เปิดร้านและยกเลิกการปิด" : statusModal.type === "open" ? "ยืนยันเปิดร้าน" : "ยืนยันปิดร้าน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
