# EasyPrint — Independent QA Test Plan
**Date:** 2026-09-21
**Tester:** Claude (AI QA Engineer), acting as independent QA — this round does **not** rely on the pass/fail conclusions of any prior QA cycle (`docs/qa/test-plan.md` 2026-08-25; `QA_FINAL_REPORT.md`/`QA_TEST_CASES.md`/`QA_BUG_REPORT.md` 2026-09-06..08; `QA_PROD_VERIFICATION_2026-09-21.md` earlier today). Prior reports are used only as background context on where bugs have historically clustered, never as a substitute for re-testing.
**Requirement sources:** `docs/proposal.md` (§1.3 scope), `docs/erd.md`, `docs/api-spec.md`, plus business-rule clarifications confirmed directly with the product owner on 2026-09-21 (see §3 below — anything not confirmed there and not explicit in the docs is treated as unverified and flagged rather than assumed).

---

## 1. System Under Test

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind — route groups `(auth)` `(customer)` `(shop)` `(admin)` + public `shops/[shopId]` |
| Backend | ElysiaJS on Bun, TypeScript |
| ORM/DB | Drizzle ORM → PostgreSQL (Supabase) |
| File storage | Cloudflare R2 (migrated from Supabase Storage) |
| Auth | JWT (httpOnly cookie) + Argon2 password hashing |
| Production | Frontend: Cloudflare Pages/Workers (`easyprint-web.panyaporn69452.workers.dev`) · Backend: Render (`easyprint-api-8kki.onrender.com`, free tier, 15-min cold start) |

**Roles:** `customer`, `shop_owner`, `admin` (single enum column `users.role`)

## 2. Test Types In Scope

Functional, UI, Validation (required/optional/boundary/format/injection-shaped strings), Business Logic/Workflow, API (status codes, auth, params), Database (integrity, cascade, constraints), Permission/Security (role + ownership, IDOR), File Upload, Responsive (desktop/tablet/mobile), Edge Case (double-submit, refresh, back/forward, multi-tab, wrong-order actions).

Explicitly **out of scope**: load/performance testing beyond small concurrency checks, destructive security testing (fuzzing for RCE, DoS), and anything requiring production credential changes for the team's real (non-QA) accounts.

## 3. Business Rules Confirmed With Product Owner (2026-09-21) — governs Expected Result below

| # | Question | Confirmed answer | Effect on this test plan |
|---|---|---|---|
| BR-1 | Should a `suspended` shop be able to submit a Contact Admin request? | **Yes** — suspended shops are the group most likely to need to reach admin. | Current behavior (blocked with 403, same as `pending`) is a **confirmed defect**, not a documentation/message-wording issue as previously assumed. Module 12 test cases will assert success (200), not 403. |
| BR-2 | Should admin be able to view/moderate customer↔shop chat? | Recognized as a **desirable future gap**, not required now. | Current 403-for-admin behavior is the **correct expected result** for this round; the gap is reported as a recommendation, not a defect. |
| BR-3 | Is the unlimited chat message length (server + client) acceptable? | **No** — confirmed as a defect that needs a length limit. | Module 11 test case for long messages is scored **Fail**, not "acceptable behavior." |
| BR-4 | Should legacy `POST /orders` (Schema v1, dead placeholder pricing, no frontend caller) be tested this round? | **Yes** — write a test case confirming it is still live and still uses the incorrect formula. | Included as ORD-xx test case with explicit "known-issue confirmation" type, recommending removal. |

Any other point where expected behavior is ambiguous and not resolved by the docs above is called out as a **Blocked** test case with a clarification request, per the QA engagement rules, rather than guessed.

## 4. Test Environment

- **Primary:** Production — Frontend `https://easyprint-web.panyaporn69452.workers.dev`, Backend `https://easyprint-api-8kki.onrender.com` (matches what real users hit; also the only environment where the still-open BUG-QA0921-01 is reproducible).
- **Secondary (if needed for destructive/high-risk cases):** local `bun --cwd apps/api dev` (:3000) + `bun --cwd apps/web dev` (:5173) against the same Supabase project — used only if a case is too risky to run against production data.
- **Test data policy:** all new accounts/shops/orders use a `qa-indep-*` naming/email prefix, created fresh, and are throwaway. Real production shops/accounts (e.g. "SE Printer", "Plaifon Printer", "TONFAH PRINTER", `shop01.john@gmail.com`) are never modified, per standing instruction from prior rounds — this instruction is retained here since it protects real user data, independent of whether prior test *results* are trusted.

## 5. Module Breakdown (independent structuring, derived fresh from `docs/api-spec.md` + `docs/erd.md` + source route files, not copied from prior QA docs)

| # | Module | Priority | Key source files |
|---|---|---|---|
| 01 | Authentication & Session | Critical | `apps/api/src/auth/routes.ts`, `(auth)/*` |
| 02 | Authorization & Permission Matrix | Critical | all route guards (`requireShopOwner`, `requireAdmin`, ownership joins) |
| 03 | Customer Account & Profile (incl. addresses) | High | `addresses.ts`, `(customer)/profile` |
| 04 | Shop Registration & Approval Lifecycle | Critical | `admin.ts` (approve/reject/suspend/delete), `(auth)/register/shop-register` |
| 05 | Shop Public Discovery (guest browsing) | High | `shops.ts`, public `shops/[shopId]` |
| 06 | Shop Service Management (services/options/add-ons/delivery) | Critical | `services.ts` |
| 07 | Cart & Pricing Engine | Critical | `cart.ts`, `packages/shared/src/pricing/engine.ts` |
| 08 | Checkout & Order Creation (incl. legacy `POST /orders`) | Critical | `cart.ts` (`/checkout`), `orders.ts` |
| 09 | Order Status Workflow | Critical | `orders.ts` (`PATCH /orders/:id/status`) |
| 10 | Reviews | High | `reviews.ts` |
| 11 | Chat/Messaging | Critical | `messages.ts`, `chatpage.tsx` |
| 12 | Contact Admin | High | `contactAdmin.ts` |
| 13 | Notifications (in-app) | High | `notifications.ts`, `adminNotificationsRoutes.ts` |
| 14 | Admin: Shop Management | Critical | `admin.ts` |
| 15 | Admin: System Settings & Users placeholder | Medium | `adminSettings.ts`, `(admin)/admin/users` |
| 16 | File Upload & Storage Management | Critical | `uploads.ts`, `storage.ts`, `adminStorage.ts` |
| 17 | Reports/Analytics | Medium | `reports.ts` |
| 18 | Responsive & Cross-cutting UI Edge Cases | Medium | all frontend pages |
| 19 | Production Infra-specific Risks | High | deploy config, `AGENTS.md` §7, cross-site cookies |
| 20 | Regression re-verification of BUG-QA0921-01 | High | `chatpage.tsx` read-receipt logic |

## 6. Entry / Exit Criteria

**Entry:** Business rules in §3 confirmed; test accounts creatable via public registration; production reachable.
**Exit:** Every module has all planned cases executed (Pass/Fail/Blocked — none left "Not Run" without a stated reason); every Fail has a filed defect in the Bug Report; every Blocked has an open clarification question restated to the product owner.

## 7. Deliverables

1. This Test Plan (`QA_INDEPENDENT_TEST_PLAN_2026-09-21.md`)
2. Test Cases — full table, one row per case, exact 18-column format specified by the product owner (`QA_INDEPENDENT_TEST_CASES_2026-09-21.md`)
3. Bug Report for any confirmed Fail (`QA_INDEPENDENT_BUG_REPORT_2026-09-21.md`)
4. Final summary report once all modules are executed
