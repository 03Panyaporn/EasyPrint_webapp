# QA_INDEPENDENT_BUG_REPORT_2026-09-21.md

> Bugs found during the independent QA round (2026-09-21) that extended `AAATeastCase.xlsx` from 24 to 75 test cases (TC-001–TC-075), covering all 30 sub-features in the `Feature` sheet's Requirement Traceability Matrix. Tested directly against production (`https://easyprint-web.panyaporn69452.workers.dev` / `https://easyprint-api-8kki.onrender.com`).

---

## DEF-QAI-01 — Admin shop-management pages never call the backend; show "failed to load" permanently

- **Severity:** Critical
- **Priority:** High
- **Test Case:** TC-060
- **Module:** Admin — Shop Management UI (`/admin/shops`, `/admin/manage`)
- **Status:** Confirmed, reproduced twice on two different pages, at both mobile and 1440x900 desktop viewport widths.

**Summary:** Both admin pages for managing shops (`/admin/shops` "ตรวจสอบร้านค้า" and `/admin/manage` "จัดการร้านค้า") display "โหลดข้อมูลร้านค้าไม่สำเร็จ" (failed to load shop data) immediately on load, with every stat card showing 0. This happens even though the underlying API (`GET /admin/shops`) returns `200` with fully correct data when called directly.

**Root cause evidence:** `window.fetch` was monkey-patched to log every call. After a full page load and clicking the "ลองใหม่อีกครั้ง" (retry) button, **zero requests were ever sent to `easyprint-api-8kki.onrender.com`** for shop data (only the unrelated admin-notifications polling call fired). This means the page's data-fetching code fails or short-circuits before it ever reaches `fetch()` — it is not a network/CORS/auth failure, since no network attempt is made at all.

**Impact:** The admin cannot approve, reject, suspend, edit, or delete any shop through the actual product UI. All shop-management business logic (verified fully correct via direct API calls in TC-058–TC-063) is inaccessible to a real admin user through the website. The main `/admin` dashboard page is unaffected and loads correctly.

**Recommendation:** Inspect the client-side data-fetching hook/component shared by `/admin/shops` and `/admin/manage` for a synchronous throw (e.g., a bad hook dependency, an exception building request options, or a broken shared context) that prevents `fetch` from ever being called.

---

## DEF-QAI-02 — Suspended shops cannot submit Contact Admin requests, contradicting confirmed business rule

- **Severity:** High
- **Priority:** High
- **Test Case:** TC-054
- **Module:** Contact Admin (`POST /shops/:shopId/contact-admin`)
- **Status:** Confirmed.

**Summary:** A shop with `approvalStatus: "suspended"` gets `403` when trying to submit a Contact Admin request, with the same message used for shops that are merely `pending` review: *"ร้านค้ายังไม่ได้รับการอนุมัติจากแอดมิน หรือถูกระงับการใช้งานอยู่ ไม่สามารถดำเนินการนี้ได้ในขณะนี้"*.

**Confirmed against the product owner (2026-09-21):** Suspended shops are exactly the group most likely to need to reach the admin (e.g., to appeal or ask why they were suspended), and **should be able to submit Contact Admin requests successfully.** The current blanket block is a confirmed business-logic defect, not just a wording issue.

**Root cause:** `requireShopOwner()` (used by `apps/api/src/routes/contactAdmin.ts` and 6 other route files) checks only `approvalStatus === "approved"` and rejects everything else uniformly — it does not special-case the "contact admin" action, which should be allowed regardless of approval status.

**Recommendation:** Give the Contact Admin route its own, more permissive guard (any logged-in shop owner, regardless of `approvalStatus`) instead of reusing `requireShopOwner()`.

---

## DEF-QAI-03 — Chat messages have no length limit (server or client)

- **Severity:** Medium
- **Priority:** Medium
- **Test Case:** TC-052 (chat max-length row)
- **Module:** Chat/Messaging (`POST /messages`)
- **Status:** Confirmed (independently re-verified; originally observed in a prior QA round as C5-08 and judged "acceptable" there — the product owner overrode that judgment on 2026-09-21 and asked for it to be tracked as a defect).

**Summary:** A message body of 12,000 characters was accepted with `200` and stored/returned in full — no `max()` validation exists on the `content` field anywhere in the request path.

**Recommendation:** Add a reasonable `max()` constraint (e.g. 2,000–5,000 characters) to the message-content Zod schema, plus a matching client-side character counter/limit.

---

## DEF-QAI-04 — Admin "System Info" settings save correctly but have zero effect anywhere on the site

- **Severity:** Medium
- **Priority:** Medium
- **Test Case:** TC-070
- **Module:** Admin Settings (`/admin/settings`, `PATCH /admin/settings`)
- **Status:** Confirmed — found when the user manually tested this in a real browser (this action was blocked for the AI tester by the sandbox's shared-resource classifier, so the user ran it directly).

**Summary:** The user changed "ชื่อระบบ" (System Name) from "EasyPrint" to "easyprint-SE" on the Admin Settings page and saved. The new value persists correctly (it survives a page reload, confirming `PATCH /admin/settings` writes to the DB and `GET` reads it back — the save mechanism itself works, dynamically, with no restart needed). However, **the new name never appears anywhere else on the site** — the sidebar/header logo block still hardcodes the text "EASYPRINT".

**Root cause confirmed by code search:** `apps/web/app/(admin)/admin/settings/page.tsx` is the *only* file in the entire `apps/web` codebase that reads or writes `systemName`, `logoUrl` (system logo), `contactEmail`, `contactPhone`, or `website`. No header, page `<title>`, favicon, login page, or any other component consumes these values. The entire "System Info" card is a fully-functional save/load round-trip to a setting that nothing else in the product actually uses.

**Why this is a defect and not just another disclosed stub:** The *Security* section of the same settings page (`requireSpecialChar`, `enable2fa`, `autoLogoutMinutes`) already has explicit UI text telling the admin these are not enforced yet. The "System Info" section has **no such disclaimer** — it looks and behaves exactly like a normal, fully-wired setting, so an admin has no way to know that renaming/rebranding the system here does nothing.

**Recommendation:** Either (a) wire `systemName`/`logoUrl` into the actual site header, `<title>`, and favicon as a real white-labeling feature, or (b) add the same "not yet enforced" disclaimer used in the Security section until that work is done.

---

## Re-verified from earlier today's production session

### BUG-QA0921-01 — Chat read-receipt icon does not reflect actual `isRead` status (still broken)

Re-reproduced independently this round using a fresh order and fresh messages: API confirmed one message `isRead:false` and another `isRead:true`, but the DOM rendered the double-check ("read") icon for **both**. See `QA_PROD_VERIFICATION_2026-09-21.md` for the original write-up and root-cause hypothesis (suspected stale/incomplete frontend deploy). Not re-investigated further at the source-code level this round since the original report already covers it in full.

---

## Blocked test cases needing product-owner clarification

| Test Case | Issue |
|---|---|
| **TC-018** | Original test plan expected that omitting "pricing model" when creating a service should be rejected by the system. In reality, `pricingModel` has a hardcoded default of `"fixed"` in the schema (`packages/shared/src/schemas/service.ts:140`) — it can never be genuinely "empty," so the service is created successfully with the default. **Resolved with the product owner on 2026-09-21: accepted as intended design, not a bug** — recorded as Pass, with a non-blocking UX recommendation (see TC-018 remarks in the spreadsheet) that the service-creation wizard should show an explicit pre-selected choice rather than a silent default. |

---

*Prepared by Claude (AI QA Tester) — 2026-09-21, testing directly against production.*
