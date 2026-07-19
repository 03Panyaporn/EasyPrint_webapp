# EasyPrint

แพลตฟอร์มบริหารจัดการร้านถ่ายเอกสาร — รายละเอียดเต็มอยู่ที่ [`docs/proposal.md`](docs/proposal.md)

## เริ่มต้นใช้งาน (ครั้งแรก)

```powershell
cd D:\easyprint
bun install
copy .env.example .env
# แล้วใส่ค่าจริงใน .env (ขอจากเพื่อนในทีม ไม่ commit ขึ้น GitHub)
```

## ให้ Claude Code เห็น skill เดียวกับ Antigravity (ทำครั้งเดียว)

Antigravity มองหา skill ที่ `.agents/skills/` ส่วน Claude Code มองหาที่ `.claude/skills/`
รันคำสั่งนี้ใน PowerShell (แบบ Administrator) เพื่อให้ทั้งสองตัวอ่านไฟล์ชุดเดียวกัน แทนที่จะก็อปซ้ำ:

```powershell
New-Item -ItemType SymbolicLink -Path ".claude\skills" -Target "..\.agents\skills"
```

## รันโปรเจกต์

```powershell
bun run dev:api    # เปิด backend ที่ http://localhost:3000
bun run dev:web    # เปิด frontend ที่ http://localhost:5173 (เปิดอีก terminal นึง)
```

## เอกสารสำคัญ

- [`AGENTS.md`](AGENTS.md) — บริบทโปรเจกต์สำหรับ AI agent (และคนในทีม) อ่านก่อนเริ่มงานเสมอ
- [`docs/proposal.md`](docs/proposal.md) — ข้อเสนอโครงการฉบับเต็ม
- [`docs/erd.md`](docs/erd.md) — โครงสร้างฐานข้อมูล
- [`docs/api-spec.md`](docs/api-spec.md) — รายการ API endpoint
