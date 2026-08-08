---
name: EasyPrint
description: แพลตฟอร์มสั่งพิมพ์งานออนไลน์ที่อบอุ่น เร็ว และเข้าถึงได้ทุกคน
colors:
  primary: "#F46A2F"
  primary-light: "#FFB273"
  primary-hover: "#E05B22"
  primary-bg: "#fff7ed"
  secondary: "#4bc5e0"
  secondary-soft: "#96f2eb"
  secondary-hover: "#82e5dd"
  secondary-dark: "#14b8a6"
  accent-emerald: "#10b981"
  accent-amber: "#f59e0b"
  surface: "#f8fafc"
  surface-white: "#ffffff"
  neutral-text: "#1e293b"
  neutral-secondary: "#475569"
  neutral-muted: "#94a3b8"
  neutral-border: "#e2e8f0"
  neutral-border-light: "#f1f5f9"
  neutral-disabled: "#cbd5e1"
  error: "#ef4444"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2rem, 6vw, 3.5rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "0.025em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.25rem, 3vw, 2rem)"
    fontWeight: 900
    lineHeight: 1.15
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.full}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-ghost:
    backgroundColor: "{colors.primary-bg}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  button-disabled:
    backgroundColor: "{colors.neutral-disabled}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.full}"
    padding: "14px 24px"
  chip-teal:
    backgroundColor: "{colors.secondary-soft}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  chip-teal-selected:
    backgroundColor: "{colors.secondary-dark}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  chip-orange-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  badge-open:
    backgroundColor: "{colors.accent-emerald}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-closed:
    backgroundColor: "{colors.neutral-disabled}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  card-shop:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.full}"
    padding: "14px 16px"
---

# Design System: EasyPrint

## Overview

**Creative North Star: "The Warm Express Lane"**

EasyPrint's design language marries warmth with efficiency — the visual equivalent of a friendly shop counter where the queue moves fast. The palette pairs sun-baked orange (#F46A2F) with cool aqua-teal (#4bc5e0/ #96f2eb) to signal both the heat of a printer and the calm of a task completed. Everything is round: inputs are pills, cards have generous curves, buttons never have a sharp edge. The overall feel is immediately approachable — a nod to the fact that users range from first-time students to regular office workers who just want their files ready before they arrive.

Typography leans heavily on ultra-bold weights (font-black, 900) for headings, which gives each screen a confident, legible anchor even on small mobile viewports. Body copy and metadata stay medium-weight and modest, so the hierarchy is unmistakable at a glance. The system avoids visual complexity: no sidebar navigation, no dark mode, no layered modals stacked inside modals. What you see is always what you need.

The anti-reference is the overloaded enterprise dashboard: too many columns, too much chrome, no breathing room. EasyPrint trades density for clarity — a customer should be able to pick a shop and confirm their file upload within a few focused steps.

**Key Characteristics:**
- Round-everything form language (pills and 2xl/3xl radius on all interactive elements)
- Two-tone warmth: orange primary + aqua-teal secondary, with white and slate-50 doing the heavy lifting on neutral surfaces
- Ultra-bold headings that anchor screens without needing large type sizes
- Shadows used as motion feedback (rest = shadow-xs, hover = shadow-md), not as decorative depth
- Bright semantic colors for status (emerald = open, slate = closed, amber = stars)

## Colors

สีของ EasyPrint แบ่งออกเป็นสองน้ำเสียง: ส้มร้อน (Primary) ที่ให้ความรู้สึกพลังงานและความเร็ว กับ teal เย็นสดชื่น (Secondary) ที่ balance ความอบอุ่นและสื่อถึงความสะอาดหมดจดของงานพิมพ์

### Primary

- **Printer Flame** (#F46A2F): สีหลักของแบรนด์ ใช้บน CTA buttons ทุกตัว, ไอคอน accent, ชื่อร้านค้าใน listing, links, และ focus rings ของ form inputs ทั้งหมด ความเข้มของสีนี้ทำให้มองเห็นได้บน background ขาวและ slate-50 ได้ดีเท่ากัน
- **Warm Amber** (#FFB273): ใช้เป็น gradient pair กับ Printer Flame บนหน้า login hero และเป็น star-rating fill สีนี้เบาและไม่ใช้เป็น standalone accent ไม่เช่นนั้นจะดูซีดเกินไปบน white
- **Flame Deep** (#E05B22): hover state ของ primary button เท่านั้น ไม่ปรากฎในที่อื่น
- **Flame Wash** (#fff7ed): พื้นหลังของ ghost/outline buttons และ mobile filter toggle ที่ยังอยู่ใน orange family

### Secondary

- **Print Shop Aqua** (#4bc5e0): สีกราเดียนต์บน hero section ของหน้า landing ให้ความรู้สึกเย็น สดชื่น สะอาด ใช้ร่วมกับ orange เพื่อสร้าง contrast อารมณ์
- **Aqua Mist** (#96f2eb): พื้นหลังของ filter select dropdowns และ chip tags ทุกตัว ความ opacity 60% ทำให้ดูนุ่มและไม่รบกวนสายตา
- **Aqua Hover** (#82e5dd): hover state ของ Aqua Mist chip และ select
- **Teal Confirm** (#14b8a6 / teal-500): selected state ของ chip filters เมื่อ user เลือก delivery/service option

### Tertiary

- **Go Green** (#10b981 / emerald-500): สัญลักษณ์ "เปิดทำการ" บน status badge เท่านั้น ไม่ใช้ในบริบทอื่น
- **Rating Amber** (#f59e0b): fill สำหรับ star icons ในการแสดง rating ร้านค้า

### Neutral

- **Ink Navy** (#1e293b / slate-800): สีข้อความหลักสำหรับ headings และ body text บนพื้นขาว
- **Smoke** (#475569 / slate-600): ข้อความ secondary สำหรับรายละเอียดเพิ่มเติม (ที่อยู่, เวลา)
- **Cloud** (#94a3b8 / slate-400): placeholder text, disabled labels, muted metadata
- **Paper** (#f8fafc / slate-50): page background ทั้งแอป
- **Surface White** (#ffffff): ผิว card, form container, navbar
- **Border Silver** (#e2e8f0 / slate-200): ขอบ card, dividers, input borders
- **Border Whisper** (#f1f5f9 / slate-100): dividers ที่เบามากภายใน card
- **Frost** (#cbd5e1 / slate-300): disabled button background
- **Danger Red** (#ef4444 / red-500): error messages เท่านั้น

### Named Rules

**The Two-Tone Balance Rule.** ห้ามใช้ orange และ teal ในพื้นที่ใกล้เคียงกันในน้ำหนักที่เท่ากัน เลือกอย่างใดอย่างหนึ่งเป็นตัวนำในแต่ละ section เสมอ

**The Semantic Color Lock Rule.** Go Green (#10b981) สงวนไว้สำหรับ "เปิดทำการ" เท่านั้น Danger Red (#ef4444) สงวนไว้สำหรับ error/destructive actions เท่านั้น ห้ามใช้ทั้งสองสีเพื่อ decoration

## Typography

**Display Font:** ui-sans-serif, system-ui, -apple-system, sans-serif (Inter on most browsers)
**Body Font:** เดียวกับ Display — single-family system

**Character:** โปรเจกต์ใช้ font ระบบ (system-ui) ที่น้ำหนักสูงมาก (900 font-black) สร้าง impact ด้วย weight ไม่ใช่ด้วย decorative typeface ตัวอักษรไทยได้รับการ render ผ่าน system stack เดียวกันและดูสม่ำเสมอบนทุก platform

### Hierarchy

- **Display** (900, clamp(2rem, 6vw, 3.5rem), lh 1.05, ls 0.025em): hero headings เช่น "ร้านถ่ายเอกสารออนไลน์" และ wordmark บนหน้า login
- **Headline** (900, clamp(1.25rem, 3vw, 2rem), lh 1.15): ชื่อร้านค้าใน card listing และ modal headings
- **Title** (700, 1.125rem, lh 1.3): section headings, navbar brand text, card section labels
- **Body** (500, 0.875rem, lh 1.5): descriptions, addresses, times, body copy ทั่วไป
- **Label** (700, 0.75rem, ls 0.01em): chip text, badge text, filter dropdown labels, input labels
- **Micro** (600-700, 0.625–0.6875rem): status sub-text บน badge, timestamp, tiny metadata

### Named Rules

**The Weight Anchor Rule.** ทุกหน้าต้องมีอย่างน้อยหนึ่ง element ที่ใช้ font-black (900) เพื่อเป็น visual anchor ห้าม screen ที่มีแต่ font-medium ทั้งหมด

## Layout

EasyPrint ใช้ single-column centered container เป็นหลัก: `max-w-6xl mx-auto` (1152px) สำหรับ main content และ `max-w-4xl mx-auto` (896px) สำหรับ hero copy layout เป็น Stack-first — ทุกอย่าง flow จากบนลงล่างใน single column บน mobile และขยายเป็น grid 2 คอลัมน์บน desktop (`lg:grid-cols-2`) เฉพาะ shop listing

Auth pages ใช้ split-layout พิเศษ: ครึ่งซ้าย (50%) เป็น branded panel สี gradient พร้อม decorative spheres, ครึ่งขวาเป็น form บน white/slate background (ซ่อน left panel บน mobile)

Sticky header (`position: sticky; top: 0; z-index: 50`) อยู่ที่ความสูง ~61px รวม padding Responsive breakpoints ที่ใช้จริง: `sm` (640px) แยก mobile/tablet layout, `lg` (1024px) แยก 2-column grid และ split layout

Density: เน้น comfortable — ไม่ compact ใช้ `gap-6` และ `py-8` เป็นค่าเริ่มต้นบน desktop ลดลงเป็น `gap-3.5` และ `py-6` บน mobile

## Elevation & Depth

ระบบนี้ใช้ shadow เป็น motion feedback ไม่ใช่ decorative layering พื้นผิวที่ rest จะ flat หรือ shadow-xs เท่านั้น shadow ที่เด่นขึ้นจะปรากฏเมื่อ element นั้น interactive และอยู่ใน hover/active state

### Shadow Vocabulary

- **Rest Whisper** (`box-shadow: 0 1px 2px rgba(0,0,0,0.05)`): card ทั่วไปที่ rest สัมผัสได้เพียงจาง
- **Hover Lift** (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)`): shop card บน hover และ modal role selectors
- **Nav Float** (`box-shadow: 0 1px 3px rgba(0,0,0,0.08)`): sticky navbar — ต้องรู้สึกว่าลอยอยู่เหนือ content
- **Modal Presence** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)`): dialog และ register modal
- **Auth Card Warm** (`box-shadow: 0 25px 60px -15px rgba(15,23,42,0.15), 0 10px 28px -10px rgba(244,106,47,0.15)`): login form card — shadow ที่ 2nd layer มีสีส้มซึมผ่าน เป็น signature shadow เฉพาะหน้า auth

### Named Rules

**The Flat-By-Default Rule.** Surface อยู่ที่ rest จะ flat หรือ shadow-xs เท่านั้น Shadow เพิ่มขึ้นเมื่อ interact ห้าม apply shadow-lg บน element ที่ไม่ interactive

## Shapes

EasyPrint เลือก "pill-first" form language อย่างชัดเจน: inputs, buttons, chips, badges, และ avatar containers ทุกตัวใช้ `border-radius: 9999px` (rounded-full) ความกลมนี้สื่อถึงความเป็นมิตร เข้าถึงได้ง่าย และสอดคล้องกับ brand ที่ต้องการให้ไม่น่ากลัว

Cards และ containers ใหญ่ใช้ `border-radius: 16px` (rounded-2xl) หรือ `24px` (rounded-3xl) เพื่อดูนุ่มขึ้นกว่า sharp-corner แต่ไม่กลมเท่า pill Image thumbnails ในการ์ดร้านใช้ `border-radius: 12px` (rounded-xl) ซึ่งน้อยกว่า card ตัวเองเล็กน้อย สร้าง visual hierarchy ภายใน

ไม่มีการใช้ sharp corners (border-radius: 0) กับ interactive elements เลย ยกเว้น dividers และ progress bars ที่ไม่ใช่ containers

**The Round-Everything Rule.** ห้ามใช้ border-radius ที่น้อยกว่า 8px กับ interactive elements (buttons, inputs, chips, cards) ทุกตัว

## Components

### Buttons

Character: "พิลล์ที่มั่นใจ" — ทุก button เป็น pill ไม่มี sharp edges พาล ัตอ สะกิดสายตาด้วยสีส้มเมื่อ CTA

- **Shape:** border-radius: 9999px (pill) บน button ทุกตัว
- **Primary:** พื้นหลัง Printer Flame (#F46A2F), ข้อความขาว, padding 14px 24px, shadow-lg, font-bold
- **Hover / Focus:** พื้นหลังเข้มขึ้นเป็น Flame Deep (#E05B22), translateY(-2px), shadow ขยาย
- **Disabled:** พื้นหลัง Frost (#cbd5e1), ข้อความขาว, cursor-not-allowed, ไม่มี hover effect
- **Ghost / Outline:** พื้นหลัง Flame Wash (#fff7ed), ข้อความ orange-600, border border-orange-200, ใช้สำหรับ secondary actions บน mobile
- **Destructive (text-link style):** ไม่มี background, text-orange-500, underline on hover

### Chips & Filter Tokens

- **Teal Unselected:** พื้นหลัง Aqua Mist (#96f2eb) ที่ opacity 60%, ข้อความ Ink Navy, border-radius pill, font-bold text-xs
- **Teal Selected:** พื้นหลัง Teal Confirm (#14b8a6), ข้อความขาว, shadow-xs
- **Orange Selected:** พื้นหลัง Printer Flame (#F46A2F), ข้อความขาว, shadow-xs — ใช้สำหรับ "ทั้งหมด" chip ที่ active
- **Emerald:** พื้นหลัง emerald-100, ข้อความ emerald-800 เมื่อ unselected / emerald-500 + white เมื่อ selected

### Cards / Containers

- **Shop Card:** border-2 border-orange-300, hover:border-orange-400, border-radius 16px (desktop) / 24px บางรุ่น, shadow-xs → shadow-md on hover, padding 12–20px, flex row layout พร้อม image thumbnail ซ้ายและรายละเอียดขวา
- **Filter Container:** border border-slate-100, shadow-xs, border-radius 16px, พื้นหลัง white
- **Modal Card:** border-radius 24px, shadow-2xl, max-w-md, backdrop blur bg-black/40

### Inputs / Fields

- **Style:** border-radius: 9999px (pill), พื้นหลัง slate-50, border border-slate-200, padding 14px, text-sm, มี icon prefix ด้านซ้าย (left-4, top-3.5)
- **Focus:** border-color → Printer Flame (#F46A2F), ring-1 ring-[#F46A2F], transition 200ms
- **Placeholder:** Cloud (#94a3b8)
- **Select dropdown:** พื้นหลัง Aqua Mist (#96f2eb) ที่ opacity 60%, border-radius pill, appearance-none, custom ChevronDown icon overlaid

### Navigation

- **Style:** sticky top-0 z-50, พื้นหลัง white/95 + backdrop-blur-md, border-bottom border-slate-100, shadow-xs
- **Logo:** icon circle gradient orange-to-amber ขนาด 40px + wordmark "EASYPRINT" ด้วย font-black text-orange-500
- **Nav links (desktop):** ข้อความ orange-500 พร้อม border-bottom 2px ใต้ active link
- **Auth buttons:** "เข้าสู่ระบบ" เป็น text link orange, "สมัครสมาชิก" เป็น gradient pill button (from-orange-500 to-amber-500)
- **Mobile:** hamburger button เปิด drawer ที่ slide-in-from-top

### Status Badges

- **Open:** เขียว (emerald-500), ข้อความขาว, pill, มี pulse dot ข้างใน, font-bold text-xs
- **Closed:** Frost/slate-400, ข้อความขาว, pill, same pulse dot แต่ไม่ animate

### Auth Panel (Signature)

หน้า login มี split-screen layout พิเศษที่ไม่ปรากฏในหน้าอื่น: left panel มี gradient สี (orange → amber → teal-pink), floating 3D spheres ที่ animate, glassmorphic preview card, และ display wordmark ขนาดใหญ่ 7xl ซึ่งเป็น brand moment เดียวของแอป ไม่ควร replicate pattern นี้ไปยัง page อื่น

## Do's and Don'ts

### Do:
- **Do** ใช้ font-weight 900 (font-black) สำหรับ page heading หรือ section anchor ทุก screen — ห้ามให้ screen ใดดูแบน
- **Do** ใช้ border-radius: 9999px กับ buttons, inputs, chips, badges ทุกตัว
- **Do** ใช้ shadow เพื่อสื่อถึง interaction state (rest = flat/shadow-xs, hover = shadow-md, modal = shadow-2xl)
- **Do** ใช้ Aqua Mist (#96f2eb) เป็นพื้นหลัง chip/select ที่ยังไม่ถูกเลือก และ Teal Confirm (#14b8a6) เมื่อ selected
- **Do** ให้ orange เป็นสีนำบน white/slate surfaces — ทุก CTA สำคัญต้องเป็น Printer Flame (#F46A2F)
- **Do** รักษา 2 border width (`border-2`) สำหรับ shop card เพื่อให้ orange border มองเห็นได้ชัดเจนบน white background

### Don't:
- **Don't** ใช้ sharp corners (border-radius < 8px) กับ interactive element ใดๆ
- **Don't** ใช้ Go Green (#10b981) หรือ Danger Red (#ef4444) นอกจาก status badge และ error message ตามลำดับ
- **Don't** overlay orange กับ teal ในน้ำหนักที่เท่ากันในพื้นที่เดียวกัน — เลือก primary ของ section นั้นๆ
- **Don't** สร้าง UI ที่มี sidebar navigation, collapsible panels, หรือ deep nesting — ยึดหลัก single-column flow
- **Don't** ใช้สี gray-only หรือ monotone สำหรับ surface หลัก — ต้องมี orange หรือ teal เป็น accent อยู่เสมอ
- **Don't** duplicate auth panel's split-screen + floating sphere pattern ไปยัง screens อื่น — เป็น signature เฉพาะ login/register
