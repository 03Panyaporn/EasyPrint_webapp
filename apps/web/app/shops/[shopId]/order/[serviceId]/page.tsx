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
  Check,
  Receipt,
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  MapPin,
  Clock,
  Truck,
  Store as StoreIcon,
  Printer,
  User,
  Droplet,
  Layers,
  FlipHorizontal2,
  Ruler,
  Package,
  Hash,
  StickyNote,
  Sparkles,
  Image as ImageIcon,
  RotateCw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Trash2,
  Info,
  ShieldCheck,
  Rocket,
  Headphones,
  Scissors,
  Droplets,
  Box,
  Pencil,
} from "lucide-react";
import { calculateLineItem, type ScopedAmount } from "@easyprint/shared";
import { getShop, type PublicShopDetail } from "@/lib/api/shops";
import { isShopOpenNow, formatTodayHours } from "@/lib/shopHours";
import { getMainServices, getAddOnServices } from "@/lib/api/services";
import { addCartItem, getShopCart } from "@/lib/api/cart";
import { uploadFile } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";
import type { MainService, AddOnService, AllowedFileType, PriceScope } from "@/components/shop/services/types";

// suffix แสดงขอบเขตราคา AddOn
const ADDON_SCOPE_SUFFIX: Record<PriceScope, string> = {
  per_item: "",
  per_page: "/หน้า",
  per_piece: "/ชิ้น",
  per_sqm: "/ตร.ม.",
};

// suffix แสดงหน่วยราคาของ ColorTier
const COLOR_TIER_UNIT_SUFFIX: Record<MainService["pricingModel"], string> = {
  per_page: "/หน้า",
  per_piece: "/ชิ้น",
  per_sqm: "/ตร.ม.",
  fixed: "",
};

// PDF helpers
async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
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
        <p className="text-sm font-semibold">กำลังโหลดข้อมูลสั่งพิมพ์...</p>
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
  const shopClosed = !isShopOpenNow(shop.openingHours);

  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    getShopCart(shopId)
      .then((res) => setCartCount(res.cart?.items.length ?? 0))
      .catch(() => setCartCount(0));
  }, [shopId]);

  // dynamic options state
  const [optionState, setOptionState] = useState<Record<string, string>>({});
  const [widthCm, setWidthCm] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");

  // per_page PDF preview states
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([]);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfPaperSizeLabel, setPdfPaperSizeLabel] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const pdfDocRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);

  // per_sqm states
  const [areaPreviewUrl, setAreaPreviewUrl] = useState<string | null>(null);
  const [areaPixelSize, setAreaPixelSize] = useState<{ width: number; height: number } | null>(null);
  const [areaAnalyzing, setAreaAnalyzing] = useState(false);
  const [areaAnalyzeError, setAreaAnalyzeError] = useState("");

  // ColorTier
  const [selectedColorTierId, setSelectedColorTierId] = useState<string | undefined>(undefined);

  // Common states
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number | "">(1);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");

  const [genericImagePreviewUrl, setGenericImagePreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setGenericImagePreviewUrl(null);
      return;
    }
    const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name);
    if (!isImage) {
      setGenericImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setGenericImagePreviewUrl(url);
    setPdfThumbnails([url]);
    setPdfPageCount(1);
    setPdfPaperSizeLabel("รูปภาพ");
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);

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

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  // Auto select default options on first load if available
  useEffect(() => {
    const initialOptions: Record<string, string> = {};
    for (const opt of mainService.options) {
      if (opt.id && opt.values && opt.values.length > 0 && opt.values[0].id && (opt.type === "dropdown" || opt.type === "radio")) {
        initialOptions[opt.id] = opt.values[0].id;
      }
    }
    setOptionState((prev) => ({ ...initialOptions, ...prev }));
  }, [mainService.options]);

  // Load PDF preview & thumbnails for ALL services if file is PDF
  useEffect(() => {
    if (!file) {
      pdfDocRef.current = null;
      setPdfPreviewUrl(null);
      setPdfThumbnails([]);
      setPdfPageCount(0);
      setPdfPaperSizeLabel("");
      return;
    }

    const isPdf = file.type === "application/pdf" || file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      pdfDocRef.current = null;
      setPdfPreviewUrl(null);
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

        // Generate page thumbnails (up to 10 pages)
        const thumbs: string[] = [];
        const maxThumbs = Math.min(pdfDoc.numPages, 10);
        for (let i = 1; i <= maxThumbs; i++) {
          const { dataUrl: thumbUrl } = await renderPdfPageToDataUrl(pdfDoc, i, 0.35);
          thumbs.push(thumbUrl);
        }
        if (!cancelled) setPdfThumbnails(thumbs);
      } catch (err) {
        console.error(err);
        if (!cancelled) setPdfError("ไม่สามารถอ่านไฟล์ PDF ได้ กรุณาตรวจสอบว่าไฟล์ไม่เสียหายและเป็นไฟล์ PDF จริง");
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

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

  const selectedColorTier = useMemo(() => {
    if (!selectedColorTierId) return undefined;
    return mainService.colorTiers.find((t) => t.id === selectedColorTierId);
  }, [selectedColorTierId, mainService.colorTiers]);

  const optionDeltas = useMemo(() => {
    const deltas: ScopedAmount[] = [];
    for (const opt of mainService.options) {
      if (!opt.id) continue;
      const selectedValueId = optionState[opt.id];
      if (!selectedValueId) continue;
      const valueObj = opt.values.find((v) => v.id === selectedValueId);
      if (valueObj && valueObj.extraPrice > 0) {
        deltas.push({ amount: valueObj.extraPrice, scope: valueObj.priceScope });
      }
    }
    return deltas;
  }, [mainService.options, optionState]);

  const addOnCharges = useMemo(() => {
    const charges: ScopedAmount[] = [];
    for (const addOnId of selectedAddOnIds) {
      const binding = mainService.availableAddOns.find((b) => b.addOnId === addOnId);
      const addOn = allAddOnServices.find((a) => a.id === addOnId);
      if (binding && addOn) {
        charges.push({ amount: binding.extraPrice, scope: addOn.scope });
      }
    }
    return charges;
  }, [selectedAddOnIds, mainService.availableAddOns, allAddOnServices]);

  const lineItemResult = useMemo(() => {
    return calculateLineItem({
      pricingModel,
      basePrice: selectedColorTier ? selectedColorTier.pricePerUnit : mainService.basePrice,
      quantity: quantity === "" ? 0 : Number(quantity),
      rawPageCount: pdfPageCount,
      widthCm: widthCm === "" ? 0 : Number(widthCm),
      heightCm: heightCm === "" ? 0 : Number(heightCm),
      minArea: mainService.minArea,
      areaRoundingIncrement: mainService.areaRoundingIncrement,
      quantityTiers: mainService.quantityTiers.map((t) => ({ minQty: t.minQty, maxQty: t.maxQty ?? null, unitPrice: t.unitPrice })),
      optionDeltas,
      addOnCharges,
    });
  }, [pricingModel, mainService, selectedColorTier, quantity, pdfPageCount, widthCm, heightCm, optionDeltas, addOnCharges]);

  const previewTotal = lineItemResult.lineTotal;

  // Selected options summary list for breakdown card
  const selectedOptionsDetailedList = useMemo(() => {
    const list: { label: string; value: string; extraPrice: number }[] = [];
    
    // Color tier
    if (mainService.colorTiers.length > 0) {
      const label = selectedColorTier ? selectedColorTier.label : "ขาวดำ";
      const price = selectedColorTier ? selectedColorTier.pricePerUnit : mainService.basePrice;
      list.push({ label: "สี", value: `${label} (฿${price})`, extraPrice: 0 });
    }

    // Dynamic options
    for (const opt of mainService.options) {
      if (!opt.id) continue;
      const selectedId = optionState[opt.id];
      if (!selectedId) continue;
      const value = opt.values.find((v) => v.id === selectedId);
      if (value) {
        list.push({
          label: opt.name,
          value: `${value.name}${value.extraPrice > 0 ? ` (+฿${value.extraPrice})` : ""}`,
          extraPrice: value.extraPrice,
        });
      }
    }

    // per_sqm size
    if (pricingModel === "per_sqm" && widthCm !== "" && heightCm !== "") {
      list.unshift({ label: "ขนาด", value: `${widthCm} × ${heightCm} ซม.`, extraPrice: 0 });
    }

    return list;
  }, [mainService.colorTiers, selectedColorTier, mainService.basePrice, mainService.options, optionState, pricingModel, widthCm, heightCm]);

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
        colorTierId: selectedColorTierId,
        optionSelections,
        widthCm: pricingModel === "per_sqm" ? Number(widthCm) : undefined,
        heightCm: pricingModel === "per_sqm" ? Number(heightCm) : undefined,
        addOnIds: selectedAddOnIds,
        quantity: Number(quantity),
        fileUrl,
        fileName: file?.name,
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-sky-50/30 to-rose-50/40 font-sans pb-28 lg:pb-12">
      {addedToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm rounded-2xl shadow-xl border border-slate-700">
          <CheckCircle size={18} className="text-emerald-400" />
          <span>เพิ่ม &quot;{mainService.name}&quot; ลงตะกร้าเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Top Bar Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-sky-100 sticky top-0 z-30 px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between gap-3 shadow-2xs">
        <Link href={`/shops/${shopId}`} className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline font-bold text-sm">กลับไปหน้าร้านค้า</span>
        </Link>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition">
            <Printer className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-orange-500 tracking-tight">EASY<span className="text-orange-500">PRINT</span></span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition"
            title="ตะกร้า"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold inline-flex items-center justify-center shrink-0 aspect-square leading-none pointer-events-none">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition"
            title="บัญชีของฉัน"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* ── 1. การ์ดข้อมูลร้าน (Full Width Vibrant Shop Banner Bar) ── */}
      <div className="w-full bg-white border-b-2 border-sky-200/80 px-4 sm:px-6 lg:px-12 py-3.5 shadow-xs relative overflow-hidden">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute right-10 -top-6 w-32 h-32 bg-rose-200/30 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-100 via-orange-100 to-amber-100 border border-orange-200 shrink-0 overflow-hidden relative flex items-center justify-center text-orange-600 font-extrabold text-xl shadow-2xs">
              {shop.shopPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.shopPhotoUrl} alt={shop.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span>{shop.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-slate-900 text-base sm:text-lg truncate">{shop.name}</h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                    shopClosed ? "bg-slate-400 text-white" : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {shopClosed ? "ปิดทำการ" : "เปิดให้บริการ"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="truncate">{shop.address ?? "19 หมู่ 2 ต.แม่กา อ.เมืองพะเยา จ.พะเยา 56000"}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{formatTodayHours(shop.openingHours)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/shops/${shopId}`}
              className="px-4 py-2 text-xs font-bold text-orange-600 border-2 border-orange-400 hover:bg-orange-50 rounded-xl transition whitespace-nowrap shadow-2xs flex items-center gap-1.5 bg-white"
            >
              <StoreIcon size={14} />
              <span>ดูรายละเอียดร้าน</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 lg:py-6 space-y-5">

        {/* ── 2. บริการปัจจุบัน Header Card (Compact Sleek Design) ── */}
        <div className="bg-white rounded-xl border border-sky-200/80 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight truncate">{mainService.name}</h1>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {mainService.description || "สติ๊กเกอร์คุณภาพสูง ตัดตามรูปทรงได้ เหมาะสำหรับฉลากสินค้า โลโก้ร้าน หรือของแจก"}
              </p>
            </div>
          </div>
        </div>

        {shopClosed && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              ร้านนี้ปิดทำการอยู่ขณะนี้ — คุณสามารถเลือกตัวเลือกและดูราคาได้ตามปกติ แต่ยังไม่สามารถสั่งพิมพ์ได้จนกว่าร้านจะเปิด
            </p>
          </div>
        )}

        <form id="order-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-6 items-start">
            {/* ── Left Column: Form & Interactive Preview ── */}
            <div className="space-y-5 order-1 lg:order-1">

              {/* Box 1: อัปโหลดไฟล์งาน */}
              <div className="bg-white rounded-2xl border-2 border-sky-200/80 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 tracking-wide">
                    อัปโหลดไฟล์งาน
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    รองรับไฟล์ PDF, JPG, PNG (ขนาดไม่เกิน 100MB)
                  </span>
                </div>

                {!file ? (
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleFileDrop}
                    className={`block border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
                      isDraggingFile
                        ? "border-orange-500 bg-orange-50/60 scale-[0.99]"
                        : "border-orange-300 bg-orange-50/40 hover:border-orange-400"
                    }`}
                  >
                    <input type="file" accept={acceptAttr} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                        <Upload size={18} />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs font-bold text-slate-800">ลากไฟล์มาวางที่นี่ หรือ เลือกไฟล์จากเครื่อง</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">คลิกบริเวณนี้เพื่อเลือกไฟล์จากคอมพิวเตอร์หรือโทรศัพท์ของคุณ</p>
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                        {file.type === "application/pdf" ? "PDF" : "IMG"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                          <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                          <span>•</span>
                          <span>{pdfPageCount > 0 ? `${pdfPageCount} หน้า` : "1 ไฟล์"}</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5 ml-1">
                            <Check size={12} /> อัปโหลดสำเร็จ
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs">
                        <input type="file" accept={acceptAttr} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        <RefreshCw size={12} />
                        <span>เปลี่ยนไฟล์</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1 shadow-2xs"
                      >
                        <Trash2 size={12} />
                        <span>ลบไฟล์</span>
                      </button>
                    </div>
                  </div>
                )}
                {errors.file && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.file}</p>}
              </div>

              {/* Box 2: ตัวอย่างไฟล์ (Previewer Area matching mockup) */}
              <div className="bg-white rounded-2xl border-2 border-sky-200/80 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 tracking-wide">
                    พรีวิวไฟล์ (Preview)
                  </h3>
                  {file && pdfPaperSizeLabel && (
                    <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {pdfPaperSizeLabel}
                    </span>
                  )}
                </div>

                {!file ? (
                  <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-1">
                    <ImageIcon size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-500">กรุณาอัปโหลดไฟล์งานเพื่อดูตัวอย่าง</p>
                    <p className="text-[11px] text-slate-400">ระบบจะแสดงพรีวิวหน้ากระดาษ PDF และสัดส่วนไฟล์ให้ตรวจสอบก่อนสั่งพิมพ์</p>
                  </div>
                ) : (
                  <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 flex flex-col md:flex-row gap-3 min-h-[320px]">
                    {/* Left Thumbnails List (If PDF with pages) */}
                    {pdfThumbnails.length > 0 && (
                      <div className="w-full md:w-32 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[340px] pr-1 shrink-0">
                        {pdfThumbnails.map((thumbUrl, idx) => {
                          const pageNum = idx + 1;
                          const isActive = pdfCurrentPage === pageNum;
                          return (
                            <button
                              type="button"
                              key={pageNum}
                              onClick={() => goToPdfPage(pageNum)}
                              className={`group relative rounded-xl border-2 p-1 bg-white text-left transition-all shrink-0 ${
                                isActive
                                  ? "border-orange-500 shadow-xs"
                                  : "border-slate-200 hover:border-orange-300 opacity-70 hover:opacity-100"
                              }`}
                            >
                              <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={thumbUrl} alt={`หน้า ${pageNum}`} className="w-full h-full object-cover" />
                              </div>
                              <p className={`text-[10px] text-center font-bold mt-1 ${isActive ? "text-orange-600" : "text-slate-500"}`}>
                                หน้า {pageNum}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Main Previewer Canvas Container */}
                    <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      {/* Toolbar Top */}
                      <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 text-xs flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{file.name}</span>

                        {/* Pagination if PDF */}
                        {pdfPageCount > 0 && (
                          <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => goToPdfPage(pdfCurrentPage - 1)}
                              disabled={pdfCurrentPage <= 1}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span className="text-[11px] font-bold text-slate-700">
                              {pdfCurrentPage} / {pdfPageCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => goToPdfPage(pdfCurrentPage + 1)}
                              disabled={pdfCurrentPage >= pdfPageCount}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">100%</span>
                        </div>
                      </div>

                      {/* Display Canvas */}
                      <div className="flex-1 min-h-[260px] bg-slate-100/60 p-4 flex items-center justify-center relative overflow-hidden">
                        {pdfLoading ? (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Loader2 size={24} className="animate-spin text-orange-500" />
                            <span className="text-xs font-semibold">กำลังโหลดตัวอย่าง...</span>
                          </div>
                        ) : pdfError ? (
                          <p className="text-xs text-red-500 font-semibold p-4 text-center">{pdfError}</p>
                        ) : pdfPreviewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pdfPreviewUrl}
                            alt="PDF Preview"
                            className="max-h-[300px] w-auto object-contain rounded-lg shadow-md border border-slate-200"
                          />
                        ) : genericImagePreviewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={genericImagePreviewUrl}
                            alt="Image Preview"
                            className="max-h-[300px] w-auto object-contain rounded-lg shadow-md border border-slate-200"
                          />
                        ) : (
                          <div className="text-center text-slate-400 space-y-1">
                            <FileText size={32} className="mx-auto text-orange-400" />
                            <p className="text-xs font-bold text-slate-600">{file.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Box 3: ตัวเลือกเพิ่มเติมของงาน (Options Grid matching mockup) */}
              <div className="bg-white rounded-2xl border-2 border-sky-200/80 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-900 tracking-wide">
                    ตัวเลือกเพิ่มเติมของงาน
                  </h3>
                </div>

                {/* Color Selection if ColorTiers exist */}
                {mainService.colorTiers.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>สี</span>
                      <Info size={12} className="text-slate-400" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedColorTierId(undefined)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          !selectedColorTierId
                            ? "border-2 border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        ขาวดำ (฿{mainService.basePrice}{COLOR_TIER_UNIT_SUFFIX[pricingModel]})
                      </button>
                      {mainService.colorTiers.map((tier) => (
                        <button
                          type="button"
                          key={tier.id}
                          onClick={() => setSelectedColorTierId(tier.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            selectedColorTierId === tier.id
                              ? "border-2 border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          {tier.label} (฿{tier.pricePerUnit}{COLOR_TIER_UNIT_SUFFIX[pricingModel]})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Options list */}
                {mainService.options.map((opt) => {
                  if (!opt.id) return null;
                  const err = errors[`option-${opt.id}`];
                  return (
                    <div key={opt.id} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <span>{opt.name}</span>
                        <Info size={12} className="text-slate-400" />
                      </label>

                      {(opt.type === "dropdown" || opt.type === "radio") && (
                        <div className="flex flex-wrap gap-2">
                          {opt.values.map((v) => {
                            const isSelected = optionState[opt.id as string] === v.id;
                            return (
                              <button
                                type="button"
                                key={v.id}
                                onClick={() => setOption(opt.id as string, v.id as string)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                  isSelected
                                    ? "border-2 border-orange-400 bg-orange-50/90 text-orange-600 shadow-2xs"
                                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                                }`}
                              >
                                {isSelected && <Check size={13} className="text-orange-500" />}
                                <span>{v.name}</span>
                                {v.extraPrice > 0 ? (
                                  <span className={isSelected ? "text-orange-600 font-extrabold" : "text-slate-400 font-normal"}>
                                    (+฿{v.extraPrice})
                                  </span>
                                ) : (
                                  ""
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {err && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {err}</p>}
                    </div>
                  );
                })}

                {/* per_sqm custom size fields */}
                {pricingModel === "per_sqm" && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>ขนาดที่ต้องการ (ซม.)</span>
                      <Info size={12} className="text-slate-400" />
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <NumberField label="กว้าง (ซม.)" value={widthCm} onChange={setWidthCm} />
                      <NumberField label="สูง (ซม.)" value={heightCm} onChange={setHeightCm} />
                    </div>
                  </div>
                )}

              </div>

              {/* Box 4: จำนวน */}
              <div className="bg-white rounded-2xl border-2 border-sky-200/80 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-slate-900 tracking-wide">
                    จำนวน
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/80 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, (q === "" ? 1 : q) - 1))}
                      className="w-8 h-8 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-bold transition shadow-2xs"
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-12 text-center text-xs font-extrabold text-slate-800 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => (q === "" ? 1 : q) + 1)}
                      className="w-8 h-8 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-bold transition shadow-2xs"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-slate-700">ชิ้น</span>
                  <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <span>ราคาวัดตามจำนวนที่เลือก</span>
                    <Sparkles size={12} className="text-amber-500" />
                  </span>
                </div>
              </div>
            </div>

            {/* ── Right Column: Summary Card (สรุปรายการสั่งซื้อ Clean Formal Styling) ── */}
            <div className="order-2 lg:order-2 lg:sticky lg:top-20 space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                
                {/* Clean Brand Orange Header */}
                <div className="bg-orange-500 px-5 py-3.5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={18} className="text-white shrink-0" />
                    <h3 className="font-bold text-white text-sm tracking-wide">สรุปรายการสั่งซื้อ</h3>
                  </div>
                </div>

                {/* Card Body Content */}
                <div className="p-5 space-y-4">
                  {/* Service Card Badge */}
                  <div className="p-3 bg-orange-50/80 border border-orange-200/80 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                      <FileText size={16} />
                    </div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{mainService.name}</p>
                  </div>

                  {/* Uploaded File Item Box */}
                  {file && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{pdfPageCount > 0 ? `${pdfPageCount} หน้า` : "1 ไฟล์"}</p>
                      </div>
                    </div>
                  )}

                  {/* รายละเอียด Options Summary */}
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400">รายละเอียดงาน</p>
                    {selectedOptionsDetailedList.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-600">
                        <span className="font-medium text-slate-500">{item.label}</span>
                        <span className="font-bold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
                      <span className="font-medium text-slate-500">จำนวน</span>
                      <span className="font-bold text-slate-800">{quantity || 1} ชิ้น</span>
                    </div>
                  </div>

                  {/* รายละเอียดราคา Price Itemization */}
                  <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                    <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-400">รายละเอียดราคา</p>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>ราคาพื้นฐาน</span>
                      <span className="font-semibold">฿{mainService.basePrice}</span>
                    </div>
                    {selectedOptionsDetailedList.map((item, idx) => {
                      if (item.extraPrice <= 0) return null;
                      return (
                        <div key={idx} className="flex justify-between items-center text-slate-600">
                          <span>{item.label}: {item.value.split("(")[0]}</span>
                          <span className="font-semibold text-orange-600">+฿{item.extraPrice}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center text-slate-600">
                      <span>จำนวน {quantity || 1} ชิ้น</span>
                      <span className="font-semibold">฿0</span>
                    </div>
                  </div>

                  {/* Total Price Row */}
                  <div className="pt-3 border-t border-dashed border-slate-300 flex items-baseline justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">รวมทั้งหมด</span>
                    <span className="text-2xl font-black text-orange-500">
                      ฿{previewTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Primary Add to Cart Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || shopClosed}
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart size={18} />
                    <span>
                      {shopClosed
                        ? "ร้านปิดทำการอยู่ขณะนี้"
                        : isUploading
                        ? "กำลังอัปโหลดไฟล์..."
                        : isSubmitting
                        ? "กำลังเพิ่ม..."
                        : `เพิ่มลงตะกร้า • ฿${previewTotal.toLocaleString()}`}
                    </span>
                  </button>

                  {/* Helper note */}
                  <p className="text-[11px] text-emerald-600 font-bold text-center flex items-center justify-center gap-1">
                    <CheckCircle size={13} className="text-emerald-500" />
                    <span>พร้อมจัดพิมพ์คุณภาพสูง จัดส่งรวดเร็ว</span>
                  </p>
                </div>
              </div>

              {/* Trust Badges Footer Grid (4 Cards matching mockup) */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-2xs flex items-center gap-2">
                  <Rocket size={16} className="text-orange-500 shrink-0" />
                  <div>
                    <p className="leading-tight">คุณภาพพิมพ์สูง</p>
                    <p className="text-[9px] text-slate-400 font-normal">คมชัด สีสวย</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-2xs flex items-center gap-2">
                  <Truck size={16} className="text-orange-500 shrink-0" />
                  <div>
                    <p className="leading-tight">จัดส่งรวดเร็ว</p>
                    <p className="text-[9px] text-slate-400 font-normal">ทั่วประเทศ</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-2xs flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="leading-tight">ปลอดภัย 100%</p>
                    <p className="text-[9px] text-slate-400 font-normal">ข้อมูลไม่รั่วไหล</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-2xs flex items-center gap-2">
                  <Headphones size={16} className="text-sky-500 shrink-0" />
                  <div>
                    <p className="leading-tight">บริการลูกค้า</p>
                    <p className="text-[9px] text-slate-400 font-normal">พร้อมดูแล</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number | ""; onChange: (v: number | "") => void }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 font-semibold mb-1">{label}</label>
      <input
        type="number"
        min="1"
        step="0.5"
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-slate-50/50"
      />
    </div>
  );
}
