"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  AlertTriangle,
  Loader2,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  FileText,
  CheckCircle,
} from "lucide-react";
import { getShop, type PublicShopDetail } from "@/lib/api/shops";
import { isShopOpenNow } from "@/lib/shopHours";
import { getMainServices, getAddOnServices } from "@/lib/api/services";
import { addCartItem } from "@/lib/api/cart";
import { uploadFile } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";
import type { MainService, AddOnService, AllowedFileType, PriceScope } from "@/components/shop/services/types";

// suffix แสดงขอบเขตราคา AddOn — ลูกค้าเห็นว่า +฿30 คิดยังไง (ต่อหน้า / ต่อชิ้น ลอนๆ)
const ADDON_SCOPE_SUFFIX: Record<PriceScope, string> = {
  per_item: "", // ต่อชิ้นงาน — ไม่ต้อง suffix เพราะชัดเจนอยู่แล้ว
  per_page: "/หน้า",
  per_piece: "/ชิ้น",
  per_sqm: "/ตร.ม.",
};

// ── PDF helpers (โหลด pdfjs-dist แบบ dynamic import เท่านั้น — ห้าม import ตรงๆ เพราะใช้ DOM/Worker ตอน SSR จะพัง) ──
async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  // ใช้ไฟล์ worker ที่ก็อปไว้ใน public/ ตรงๆ (ไม่ให้ Next.js bundle/minify เอง)
  // เพราะ pdfjs-dist ใช้ import.meta ในตัว worker ซึ่ง Next.js build (Terser) แปลงไม่ได้ถ้าถูกดึงเข้า bundle
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjsLib;
}

const PT_TO_MM = 25.4 / 72;
const KNOWN_PAPER_SIZES: { label: string; wMm: number; hMm: number }[] = [
  { label: "A3", wMm: 297, hMm: 420 },
  { label: "A4", wMm: 210, hMm: 297 },
  { label: "A5", wMm: 148, hMm: 210 },
  { label: "Letter", wMm: 215.9, hMm: 279.4 },
];

function detectPaperSizeLabel(wMm: number, hMm: number) {
  const tolerance = 3;
  for (const size of KNOWN_PAPER_SIZES) {
    const portraitMatch = Math.abs(wMm - size.wMm) < tolerance && Math.abs(hMm - size.hMm) < tolerance;
    const landscapeMatch = Math.abs(wMm - size.hMm) < tolerance && Math.abs(hMm - size.wMm) < tolerance;
    if (portraitMatch || landscapeMatch) {
      return `${size.label} (${Math.round(wMm)} x ${Math.round(hMm)} มม.)`;
    }
  }
  return `กำหนดเอง (${Math.round(wMm)} x ${Math.round(hMm)} มม.)`;
}

async function renderPdfPageToDataUrl(pdfDoc: import("pdfjs-dist").PDFDocumentProxy, pageNum: number, scale: number) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas not supported");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return { dataUrl: canvas.toDataURL("image/png"), pixelWidth: canvas.width, pixelHeight: canvas.height };
}

function loadImagePixelSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("โหลดรูปภาพไม่สำเร็จ"));
    img.src = dataUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

const FILE_TYPE_MIME: Record<AllowedFileType, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  png: "image/png",
  ai: ".ai",
  psd: ".psd",
};

export default function ServiceOrderPage({ params }: { params: { shopId: string; serviceId: string } }) {
  const router = useRouter();
  const shopId = params.shopId;
  const [shop, setShop] = useState<PublicShopDetail | null>(null);
  const [mainService, setMainService] = useState<MainService | null>(null);
  const [addOnServices, setAddOnServices] = useState<AddOnService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([getShop(params.shopId), getMainServices(params.shopId), getAddOnServices(params.shopId)])
      .then(([shopRes, servicesRes, addOnsRes]) => {
        setShop(shopRes.shop);
        const service = servicesRes.services.find((s) => s.id === params.serviceId) ?? null;
        setMainService(service);
        setAddOnServices(addOnsRes.addOns);
        if (!service) setLoadError("ไม่พบบริการนี้ หรือร้านค้าปิดให้บริการนี้ไปแล้ว");
      })
      .catch((err) => {
        setLoadError(err instanceof ApiError && err.status === 404 ? "ไม่พบร้านค้านี้" : "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      })
      .finally(() => setLoading(false));
  }, [params.shopId, params.serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (loadError || !shop || !mainService) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-2 text-center px-4">
        <p className="text-sm text-red-500 font-semibold">{loadError || "ไม่พบข้อมูล"}</p>
        <Link href={`/shops/${params.shopId}`} className="text-orange-500 text-sm font-bold hover:underline">
          กลับหน้าร้านค้า
        </Link>
      </div>
    );
  }

  return (
    <OrderBuilderForm
      shopId={params.shopId}
      shop={shop}
      mainService={mainService}
      allAddOnServices={addOnServices}
    />
  );
}

function OrderBuilderForm({
  shopId,
  shop,
  mainService,
  allAddOnServices,
}: {
  shopId: string;
  shop: PublicShopDetail;
  mainService: MainService;
  allAddOnServices: AddOnService[];
}) {
  const router = useRouter();
  const pricingModel = mainService.pricingModel;
  // ร้านปิดอยู่ตอนนี้ (นอกเวลาทำการ) — ลูกค้ายังดูรายละเอียด/ราคาได้ตามปกติ แค่สั่งพิมพ์/เพิ่มลงตะกร้าไม่ได้
  const shopClosed = !isShopOpenNow(shop.openingHours);

  // ── ตัวเลือกของบริการ (dynamic options) ──
  // dropdown/radio/checkbox เก็บเป็น valueId, number/text เก็บเป็นข้อความดิบ — คีย์ตาม option.id ทั้งหมด
  const [optionState, setOptionState] = useState<Record<string, string>>({});

  // ── per_sqm ──
  const [widthCm, setWidthCm] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");

  // ── per_page ──
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfPaperSizeLabel, setPdfPaperSizeLabel] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const pdfDocRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);

  // ── per_sqm: พรีวิว + สัดส่วน/DPI check ──
  const [areaPreviewUrl, setAreaPreviewUrl] = useState<string | null>(null);
  const [areaPixelSize, setAreaPixelSize] = useState<{ width: number; height: number } | null>(null);
  const [areaAnalyzing, setAreaAnalyzing] = useState(false);
  const [areaAnalyzeError, setAreaAnalyzeError] = useState("");

  // ── common ──
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number | "">(1);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reviewOpen, setReviewOpen] = useState(false);

  const setOption = (optionId: string, value: string) => {
    setOptionState((prev) => ({ ...prev, [optionId]: value }));
  };
  const clearOption = (optionId: string) => {
    setOptionState((prev) => {
      const next = { ...prev };
      delete next[optionId];
      return next;
    });
  };

  const acceptAttr =
    pricingModel === "per_page"
      ? "application/pdf"
      : mainService.allowedFileTypes.map((t) => FILE_TYPE_MIME[t]).join(",") || undefined;

  // โหลดพรีวิว PDF (pricingModel = per_page) ทุกครั้งที่เปลี่ยนไฟล์
  useEffect(() => {
    if (pricingModel !== "per_page" || !file) {
      pdfDocRef.current = null;
      setPdfPreviewUrl(null);
      setPdfPageCount(0);
      setPdfPaperSizeLabel("");
      return;
    }
    let cancelled = false;
    setPdfLoading(true);
    setPdfError("");
    (async () => {
      try {
        const pdfjsLib = await loadPdfjs();
        const bytes = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
        if (cancelled) return;
        pdfDocRef.current = pdfDoc;
        setPdfPageCount(pdfDoc.numPages);
        setPdfCurrentPage(1);
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        setPdfPaperSizeLabel(detectPaperSizeLabel(viewport.width * PT_TO_MM, viewport.height * PT_TO_MM));
        const { dataUrl } = await renderPdfPageToDataUrl(pdfDoc, 1, 1.2);
        if (!cancelled) setPdfPreviewUrl(dataUrl);
      } catch {
        if (!cancelled) setPdfError("ไม่สามารถอ่านไฟล์ PDF ได้ กรุณาตรวจสอบว่าไฟล์ไม่เสียหายและเป็นไฟล์ PDF จริง");
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, pricingModel]);

  const goToPdfPage = async (pageNum: number) => {
    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc || pageNum < 1 || pageNum > pdfPageCount) return;
    setPdfCurrentPage(pageNum);
    setPdfLoading(true);
    try {
      const { dataUrl } = await renderPdfPageToDataUrl(pdfDoc, pageNum, 1.2);
      setPdfPreviewUrl(dataUrl);
    } catch {
      setPdfError("แสดงหน้านี้ไม่สำเร็จ");
    } finally {
      setPdfLoading(false);
    }
  };

  // โหลดพรีวิว + วิเคราะห์ขนาด/DPI (pricingModel = per_sqm) ทุกครั้งที่เปลี่ยนไฟล์
  useEffect(() => {
    if (pricingModel !== "per_sqm" || !file) {
      setAreaPreviewUrl(null);
      setAreaPixelSize(null);
      return;
    }
    let cancelled = false;
    setAreaAnalyzing(true);
    setAreaAnalyzeError("");
    (async () => {
      try {
        if (file.type === "application/pdf") {
          const pdfjsLib = await loadPdfjs();
          const bytes = await file.arrayBuffer();
          const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
          const { dataUrl, pixelWidth, pixelHeight } = await renderPdfPageToDataUrl(pdfDoc, 1, 2);
          if (cancelled) return;
          setAreaPreviewUrl(dataUrl);
          setAreaPixelSize({ width: pixelWidth, height: pixelHeight });
        } else {
          const dataUrl = await fileToDataUrl(file);
          const size = await loadImagePixelSize(dataUrl);
          if (cancelled) return;
          setAreaPreviewUrl(dataUrl);
          setAreaPixelSize(size);
        }
      } catch {
        if (!cancelled) setAreaAnalyzeError("ไม่สามารถวิเคราะห์ไฟล์นี้ได้ แต่ยังอัปโหลดเพื่อสั่งพิมพ์ได้ตามปกติ");
      } finally {
        if (!cancelled) setAreaAnalyzing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, pricingModel]);

  // สัดส่วนไฟล์ vs กรอบที่ลูกค้ากรอก + DPI
  const areaMismatch = useMemo(() => {
    if (!areaPixelSize || widthCm === "" || heightCm === "" || Number(widthCm) <= 0 || Number(heightCm) <= 0) return null;
    const fileAspect = areaPixelSize.width / areaPixelSize.height;
    const targetAspect = Number(widthCm) / Number(heightCm);
    const mismatchPct = Math.abs(fileAspect - targetAspect) / targetAspect;
    const dpiW = areaPixelSize.width / (Number(widthCm) / 2.54);
    const dpiH = areaPixelSize.height / (Number(heightCm) / 2.54);
    const dpi = Math.min(dpiW, dpiH);
    const recommendedMaxWidthCm = Math.floor((areaPixelSize.width * 2.54) / 150);
    const recommendedMaxHeightCm = Math.floor((areaPixelSize.height * 2.54) / 150);
    return {
      isAspectMismatched: mismatchPct > 0.02,
      dpi,
      isLowRes: dpi < 150,
      recommendedMaxWidthCm,
      recommendedMaxHeightCm,
    };
  }, [areaPixelSize, widthCm, heightCm]);

  const handleAutoFitSize = () => {
    if (!areaPixelSize || widthCm === "" || Number(widthCm) <= 0) return;
    const newHeight = Number(widthCm) / (areaPixelSize.width / areaPixelSize.height);
    setHeightCm(Math.round(newHeight * 100) / 100);
  };

  // ราคาโดยประมาณแบบเรียลไทม์ (คำนวณฝั่ง client เพื่อ UX เท่านั้น — ราคาจริงคำนวณซ้ำที่ server เสมอ)
  const previewTotal = useMemo(() => {
    const optionsExtraTotal = mainService.options.reduce((sum, opt) => {
      const needsValues = opt.type === "dropdown" || opt.type === "radio" || opt.type === "checkbox";
      if (!needsValues) return sum;
      const selectedId = optionState[opt.id ?? ""];
      if (!selectedId) return sum;
      const value = opt.values.find((v) => v.id === selectedId);
      return sum + (value?.extraPrice ?? 0);
    }, 0);
    const unitBase = mainService.basePrice + optionsExtraTotal;

    let unitMultiplier = 1;
    if (pricingModel === "per_page") {
      unitMultiplier = pdfPageCount;
    } else if (pricingModel === "per_sqm") {
      unitMultiplier = widthCm !== "" && heightCm !== "" ? (Number(widthCm) / 100) * (Number(heightCm) / 100) : 0;
    }

    const addOnsTotal = selectedAddOnIds.reduce((sum, id) => {
      const binding = mainService.availableAddOns.find((a) => a.addOnId === id);
      return sum + (binding?.extraPrice ?? 0);
    }, 0);
    const qty = quantity === "" ? 0 : quantity;
    return (unitBase * unitMultiplier + addOnsTotal) * qty;
  }, [mainService, optionState, pricingModel, pdfPageCount, widthCm, heightCm, selectedAddOnIds, quantity]);

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOnIds((prev) => (prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]));
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    for (const opt of mainService.options) {
      if (!opt.id) continue;
      const val = optionState[opt.id];
      if (opt.type === "dropdown" || opt.type === "radio") {
        if (!val) errs[`option-${opt.id}`] = `กรุณาเลือก "${opt.name}"`;
      } else if (opt.type === "number") {
        if (!val || Number.isNaN(Number(val))) errs[`option-${opt.id}`] = `กรุณากรอกตัวเลขที่ถูกต้องใน "${opt.name}"`;
      }
    }

    if (pricingModel === "per_sqm") {
      if (widthCm === "" || heightCm === "" || Number(widthCm) <= 0 || Number(heightCm) <= 0) {
        errs.dimensions = "กรุณากรอกกว้างและสูงให้ถูกต้อง";
      }
    }
    if (quantity === "" || Number(quantity) < 1) errs.quantity = "กรุณากรอกจำนวนอย่างน้อย 1";
    if (pricingModel === "per_page" && file && pdfError) errs.file = pdfError;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNeedsLogin(false);
    if (shopClosed) {
      setErrors({ submit: "ร้านนี้ปิดทำการอยู่ขณะนี้ ไม่สามารถสั่งพิมพ์ได้ กรุณากลับมาใหม่ตอนร้านเปิด" });
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let fileUrl: string | undefined;
      if (file) {
        setIsUploading(true);
        const { path } = await uploadFile(file, "order-file");
        fileUrl = path;
        setIsUploading(false);
      }

      const optionSelections: { optionId: string; valueId?: string; textValue?: string }[] = [];
      for (const opt of mainService.options) {
        if (!opt.id) continue;
        const val = optionState[opt.id];
        if (!val) continue;
        if (opt.type === "dropdown" || opt.type === "radio" || opt.type === "checkbox") {
          optionSelections.push({ optionId: opt.id, valueId: val });
        } else {
          optionSelections.push({ optionId: opt.id, textValue: val });
        }
      }

      const { cart } = await addCartItem(shopId, {
        mainServiceId: mainService.id,
        optionSelections,
        widthCm: pricingModel === "per_sqm" ? Number(widthCm) : undefined,
        heightCm: pricingModel === "per_sqm" ? Number(heightCm) : undefined,
        addOnIds: selectedAddOnIds,
        quantity: Number(quantity),
        fileUrl,
        note: note.trim() || undefined,
      });
      setAddedToast(true);
      setTimeout(() => {
        setAddedToast(false);
        router.push("/cart");
      }, 1000);
      void cart;
    } catch (err) {
      setIsUploading(false);
      if (err instanceof ApiError && err.status === 401) {
        setNeedsLogin(true);
      } else {
        setErrors({ submit: err instanceof ApiError ? err.message : "เพิ่มลงตะกร้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (needsLogin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
          <LogIn size={24} />
        </div>
        <p className="text-base font-bold text-slate-800">ต้องเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า</p>
        <p className="text-sm text-slate-500">เข้าสู่ระบบแล้วกลับมาที่หน้านี้เพื่อสั่งพิมพ์ต่อได้เลย</p>
        <div className="flex gap-3 pt-2">
          <button onClick={() => setNeedsLogin(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">
            ยกเลิก
          </button>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/shops/${shopId}/order/${mainService.id}`)}`}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-28 lg:pb-10">
      {addedToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm rounded-xl shadow-xl border border-slate-700">
          <CheckCircle size={18} className="text-emerald-400" />
          <span>เพิ่ม &quot;{mainService.name}&quot; ลงตะกร้าแล้ว</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 px-4 sm:px-6 lg:px-16 py-3 flex items-center justify-between gap-3">
        <Link href={`/shops/${shopId}`} className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline font-bold text-sm">กลับหน้าร้าน</span>
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="font-bold text-sm sm:text-base text-slate-800 truncate">{shop.name}</p>
        </div>
        <button
          onClick={() => setReviewOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold hover:bg-amber-100 transition shrink-0"
        >
          <Star size={13} className="fill-amber-500 text-amber-500" />
          รีวิว
        </button>
      </header>

      <form id="order-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-6 py-5 lg:py-8">
        <h1 className="text-lg sm:text-xl font-black text-slate-800 mb-1">{mainService.name}</h1>
        {mainService.description && <p className="text-sm text-slate-500 mb-3">{mainService.description}</p>}

        {shopClosed && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
            <AlertTriangle size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm">
              ร้านนี้ปิดทำการอยู่ขณะนี้ — ดูรายละเอียดและราคาได้ตามปกติ แต่ยังสั่งพิมพ์ไม่ได้จนกว่าร้านจะเปิด
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* ── ฟอร์มหลัก ── */}
          <div className="space-y-5 order-2 lg:order-1">
            {/* ตัวเลือกของบริการ (dynamic options) */}
            {mainService.options.map((opt) => {
              if (!opt.id) return null;
              const err = errors[`option-${opt.id}`];
              return (
                <FieldCard key={opt.id} label={opt.name} required={opt.type === "dropdown" || opt.type === "radio" || opt.type === "number"}>
                  {(opt.type === "dropdown" || opt.type === "radio") && (
                    <div className="flex flex-wrap gap-1.5">
                      {opt.values.map((v) => (
                        <ChipButton key={v.id} active={optionState[opt.id as string] === v.id} onClick={() => setOption(opt.id as string, v.id as string)}>
                          {v.name}
                          {v.extraPrice > 0 ? ` · +฿${v.extraPrice}` : ""}
                        </ChipButton>
                      ))}
                    </div>
                  )}
                  {opt.type === "checkbox" && opt.values[0] && (
                    <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!optionState[opt.id]}
                        onChange={(e) => (e.target.checked ? setOption(opt.id as string, opt.values[0].id as string) : clearOption(opt.id as string))}
                        className="rounded text-orange-500 focus:ring-orange-500"
                      />
                      <span>
                        {opt.values[0].name}
                        {opt.values[0].extraPrice > 0 ? ` (+฿${opt.values[0].extraPrice})` : ""}
                      </span>
                    </label>
                  )}
                  {opt.type === "number" && (
                    <input
                      type="number"
                      value={optionState[opt.id] ?? ""}
                      onChange={(e) => setOption(opt.id as string, e.target.value)}
                      className="w-32 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                    />
                  )}
                  {opt.type === "text" && (
                    <input
                      type="text"
                      value={optionState[opt.id] ?? ""}
                      onChange={(e) => setOption(opt.id as string, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                    />
                  )}
                  {err && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> {err}
                    </p>
                  )}
                </FieldCard>
              );
            })}

            {pricingModel === "per_sqm" && (
              <FieldCard label="ขนาดที่ต้องการ (กรอกเอง)" required>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="กว้าง (ซม.)" value={widthCm} onChange={setWidthCm} />
                  <NumberField label="สูง (ซม.)" value={heightCm} onChange={setHeightCm} />
                </div>
                {errors.dimensions && <p className="text-xs text-red-500 mt-1.5">{errors.dimensions}</p>}

                {areaAnalyzing && (
                  <p className="text-xs text-slate-400 mt-2.5 flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> กำลังวิเคราะห์ไฟล์...
                  </p>
                )}
                {areaAnalyzeError && <p className="text-xs text-slate-400 mt-2.5">{areaAnalyzeError}</p>}

                {areaMismatch?.isAspectMismatched && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <p className="text-xs text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      สัดส่วนไฟล์ของคุณไม่พอดีกับขนาดที่กรอก ร้านค้าจะครอบตัด (crop) ส่วนเกินออกให้พอดีกรอบ ดูตัวอย่างในพรีวิวด้านข้าง
                    </p>
                    <button type="button" onClick={handleAutoFitSize} className="text-xs font-bold text-amber-700 underline hover:text-amber-800">
                      ปรับขนาดให้พอดีกับไฟล์อัตโนมัติ
                    </button>
                  </div>
                )}
                {areaMismatch?.isLowRes && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs text-red-600 flex items-start gap-1.5">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      ไฟล์นี้ความละเอียดต่ำสำหรับขนาด {widthCm}×{heightCm} ซม. (ประมาณ {Math.round(areaMismatch.dpi)} DPI) พิมพ์ออกมาอาจเบลอ —
                      แนะนำขนาดไม่เกิน {areaMismatch.recommendedMaxWidthCm}×{areaMismatch.recommendedMaxHeightCm} ซม. สำหรับไฟล์นี้ หรืออัปโหลดไฟล์ความละเอียดสูงกว่านี้
                    </p>
                  </div>
                )}
              </FieldCard>
            )}

            {/* อัปโหลดไฟล์ — ไม่บังคับ ลูกค้าแนบได้ถ้าต้องการ (per_page ยังต้องแนบเพื่อให้ระบบนับหน้า/คำนวณราคาได้ แต่ไม่บล็อกการเพิ่มลงตะกร้า) */}
            <FieldCard label={pricingModel === "per_page" ? "ไฟล์งานพิมพ์ (PDF)" : "ไฟล์งานพิมพ์ (ไม่บังคับ)"}>
              <label className="block border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-orange-400 transition-colors cursor-pointer bg-slate-50/50">
                <input type="file" accept={acceptAttr} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? (
                  <p className="text-sm text-slate-700 font-semibold flex items-center justify-center gap-1.5">
                    <FileText size={16} className="text-orange-500" /> {file.name}
                  </p>
                ) : (
                  <>
                    <Upload size={22} className="mx-auto text-slate-400 mb-1.5" />
                    <p className="text-sm text-slate-600 font-medium">
                      คลิกเพื่ออัปโหลด {pricingModel === "per_page" ? "(PDF เท่านั้น)" : `(${mainService.allowedFileTypes.join(", ").toUpperCase()})`}
                    </p>
                  </>
                )}
              </label>
              {errors.file && <p className="text-xs text-red-500 mt-1.5">{errors.file}</p>}

              {/* พรีวิวบนมือถือ แสดงต่อจากช่องอัปโหลดเลย (บนจอใหญ่ใช้คอลัมน์ขวาแทน) */}
              <div className="lg:hidden mt-3">
                <PreviewPanel
                  pricingModel={pricingModel}
                  file={file}
                  pdfLoading={pdfLoading}
                  pdfError={pdfError}
                  pdfPreviewUrl={pdfPreviewUrl}
                  pdfPageCount={pdfPageCount}
                  pdfCurrentPage={pdfCurrentPage}
                  pdfPaperSizeLabel={pdfPaperSizeLabel}
                  goToPdfPage={goToPdfPage}
                  areaPreviewUrl={areaPreviewUrl}
                  widthCm={widthCm}
                  heightCm={heightCm}
                />
              </div>
            </FieldCard>

            {mainService.availableAddOns.length > 0 && (
              <FieldCard label="บริการเสริม">
                <div className="space-y-1.5">
                  {mainService.availableAddOns.map((binding) => {
                    const addOn = allAddOnServices.find((a) => a.id === binding.addOnId);
                    if (!addOn) return null;
                    const checked = selectedAddOnIds.includes(binding.addOnId);
                    return (
                      <label
                        key={binding.addOnId}
                        className={`flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                          checked ? "border-orange-200 bg-orange-50/40" : "border-slate-100 bg-white"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <input type="checkbox" checked={checked} onChange={() => toggleAddOn(binding.addOnId)} className="rounded text-orange-500 focus:ring-orange-500" />
                          <span>
                            {addOn.name}
                            {addOn.description && <span className="block text-[11px] text-slate-400 leading-tight">{addOn.description}</span>}
                          </span>
                        </span>
                        <span className="font-bold text-orange-600 shrink-0 ml-2">
                          +฿{binding.extraPrice}{ADDON_SCOPE_SUFFIX[addOn.scope]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </FieldCard>
            )}

            <FieldCard label="จำนวนชุด">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-32 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
              />
              {errors.quantity && <p className="text-xs text-red-500 mt-1.5">{errors.quantity}</p>}
            </FieldCard>

            <FieldCard label="โน้ตถึงร้านค้า (ถ้ามี)">
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
              />
            </FieldCard>

            {errors.submit && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.submit}
              </p>
            )}

            {/* ปุ่ม submit บนจอใหญ่ (มือถือใช้แถบ sticky ด้านล่างแทน) */}
            <button
              type="submit"
              disabled={isSubmitting || shopClosed}
              className="hidden lg:flex w-full items-center justify-center gap-1.5 py-3.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-xl shadow-md shadow-orange-200 transition"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {shopClosed
                ? "ร้านปิดอยู่ขณะนี้"
                : isUploading
                  ? "กำลังอัปโหลดไฟล์..."
                  : isSubmitting
                    ? "กำลังเพิ่ม..."
                    : `เพิ่มลงตะกร้า · ฿${previewTotal.toLocaleString()}`}
            </button>
          </div>

          {/* ── พรีวิวคอลัมน์ขวา (จอใหญ่เท่านั้น) ── */}
          <div className="hidden lg:block order-1 lg:order-2 lg:sticky lg:top-20 space-y-4">
            <PreviewPanel
              pricingModel={pricingModel}
              file={file}
              pdfLoading={pdfLoading}
              pdfError={pdfError}
              pdfPreviewUrl={pdfPreviewUrl}
              pdfPageCount={pdfPageCount}
              pdfCurrentPage={pdfCurrentPage}
              pdfPaperSizeLabel={pdfPaperSizeLabel}
              goToPdfPage={goToPdfPage}
              areaPreviewUrl={areaPreviewUrl}
              widthCm={widthCm}
              heightCm={heightCm}
            />

            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>ราคาโดยประมาณ</span>
                <span className="font-black text-orange-600 text-lg">฿{previewTotal.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-400">ราคาจริงคำนวณอีกครั้งจากเซิร์ฟเวอร์ตอนเพิ่มลงตะกร้า</p>
            </div>
          </div>
        </div>
      </form>

      {/* แถบ sticky ล่างสุด สำหรับมือถือ */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-400">ราคาโดยประมาณ</p>
          <p className="text-lg font-black text-orange-600 truncate">฿{previewTotal.toLocaleString()}</p>
        </div>
        <button
          type="submit"
          form="order-form"
          disabled={isSubmitting || shopClosed}
          className="px-6 py-3 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-full shadow-md shadow-orange-200 transition flex items-center gap-1.5 shrink-0"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {shopClosed ? "ร้านปิดอยู่" : isUploading ? "กำลังอัปโหลด..." : isSubmitting ? "กำลังเพิ่ม..." : "เพิ่มลงตะกร้า"}
        </button>
      </div>

      {/* ป๊อปอัพรีวิว — placeholder ว่างไว้ก่อน ฟีเจอร์รีวิวยังไม่เปิดใช้งาน */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setReviewOpen(false)}>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setReviewOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
              <Star size={22} className="fill-amber-500" />
            </div>
            <p className="text-sm font-bold text-slate-800">รีวิวร้านค้า</p>
            <p className="text-xs text-slate-500">ฟีเจอร์รีวิวกำลังจะเปิดให้ใช้งานเร็วๆ นี้</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── shared UI bits ──

function FieldCard({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <label className="block text-xs font-bold text-slate-700 mb-2.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all ${
        active ? "border-orange-500 bg-orange-50 text-orange-600 font-semibold" : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number | ""; onChange: (v: number | "") => void }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 mb-1">{label}</label>
      <input
        type="number"
        min="1"
        step="0.5"
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
      />
    </div>
  );
}

function PreviewPanel({
  pricingModel,
  file,
  pdfLoading,
  pdfError,
  pdfPreviewUrl,
  pdfPageCount,
  pdfCurrentPage,
  pdfPaperSizeLabel,
  goToPdfPage,
  areaPreviewUrl,
  widthCm,
  heightCm,
}: {
  pricingModel: MainService["pricingModel"];
  file: File | null;
  pdfLoading: boolean;
  pdfError: string;
  pdfPreviewUrl: string | null;
  pdfPageCount: number;
  pdfCurrentPage: number;
  pdfPaperSizeLabel: string;
  goToPdfPage: (n: number) => void;
  areaPreviewUrl: string | null;
  widthCm: number | "";
  heightCm: number | "";
}) {
  if (!file) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-300">
        <FileText size={32} className="mx-auto mb-2" />
        <p className="text-xs">อัปโหลดไฟล์เพื่อดูตัวอย่าง</p>
      </div>
    );
  }

  if (pricingModel === "per_page") {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="aspect-[3/4] bg-slate-100 flex items-center justify-center relative">
          {pdfLoading ? (
            <Loader2 size={24} className="animate-spin text-slate-400" />
          ) : pdfError ? (
            <p className="text-xs text-red-500 p-4 text-center">{pdfError}</p>
          ) : pdfPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pdfPreviewUrl} alt="พรีวิวหน้า PDF" className="max-w-full max-h-full object-contain" />
          ) : null}
        </div>
        {pdfPageCount > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToPdfPage(pdfCurrentPage - 1)}
              disabled={pdfCurrentPage <= 1}
              className="p-1.5 rounded-lg text-slate-500 disabled:opacity-30 hover:bg-slate-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-slate-600">
              หน้า {pdfCurrentPage} / {pdfPageCount}
            </span>
            <button
              type="button"
              onClick={() => goToPdfPage(pdfCurrentPage + 1)}
              disabled={pdfCurrentPage >= pdfPageCount}
              className="p-1.5 rounded-lg text-slate-500 disabled:opacity-30 hover:bg-slate-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        <div className="px-3 py-2.5 border-t border-slate-100 space-y-1 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>จำนวนหน้า</span>
            <span className="font-bold text-slate-700">{pdfPageCount || "-"} หน้า</span>
          </div>
          {pdfPaperSizeLabel && (
            <div className="flex justify-between">
              <span>ขนาดกระดาษที่ตรวจพบ</span>
              <span className="font-bold text-slate-700">{pdfPaperSizeLabel}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (pricingModel === "per_sqm") {
    const ratio = widthCm !== "" && heightCm !== "" && Number(widthCm) > 0 && Number(heightCm) > 0 ? Number(widthCm) / Number(heightCm) : 1;
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
        <div
          className="bg-slate-100 rounded-xl overflow-hidden mx-auto relative flex items-center justify-center"
          style={{ aspectRatio: ratio, maxHeight: 340 }}
        >
          {areaPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={areaPreviewUrl} alt="พรีวิวไฟล์" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <Loader2 size={20} className="animate-spin text-slate-400" />
          )}
        </div>
        <p className="text-[11px] text-slate-400 text-center">
          พื้นที่ที่แสดงคือส่วนที่จะถูกพิมพ์จริง ({widthCm || "?"}×{heightCm || "?"} ซม.) ส่วนที่อยู่นอกกรอบจะถูกตัดออก
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
      <FileText size={28} className="mx-auto text-orange-400 mb-2" />
      <p className="text-xs text-slate-600 font-semibold truncate">{file.name}</p>
    </div>
  );
}
