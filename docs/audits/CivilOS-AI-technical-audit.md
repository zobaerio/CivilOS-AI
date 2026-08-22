# CivilOS AI — Technical Audit and Prioritized Implementation Plan

**Audit status:** Read-only inspection completed
**Repository:** [`zobaerio/CivilOS-AI`](https://github.com/zobaerio/CivilOS-AI)
**Audited branch/commit:** `main` at `c250a403c033bad34ac39d5f105d125890548c26`
**Audit date:** 22 August 2026
**Prepared by:** Manus AI

> **Approval gate:** No application source files, migrations, environment files, GitHub branches, commits, or deployments were modified during this audit. No changes were committed or pushed. This report intentionally stops before implementation and awaits your approval.

## 1. Executive assessment

CivilOS AI is an existing, feature-rich React/Vite application rather than an empty scaffold. Its strongest current capability is the public estimation experience: the homepage, upload-and-input flow, deterministic estimate engine, BOQ/structural/rebar/timeline/quotation views, PDF/Excel/CSV export surfaces, bilingual UI, theme switching, and PWA shell are present and render successfully in a disposable local checkout. The signed-in workspace also has real Supabase-backed projects, profile, collaboration, documents, invitations, activity, notifications, affiliate, ratings, sponsor, and manual billing data models.

The project is **not yet production-ready for paid or safety-sensitive use**. The most urgent issue is authorization integrity in the subscription and usage tables: the current RLS policies allow an authenticated user to insert or update their own subscription row while controlling fields such as `plan_id`, and allow users to update their own usage counters directly. This can undermine paid-plan enforcement and quota accounting even if the UI appears locked. The AI edge-function boundary has a second urgent issue: `ai-analyze` is explicitly configured with `verify_jwt = false`, has wildcard CORS, and performs no in-function user or plan check; therefore the expensive visual-analysis endpoint is publicly callable unless another external control exists.

The repository also has a delivery-quality gap. The production build and the existing 13 tests pass in a disposable checkout, but `npm ci` fails because `package-lock.json` is out of sync with `package.json`, and ESLint fails with **113 errors and 31 warnings**. The code compiles because Vite transpiles without acting as a full type/lint gate, while broad `any` usage and `@ts-nocheck` reduce the value of static checks.

The recommended order is therefore: **secure billing, quota, authentication, and AI boundaries first; stabilize dependency/build quality second; reconcile route/product promises third; then improve engineering correctness, document ingestion, performance, observability, and feature completeness.** The existing implementation should be repaired incrementally rather than rebuilt.

## 2. Scope and inspection method

The inspection covered the complete checked-out repository structure, application router, page and component inventory, Supabase client and generated types, SQL migration history, RLS policies, Edge Functions, environment/deployment configuration, build scripts, dependency manifests, test files, and recent Git history. A disposable copy was used for dependency installation and health checks so the inspected repository itself remained unchanged. The local application was also smoke-tested in a browser at the homepage, `/estimate/demo`, the structural estimate tab, and `/upload`.

The repository is private, uses `main` as its default branch, and currently exposes only a Dependabot workflow through GitHub. The repository contains a Vercel SPA rewrite, but no CI workflow that runs the application’s quality gates. The audit did not claim successful production deployment verification because the repository alone does not provide the current Vercel deployment result or a deployment-specific URL.

## 3. Current architecture

| Layer | Current implementation | Assessment |
|---|---|---|
| Frontend | React 18, TypeScript, Vite 5, React Router 6, Tailwind CSS, Radix/shadcn-style UI, Recharts, Three.js, jsPDF, SheetJS | Mature single-page frontend with many modules, but large bundles and weak type discipline |
| State and providers | React context for auth, theme, i18n, PWA; TanStack Query client is initialized but most data fetching is direct Supabase calls | Functional but inconsistent; query caching is largely unused |
| Authentication | Supabase Auth with persisted browser session; email/password signup/sign-in and Lovable-mediated Google OAuth | Session lifecycle is simple and sound at a high level; route protection is page-by-page rather than centralized |
| Data layer | Supabase Postgres accessed from the browser through the publishable key; generated database types exist but many calls use `as any` | RLS is the primary security boundary; several policies need hardening |
| Storage | Supabase Storage for avatars and project documents; signed URLs are created on demand | Project document access is mostly membership-scoped, but upload validation and lifecycle controls are incomplete |
| AI | Three Supabase Edge Functions: `ai-analyze`, `ai-chat`, and `ai-structured`, forwarding to Lovable’s AI gateway with Gemini models | The boundary exists, but authentication, CORS, rate/usage controls, payload validation, and result validation are insufficient |
| Deployment | Vercel rewrite to `/index.html`; PWA generated by `vite-plugin-pwa`; README still identifies a Lovable live app and editor | SPA hosting is configured, but domain/deployment documentation is inconsistent and CI is absent |
| Database evolution | Timestamped Supabase SQL migrations and generated `types.ts` | Broad schema coverage and meaningful RLS, but migrations contain hard-coded admin bootstrap logic and policy drift |

The top-level composition wraps the application in `QueryClientProvider`, i18n, theme, PWA, auth, tooltip, toast, and browser-router providers. Routes are lazy-loaded, which is appropriate for the application’s size. The route table and the coming-soon fallback are centralized in [`src/App.tsx`](https://github.com/zobaerio/CivilOS-AI/blob/main/src/App.tsx#L52-L108) [2].

The browser Supabase client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, persists the session in `localStorage`, and enables automatic token refresh. This is a normal SPA pattern, but it means all real authorization must be enforced by Supabase RLS and Edge Functions rather than by hidden UI controls [4].

### Package and dependency inventory

| Category | Packages found | Audit conclusion |
|---|---|---|
| Framework/runtime | React `18.3.1`, React DOM `18.3.1`, Vite `5.4.19`, TypeScript `5.8.3` | Coherent current major-version set; do not jump to React 19, Vite 8, or TypeScript 7 without a separate compatibility branch |
| Routing | `react-router-dom 6.30.1` | Keep React Router 6 for now; the patch update to 6.30.6 is lower risk than the major 7.x line, but should follow regression tests |
| UI and styling | Radix UI primitives, shadcn-style local components, Tailwind CSS `3.4.17`, `tailwindcss-animate`, `class-variance-authority`, `lucide-react` | Existing UI system is broad but consistent enough to preserve; lint errors in shared UI components should be fixed before refactoring |
| Supabase and auth | `@supabase/supabase-js 2.105.1` in the manifest, `@lovable.dev/cloud-auth-js 1.1.2` | Existing Supabase Auth plus Lovable OAuth bridge; no second auth system is needed |
| AI/markdown | No standalone OpenAI SDK; `react-markdown 9`, `rehype-highlight 7`, Lovable AI Edge Functions | AI requests are server-proxied through Edge Functions; input/auth/usage hardening is more urgent than SDK replacement |
| PDF/document export | `jspdf`, `jspdf-autotable`, `docx`, `file-saver` | Functionality is present; these are among the largest chunks and should be lazy-loaded later |
| Excel/CSV | `xlsx 0.18.5`, `file-saver`, native CSV generation | `xlsx` has a high-severity audit finding; update or replace only after export regression tests |
| Charts/3D | `recharts`, `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` | Valuable for current estimate views but expensive to ship eagerly |
| PWA | `vite-plugin-pwa 1.3.0` | Existing service-worker generation should be preserved; lockfile and precache behavior need CI/deployment testing |
| SEO | `react-helmet-async` plus local `SEO.tsx` and static metadata | No separate SEO SaaS package; central helper is adequate after domain/legal-route reconciliation |
| Billing/payments | No payment SDK; local manual provider abstraction for bKash/Nagad/bank transfer | This is intentionally manual today; do not add a gateway or duplicate billing system without approval |
| Email | No email SDK or email Edge Function found | Signup email behavior is delegated to Supabase Auth; invitations currently create/copy links rather than send email |
| Testing/tooling | Vitest, Testing Library, jsdom, ESLint 9, `typescript-eslint` | Existing tests are useful but narrow; lint currently fails and must become a CI gate |

The dependency graph contains many patch/minor updates available, including Supabase JS, Vite 5.4.21, React Router 6.30.6, TypeScript 5.9.3, Recharts, Radix primitives, and related tooling. It also reports major-version candidates such as React 19, Vite 8, Tailwind 4, TypeScript 7, React Router 7, Zod 4, Three 0.185, and `xlsx` newer than the existing major line. **No major dependency upgrade should be performed as part of the initial hardening work.** The existing `package-lock.json` is already out of sync with `package.json`, so lockfile repair must be handled as a reproducibility task rather than combined blindly with broad version upgrades [16] [17] [18].

## 3A. Routing and authentication audit

The route system is a React Router 6 `BrowserRouter` with a Vercel catch-all rewrite. Public routes include `/`, `/upload`, `/estimate/demo`, `/about`, `/contact`, `/auth`, `/sponsor`, and `/share/:token`. Signed-in workspace routes include `/dashboard`, `/projects`, `/projects/:id`, `/ai-assistant`, `/ai-engineer`, `/boq-hub`, `/rate-analysis`, `/file-assistant`, `/site-diary`, `/profile`, `/notifications`, `/settings/notifications`, `/affiliate`, `/billing`, and `/invite`. Admin routes are `/admin`, `/admin/affiliate`, and `/admin/billing`. `/boq` and `/tender` are exposed as calculation/AI routes but do not consistently enforce auth or plan access. Twenty-three additional routes are deliberately mapped to `ComingSoonPage` [2] [11].

The Vercel rewrite supports direct document requests for client-side routes, and the local public-route smoke tests succeeded for `/estimate/demo` and `/upload`. However, clicking and refresh behavior is not equivalent to authorization behavior. Existing protection is implemented inside individual pages with `useEffect` redirects instead of a central route boundary. `AffiliatePage`, `NotificationSettingsPage`, `NotificationsPage`, `ProjectDetailPage`, and `TenderAnalysisPage` use auth context without consistently redirecting unauthenticated users. `ProjectDetailPage` can remain in its loading state while auth is unresolved or absent, and `/boq` has no auth context at all. These should be normalized with a shared `RequireAuth` wrapper while preserving the public demo and shared-estimate routes.

Authentication currently uses Supabase Auth for email/password signup, password login, persisted sessions, logout, and an auth-state listener. Google OAuth is mediated by `@lovable.dev/cloud-auth-js`; when the external flow returns tokens directly, the bridge stores them in Supabase with `setSession`. There is **no password-reset flow** in the inspected source, and no separate callback page; the `/auth` route relies on the Supabase session listener to complete the return path. The signup flow uses a domain-dependent `emailRedirectTo` and Google OAuth `redirect_uri` based on `window.location.origin`, which is appropriate only if every intended domain is present in Supabase Auth’s allowed redirect URL configuration. The `safeRedirect` helper blocks protocol-relative redirects, which is a good local defense, but it should be covered by tests.

The principal auth risks are configuration and enforcement consistency rather than a need for a new auth system. The production domains currently differ in deployment identity, so all approved origins must be explicitly registered or unsupported domains must redirect to one canonical origin. Expensive AI endpoints and plan-gated routes must validate the Supabase access token and entitlements server-side; browser-visible publishable keys are not authorization credentials.

## 4. Feature inventory and status

The following status distinguishes what is visibly implemented in source and local rendering from what is fully production-validated. “Implemented” does not mean that authorization, domain accuracy, or end-to-end integration is complete.

| Area | Current state | Status | Main evidence or concern |
|---|---|---|---|
| Public marketing site | Homepage, navigation, pricing, features, FAQ, ratings, sponsors, contact, theme/language controls | Working locally | Homepage rendered successfully; several footer links are not declared routes |
| Upload and estimate flow | File picker/drop area, manual dimensions, district selector, project inputs, estimate navigation | Working locally with limitations | PDF/DWG/DXF claims exceed what the current client/AI payload path actually sends |
| Deterministic estimate engine | Area, cost categories, material/labor, finishing, utilities, timeline, quotation, recommendations | Implemented | Needs domain validation and stronger unit/assumption transparency |
| Structural analysis | Seismic zone, soil, importance factor, D/L/W/E values, combinations, beam/column/slab status | Renders, but high risk | Simplified heuristics are presented as “100% Fully Compliant” and “Safe” in the demo UI |
| Rebar/BBS | Rebar tab exists in the estimate workspace | Partially implemented | Dedicated `/bbs` route is a coming-soon stub |
| BOQ Generator Lite | AI-generated JSON BOQ with CSV and export controls | Implemented, not secured | `/boq` has no auth context or feature/usage enforcement |
| BOQ & Quantity Hub | Manual/AI BOQ items, measurements, history, duplicate, save, versioning, PDF/XLSX/CSV exports | Implemented | Saved data is stored inside `projects.estimate`; update path relies on client-controlled project ID plus RLS |
| Rate Analysis | Dedicated page and project merge path | Implemented, needs validation | Uses localStorage for drafts and broad `any`/`@ts-ignore` patterns |
| AI Engineering Chat | Signed-in route with local chat history and streamed response parser | At risk of broken integration | Direct fetch sends the publishable key as `Authorization`, not the user access token; the function’s default JWT behavior should be verified |
| File AI Analyzer | Signed-in wrapper and `ai-analyze` function | Partially implemented | Images can be sent as data URLs; PDFs/DWG/DXF generally send metadata only unless text extraction occurs elsewhere |
| Tender Analysis | AI JSON summary, risks, deadlines, BOQ extraction, save | Implemented, not secured | No page-level auth redirect or plan/usage enforcement; edge function has no result schema validation |
| Projects | Create/list/detail, project metadata, saved estimates | Working with RLS | Dashboard recent-project cards incorrectly link to `/projects` instead of `/projects/:id` |
| Collaboration | Project roles, members, invitations, documents, activity log | Implemented | UI and database policies are meaningful; invitation and activity side effects are not transactional |
| Site Diary | Dedicated signed-in page and `site_logs` table | Implemented, needs validation | No broad end-to-end test coverage observed |
| Notifications | Notification table, bell/settings pages, realtime publication migration | Implemented, needs validation | Some page-level guard patterns are inconsistent |
| Billing | Free/starter/professional/business plans, manual bKash/Nagad/bank payment submission, admin verification | Implemented but unsafe | Subscription and usage RLS permit client-controlled fields; approval is not an atomic server workflow |
| Admin | Admin dashboard, sponsor/rating/message/project/profile views, WhatsApp reply, billing verification | Implemented | Admin UI checks exist, but sensitive operations depend on browser calls and RLS policy correctness |
| PWA | Manifest, service worker, install prompt, update notification | Implemented | Production-only registration and 4.2 MB precache need explicit deployment testing |
| Placeholder modules | AI Writer, Drawing, BBS, material calculator, procurement, finance, analytics, reports, company settings, and others | Not implemented | Central `ComingSoonPage` confirms 23 routes are placeholders [11] |

## 5. Route and product-surface audit

The application has a clear core route set for the public site and signed-in tools. However, the product surface advertises considerably more functionality than is currently available. The router maps the following groups to a generic coming-soon page: AI Writer, AI Drawing, BBS, Material Calculator, Progress Reports, Inspections, Site Photos, Tender Documents, Bid Preparation, Inventory, Requisitions, Purchase Orders, Vendors, Equipment, Invoices, Contractor Bills, Payments, Cash Flow, Analytics, AI Insights, Reports, and Company Settings [2] [11].

There are concrete navigation mismatches. `DashboardPage` exposes a “New Invoice” quick action to `/invoices`, but that route is a placeholder rather than an invoice workflow. Its recent-project cards all navigate to `/projects`, so clicking a specific card does not open that project’s detail route. The shared footer links to `/faq`, `/privacy`, and `/terms`, but those routes are not declared in `App.tsx`; they therefore resolve to the not-found page under the client router. The footer’s copyright symbol also serves as a hidden admin entry point, which is intentional in the original product brief but is not a strong production access pattern.

Feature locks are currently mostly **visual metadata** in the sidebar. The `feature` values in navigation determine whether a lock icon is shown, but several pages can still be opened directly by URL, and the core AI/BOQ/Tender paths do not consistently call a central plan/usage gate. Product entitlement must be enforced at the server boundary, not only through navigation visibility.

## 5A. Supabase schema, RLS, and project/team audit

The repository is bound to Supabase project `qtvwjjcyvswjwzymknlg.supabase.co` through the existing `VITE_SUPABASE_URL` configuration. The browser client uses the publishable key, persists sessions in local storage, and relies on database RLS and Edge Functions for all meaningful authorization. No service-role credential was found in the frontend source.

### Database object inventory

| Domain | Existing objects | Key relationships and observations |
|---|---|---|
| Identity | `profiles`, `user_roles`, `app_role` enum | `profiles.id` references `auth.users`; current app roles are `admin` and `user`; admin eligibility is additionally restricted to two hard-coded email addresses in `has_role` |
| Projects | `projects`, `project_members`, `project_role` enum | `projects.user_id` is the implicit owner/admin; members are unique per `(project_id,user_id)` and currently support `admin`, `engineer`, and `viewer` |
| Collaboration | `invitations`, `project_activity`, `project_documents` | Invitations use random tokens and seven-day expiry; documents are project-scoped; activity is member-readable and member-insertable |
| Notifications | `notifications`, `notification_settings` | Notifications are user-owned; the notifications table is added to Supabase realtime publication |
| Estimation/workflow | JSON fields on `projects`; `site_logs`; `tender_analyses` | Current estimate/BOQ data is stored largely in JSON on project rows rather than separate normalized estimate tables |
| Commercial | `plans`, `subscriptions`, `payments`, `usage_records` | Plans are publicly readable; subscription/payment/usage state is browser-visible and needs server-authoritative mutation controls |
| Growth/admin | `ratings`, `sponsors`, `contact_messages`, `referrals`, `withdrawals` | Public ratings/sponsor/contact submissions exist; admin and owner policies govern management, but financial request validation is limited |
| Storage | `avatars`, `project-documents` buckets and `storage.objects` policies | Avatars are public-read; project documents are membership-readable, engineer/admin-uploadable, and admin-deletable at the storage-policy level |

The migration history also defines `set_updated_at()` triggers on mutable business tables, the `handle_new_user()` auth trigger, and security-definer helper/RPC functions: `has_role`, `get_project_role`, `is_project_member`, `accept_project_invitation`, and `decline_project_invitation`. The generated Supabase TypeScript types agree with the current vocabulary: project roles are `admin | engineer | viewer`, while global roles are `admin | user`. There is no current `member` enum value; the requested future `Member` role should be mapped deliberately, likely to the current `engineer` or to a new role only after an impact review.

### RLS assessment

The important ownership and membership policies are generally present. Profiles are owner-readable and owner-updatable; projects are owner-readable/mutable, with later policies extending project reads to accepted members; project members are readable by accepted members and manageable by project admins; documents are member-readable and engineer/admin-uploadable; activity is member-readable and requires the inserting user to equal `auth.uid()`; invitations are admin-managed while valid pending invitations are visible to the matching JWT email; and invitation acceptance/decline is performed through authenticated security-definer RPCs that validate token, expiry, and invitee email [25] [26].

The RLS design is therefore a **good foundation, not a complete authorization model**. Several tables grant broad authenticated DML before narrowing policies, making policy review and explicit column restrictions important. `notifications` permits a user to insert, update, and delete their own notifications, so a user can manufacture or erase their personal notification history; if notifications are intended to be system-generated, inserts/deletes should move to trusted functions. `referrals` and `withdrawals` allow client-side creation of financial records with no strong database constraints for amount, method, account format, or state transitions. `project_members.user_id` and `invited_by` are not foreign keys to `auth.users`, which weakens referential integrity. Several status columns are free-form text rather than constrained enums or check constraints.

The key IDOR/BOLA paths were checked against both the UI and policies. Project reads use the project ID plus owner/member RLS; document reads and storage downloads are project-member scoped; document deletion was tightened in the latest migration to require project admin or the current uploader who is still a project member; invitation acceptance checks the authenticated email; and member removal is subject to the admin policy on the target project. These controls should be verified with adversarial integration tests using two users and two projects before any production migration is approved.

### Existing project/team lifecycle

Projects are created directly from the browser with the authenticated user’s `user_id`; the creator is treated as an implicit admin through `get_project_role`, so no separate owner membership row is required. The project detail page loads the project, resolves the owner/member role, and loads project documents, members, pending invitations, and recent activity. Admins can invite a normalized email with `admin`, `engineer`, or `viewer` role; the current delivery mechanism is a copied tokenized URL, not email. A unique partial index limits one pending invitation per project/email pair, and the latest migration adds expiry, accepted-by, and send-time fields.

An authenticated invitee may view a valid pending invitation only when the invitation email matches the current JWT email. Acceptance uses the security-definer `accept_project_invitation(_token)` function, which locks the invitation row, validates authentication, token, status, expiry, and email, upserts the member as accepted, marks the invitation accepted, and inserts a notification for the inviter. Decline uses a similarly restricted RPC. Admins can cancel pending invitations, remove members, and change project status from the workspace UI; the database policies—not the UI role flags—must remain the final authority.

The current team model is close to the requested role model but not identical. The implicit project owner and current `admin` role cover **Owner/Admin**; `engineer` is the closest existing elevated working role; `viewer` covers read-only access; and there is no explicit general **Member** role. A future role mapping should be documented and migrated only if product semantics require the distinction. No second team or invitation system should be introduced.

### Secure invitation audit

The existing invitation token is generated by PostgreSQL as `encode(gen_random_bytes(24), 'hex')`, providing 24 random bytes / 192 bits of entropy. It is not based on an ID, timestamp, email, project ID, or simple hash, so the generation method meets the entropy requirement. The current table stores the token in reusable plaintext because the acceptance RPC looks it up directly. A future hash-at-rest design is possible, but it must be introduced with a safe one-time migration strategy that preserves every existing pending link or deliberately invalidates and resends them; it should not be performed casually on production data.

The database currently has `pending`, `accepted`, and `rejected` transitions. Cancellation is implemented by deleting the invitation row from the project UI, and expiration is represented by `expires_at` while the status remains `pending`; there are no enforced `cancelled` or `expired` status values. The latest acceptance and decline RPCs enforce authentication, exact invitee email, pending status, and `expires_at > now()` on the server, so manually changing frontend state cannot accept an expired invitation. The remaining status-model work is to decide whether to preserve the current delete/implicit-expiry behavior for compatibility or add explicit status transitions with a migration and updated policies.

There is no resend implementation and no real email provider integration. The current UI creates the invitation row, copies a URL to the inviter’s clipboard, and reports that a secure invite was created; it does not send an email. Therefore, a production-ready implementation should add a server-side email function only after the provider, verified sender domain, secret name, retry/idempotency policy, and allowed application origins are approved. The UI should distinguish record creation, provider acceptance, and delivery failure, and `sent_at` / `last_sent_at` should be updated only after the provider response is successful. No email was sent during the audit.

For existing accounts, the current acceptance path is directionally correct: the invitee is routed to `/auth` when logged out, the token is kept in the `redirect` query parameter, the invitation row is read only when RLS matches the authenticated email, and the acceptance RPC derives the role from the invitation row rather than trusting a frontend role. For new accounts, password signup also carries the redirect through `emailRedirectTo`. However, the Google OAuth callback currently hardcodes `${window.location.origin}/auth` and does not carry the original `redirect=/invite?token=...` state. A new invitee who chooses Google sign-in can therefore return to `/auth` and be sent to `/dashboard`, losing the invitation token. This is a concrete auth-flow defect that must be fixed by preserving a safe state/redirect value through the existing OAuth bridge, not by adding a second authentication system.

The current `accept_project_invitation` function is effectively atomic because it runs as one PostgreSQL function transaction: it locks the invitation row, checks authentication/email/status/expiry, upserts membership, marks the invitation accepted, and inserts the inviter notification. A failure in a critical statement should roll back the function’s database changes. Foreign keys also ensure the referenced project exists. The function prevents second use because it requires `status = 'pending'` and then sets `status = 'accepted'`, `accepted_at`, and `accepted_by`; subsequent attempts return the same generic invalid/expired error path rather than accepting again. This behavior should be retained and covered by adversarial tests.

The existing partial unique index prevents two `pending` invitations for the same project and normalized email, but it also means an expired invitation that remains `pending` can block a replacement until it is deleted. The UI has no resend action, no server-side resend throttling, does not rotate tokens, and does not display `expires_at`. Cancellation currently deletes the invitation instead of preserving a `cancelled` audit record. Rejection is implemented through the secure RPC and invalidates the token by changing status to `rejected`, but the project UI exposes only pending invitations and does not present accepted, rejected, cancelled, or expired history. The smallest compatible upgrade is to add server-side lifecycle operations and clear status rendering while preserving the current acceptance RPC and avoiding destructive cleanup of invitation history.

Error handling is currently too coarse for production: the invite page collapses missing, expired, wrong-email, cancelled, rejected, and already-accepted cases into generic not-found or database messages, while the project page surfaces raw Supabase errors. There is no explicit email-delivery failure state or retry path. Invitation activity currently logs only `member_invited`; acceptance is logged indirectly through a notification, and sent, resent, cancelled, rejected, and delivery-failure events are not recorded. The existing activity policy can support safe event records, but full tokens and unnecessary invitee secrets must never be written to `details`.

The repository contains engineering tests but no invitation-specific tests. The required matrix therefore needs database/RPC tests for owner/admin authorization, engineer/member/viewer role integrity, cross-project IDOR resistance, wrong-email rejection, expiry, cancellation, duplicate prevention, resend, token reuse, and atomic rollback, plus integration tests for both existing and new users. Real provider delivery should be tested with a sandbox/test recipient or provider mock that verifies success and failure semantics without sending uncontrolled production mail.

### Pending-approval implementation design

The safest incremental design is to retain the existing `invitations`, `project_members`, `project_activity`, `notifications`, `accept_project_invitation`, and `decline_project_invitation` structures, then add narrowly scoped server-side lifecycle operations. Invitation creation, cancellation, resend, and acceptance should be callable only through authenticated RPCs or a server-side function that rechecks project-admin authority; the browser must not be able to choose a different inviter, project, role, or user identity by changing its payload. The existing acceptance RPC should remain the transaction boundary for membership creation and acceptance state.

Because an external email provider cannot participate in the same PostgreSQL transaction, delivery should use an explicit two-step state model: create or claim a valid pending invitation server-side, attempt delivery from a server-side function, and update `sent_at`/`last_sent_at` and a safe delivery result only after the provider reports success. On failure, the invitation remains pending, an audit event records a sanitized failure category, and the UI offers retry/resend. This avoids falsely claiming delivery while keeping a valid invitation usable. Resend must be permission-checked, rate-limited using the existing timestamps or a minimal additional field, and should rotate/invalidate the token only if the migration and email retry semantics are approved.

| Email approach | Tradeoffs | Cost | Setup complexity |
|---|---|---|---|
| **Resend through an existing Supabase Edge Function** | Best fit for branded HTML plus plain text; provider key stays server-side; requires verified sender domain and provider configuration; external delivery is not transactionally atomic with the database | Provider usage-based/free tier subject to current Resend terms | Medium |
| **Another transactional provider through the same server-side function** | Preserves the same security boundary and lifecycle design; adds vendor-specific template, domain, and error handling | Provider-dependent | Medium to high |
| **Retain copied-link delivery as a fallback only** | No provider secret or setup, but it does not satisfy real email delivery and should never display “email sent” | No provider cost | Low |

The canonical invitation URL should be generated from a server-side `APP_URL` or approved deployment configuration, not from an arbitrary browser origin. Based on the read-only domain audit, `https://civilosai.pro.bd` is the active Vercel custom-domain candidate, but it must be explicitly confirmed in deployment configuration before being used as `APP_URL`. `RESEND_API_KEY`, `MAIL_FROM`, and `APP_URL` must be configured only in the server-side environment; no values should be invented or placed in `VITE_*` variables.

The adversarial release gate will attempt to alter `project_id`, `invited_email`, role, token, status, user ID, frontend state, URL parameters, local storage, and direct API payloads. Each attempt must fail or be ignored at the server boundary. The release matrix includes creation by owner/admin versus engineer/member/viewer, exact role preservation, existing-user acceptance, new-user signup plus acceptance, Google OAuth token preservation, wrong-email rejection, expired/cancelled/rejected/accepted-token rejection, project deletion handling, duplicate pending prevention, resend throttling and delivery outcome, cancellation history, token reuse failure, cross-project IDOR resistance, atomic rollback, storage/log privacy, and full regression of the current project workspace. Production readiness cannot be claimed until these checks pass with a configured provider or an explicitly isolated delivery test environment.

## 6. Authentication, authorization, and security findings

### P0 — Paid-plan self-upgrade and quota manipulation are possible through current RLS policies

The subscriptions table grants authenticated users an insert policy described as “Users create own free subscription,” but the policy only checks `auth.uid() = user_id`; it does not restrict `plan_id` to the free plan or `status` to a safe initial value. The user update policy checks ownership and allows `status` in `('cancelled','active')`, but does not prevent the owner from changing `plan_id`, billing cycle, renewal date, or payment-provider fields. An authenticated user can therefore potentially assign their own paid plan through a direct Supabase update, bypassing the manual verification flow [10].

The usage table has similar policy weakness. Authenticated users may insert and update their own usage row, with no server-side constraint that counters can only increase through trusted functions, that values cannot be negative, or that the period is the current billing period. The application currently reads usage but does not show a corresponding server-side counter-increment implementation. This means the displayed plan limits are not a reliable entitlement or quota boundary [12].

**Required treatment:** revoke client update/insert access for subscription state except a narrowly validated free-subscription creation path; move activation, cancellation, renewal, and usage increments into security-definer RPCs or authenticated Edge Functions with explicit authorization, validation, idempotency, and audit records.

### P0 — Public AI analysis endpoint and wildcard CORS create abuse and privacy exposure

`supabase/config.toml` explicitly sets `verify_jwt = false` for `ai-analyze`. The function accepts an image data URL or up to 60,000 characters of text, uses wildcard `Access-Control-Allow-Origin: *`, and does not authenticate the caller, enforce a plan, consume usage, validate file size/mime type, or bind a request to a project or user. The client also displays a 20 MB upload promise, while the edge function has no equivalent payload-size enforcement [9] [15].

`ai-chat` and `ai-structured` similarly accept broad untrusted input and rely on the platform/default invocation boundary rather than performing explicit identity and entitlement checks inside the function. `AIAssistantPage` uses a hand-built fetch call with the publishable key in the `Authorization` header instead of obtaining the current Supabase access token or using the shared function invocation path. This should be tested against the deployed function configuration; it is a likely cause of chat failures when JWT verification is enabled.

**Required treatment:** require and verify a user JWT in every paid/expensive function; use an origin allowlist; impose byte and text limits; validate JSON with schemas; add server-side usage reservation/increment; redact logs; and return generic errors without leaking configuration details.

### P0 — Admin bootstrap contains hard-coded identities and a first-user privilege rule

The signup trigger grants `admin` to the first account and to a hard-coded list of email addresses. This is fragile and dangerous in a production project because the first user in a new or reset database receives administrative privileges, and account identity is embedded in migration history. Administrative assignment should be an explicit, audited, one-time operation performed by an operator or deployment procedure [8].

### P1 — Tracked `.env` file and configuration hygiene

The repository tracks a file named `.env`. The scan did not find a service-role key or private-key material in source, and the known frontend variables are publishable by design; nevertheless, tracking `.env` is unsafe operational practice and makes accidental secret introduction likely. The file should be removed from version control after its contents are reviewed, any real secret is rotated, and deployment variables are managed through Vercel/Supabase configuration. The `.gitignore` policy should explicitly prevent future environment files.

### P1 — Project storage and collaboration controls are directionally good but incomplete

Project and document RLS policies correctly attempt to scope reads to owners or accepted project members, allow document insertion for admin/engineer roles, and restrict document deletion to the uploader or project admin. This is a solid foundation [13]. The UI, however, does not validate file size or actual type before upload, creates a one-year signed URL unnecessarily during upload and ignores the returned value, and logs collaboration side effects in separate calls. A transactional project-service layer would make upload metadata, activity, notifications, and failures consistent.

### P1 — Manual billing verification is not atomic or fully validated

The admin billing page loads all visible payment rows and calls browser-side billing methods. RLS does restrict payment updates to admins, which is valuable, but `approvePayment` does not verify that the payment is still pending, that its amount matches the selected plan and billing cycle, that the plan is active, or that a subscription update and payment verification succeed atomically. A retry or partial failure could leave inconsistent payment/subscription states [14].

## 6A. Billing, PWA, and SEO audit

### Billing and subscription root-cause analysis

The billing system is not currently domain-driven. The browser sends the authenticated Supabase user ID when creating a pending payment, and the subscription hook queries `subscriptions` and `usage_records` by `user.id`. The billing service contains no `APP_URL`, origin allowlist, domain lookup, or domain-based user matching. `window.location.origin` is used for OAuth/invitation redirects elsewhere, not as the billing identity [14].

The verified domain behavior points to **deployment-version/configuration divergence rather than a domain-based billing algorithm**. `civilosai.lovable.app` serves a 200 response through Lovable/Cloudflare with bundle `index-DlWf9A0U.js`; `civilosai.vercel.app` redirects to `civilosai.pro.bd`, and both serve the same byte-identical Vercel HTML with bundle `index-DnWflIDF.js`. The Lovable and Vercel bundles differ, although both reference the same Supabase project host. `estimateai.pro.bd` returns `DEPLOYMENT_NOT_FOUND`, so an auth or payment redirect that lands there can fail even though the billing data is stored in the shared Supabase project.

The likely root-cause chain for reports that billing behaves differently by domain is therefore: the user reaches different build versions; each build may have different environment values or feature code; Supabase Auth redirect allowlists may not include every origin; the admin check depends on the authenticated email and the hard-coded allowed admin addresses; and the manual payment approval path performs several browser-side mutations without an atomic transaction. It is **not** currently supported by source evidence that payment rows are keyed by hostname. The correct fix is to reconcile deployment provenance and allowed auth URLs, then harden the authenticated server-side payment workflow—not to patch frontend domain conditionals.

### PWA audit

The PWA is implemented once and is wired from `src/main.tsx` through `PwaProvider`, `registerPwa.ts`, `InstallCivilOS`, `UpdateAvailable`, and `vite-plugin-pwa`. The manifest uses standalone display, `/dashboard` as the start URL, `/` scope, 192px/512px maskable icons, theme/background colors, and business/productivity categories [27]. Production registration is gated to top-level production hosts and is disabled for development, preview/Lovable preview hosts, iframes, or `?sw=off`. The service worker uses generated precaching plus NetworkFirst navigation caching and CacheFirst same-origin script/style/image/font caching; it polls for updates hourly and on visibility changes [28].

Installability support is present for Chromium’s `beforeinstallprompt`, `appinstalled`, standalone detection, and iOS manual instructions. The install prompt is scoped to signed-in users and stores dismissal per user. This is a coherent existing implementation and should not be duplicated. The principal PWA risks are operational: the production build precaches 97 entries totaling approximately 4.2 MB; stale cached HTML/assets can preserve an older bundle during multi-domain rollout; `/dashboard` is a protected start URL that must gracefully redirect logged-out installs to `/auth`; and service-worker behavior must be tested separately on Lovable and Vercel/custom domains.

### SEO and indexing audit

The static HTML shell and shared `SEO.tsx` provide titles, descriptions, canonical links, Open Graph, Twitter card metadata, two JSON-LD blocks (`WebApplication` and `Organization`), favicon, Apple touch icon, manifest, and language alternates. The shared helper supports route-specific metadata and an explicit `noindex` option [29] [30]. Semantic headings and image alt text are present in the inspected public and workspace components, although the project should continue auditing decorative/admin images and dynamic social-image behavior.

Robots policy allows the site globally but disallows `/admin`, `/admin/affiliate`, `/invite`, `/share/`, `/profile`, and `/settings/`. The sitemap lists root, upload, modules, BOQ, rate analysis, tender, site diary, AI engineer, demo estimate, about, contact, and sponsor. This is inconsistent with the actual product: several sitemap entries are authenticated or placeholder routes and should not be promoted as public SEO pages; `/faq`, `/privacy`, and `/terms` are linked by the footer but missing from the router and sitemap; `/dashboard`, `/projects`, `/billing`, `/ai-assistant`, and other private routes are not explicitly disallowed by robots, although they are client-side protected. Because robots rules do not replace authentication, private pages need server/database protection plus `noindex, nofollow` metadata where they can render.

The largest SEO correctness issue is the hard-coded canonical domain `https://estimateai.pro.bd`, which currently returns Vercel `DEPLOYMENT_NOT_FOUND`, while the active public Vercel deployment is `https://civilosai.pro.bd` and the Lovable deployment uses the same canonical tag despite being a different host. The JSON-LD and social metadata also claim “real-time district-wise market rates” and “BNBC 2022 compliant” functionality that the audit found to be indicative or simplified. Canonical, Open Graph, Twitter, sitemap, and JSON-LD URLs should be aligned only after the production domain is explicitly confirmed.

## 7. Engineering and estimation correctness

The deterministic engine is useful as an estimate demonstrator and has meaningful unit tests, but it should not be represented as a code-compliance engine without a deeper validation program. The local demo rendered “100% Fully Compliant,” “All beams Safe,” “All columns Safe,” and “All slabs Safe.” The source implementation uses simplified assumptions and derived heuristics for loads, combinations, member checks, and quantities; these are suitable for preliminary planning only, not a structural design approval. The README itself correctly instructs that the AI must not claim 100% engineering accuracy without exact measurements, so the current UI language conflicts with the stated product requirement [1] [6].

The market-rate layer is not a live market integration. It uses hard-coded district base rates and a deterministic daily pseudo-random adjustment of approximately ±3%, while the UI describes the values as “live daily rates” and “automatically updated.” This should be relabeled as an indicative model until a real, timestamped source and an administrative override/audit trail exist [7].

The DXF parser supports a subset of LINE, LWPOLYLINE, and POLYLINE entities and classifies layers by naming heuristics. It does not constitute general CAD/OCR extraction. The File Assistant accepts images, PDFs, drawings, plans, and text in the interface, but `AIThinking` only embeds image data URLs; for many non-image files it sends the filename, MIME type, and optional text content rather than the actual PDF/DWG/DXF bytes. The product should either implement explicit extraction/upload pipelines or narrow its claims and show a confidence/unsupported-format state.

## 8. Build, test, dependency, and performance baseline

| Check | Result | Interpretation |
|---|---:|---|
| `npm ci` | Failed | `package-lock.json` is out of sync; the log reports missing packages and invalid versions, including `xlsx`, `react-markdown`, `vite-plugin-pwa`, and multiple Rollup/Babel dependencies |
| Disposable dependency install | Completed | `npm install` was used only in a disposable copy for health checks |
| `npm run build` | Passed | Vite transformed 4,791 modules and generated the PWA artifacts |
| Standalone TypeScript check | No diagnostics observed | The current compiler settings are not a substitute for lint/type strictness review |
| `npm test` | Passed | 2 test files, 13 tests passed; includes 12 engineering tests and one example test |
| `npm run lint` | Failed | 113 errors and 31 warnings |
| `npm audit --omit=dev` | 11 findings | 9 high and 2 moderate findings in the installed dependency graph |

The lint failures are systemic rather than isolated. They include broad `no-explicit-any` usage across pages and libraries, `@ts-nocheck` in `src/components/ui/chart.tsx`, outdated empty-interface patterns, ignored or incomplete React hook dependency arrays, ineffective `@ts-ignore` directives, and a forbidden CommonJS `require()` in Tailwind configuration. The repository currently has 47 `as any` occurrences, 35 `: any` occurrences, 16 `any[]` occurrences, and four generic `<any>` occurrences in the inspected source and function tree.

The production build also reports large chunks. Notable compressed-size contributors include the estimate page at approximately 241 KB gzip, the export component at approximately 205 KB gzip, a general chunk at approximately 185 KB gzip, the auto-table PDF plugin at approximately 138 KB gzip, the chart chunk at approximately 111 KB gzip, and the Three/engineering page assets. The PWA generated a precache containing 97 entries totaling approximately 4.2 MB. These are not immediate correctness failures, but they will affect first-load performance, mobile data usage, and update cost.

The dependency audit reported advisory exposure for React Router/@remix-run router, PostCSS, SheetJS `xlsx`, and transitive packages such as `brace-expansion`, `minimatch`, `nanoid`, `dompurify`, `glob`, and `yaml`. The direct `xlsx` and React Router findings should be prioritized because the application imports both in user-facing flows [16] [17] [18].

## 9. Deployment, SEO, and operational audit

The Vercel configuration contains the correct basic SPA rewrite: all requests are sent to `/index.html`. This should support direct client-side route loads, assuming the production project is actually using the repository’s `vercel.json` [19]. The local build produced a valid `dist` directory and PWA service-worker artifacts.

The deployment documentation is inconsistent. The README identifies `https://civilosai.lovable.app` as the live app and points to a Lovable editor, while `index.html` and `SEO.tsx` use `https://estimateai.pro.bd` as the canonical domain. The user’s deployment instruction refers to an existing Vercel project, but no Vercel deployment status is represented in the repository. Before production changes, the team should confirm the actual Vercel project, domain, environment variables, Supabase project, and Edge Function deployment target without changing any of them automatically.

SEO is implemented centrally, but the canonical URL is hard-coded to the root domain for every page and is combined with missing legal/FAQ routes. The static sitemap includes only a subset of routes, and robots rules disallow some workspace paths. Legal pages should be implemented before indexing claims are expanded, and authenticated/placeholder routes should remain excluded from search engines.

## 10. Prioritized implementation plan

### Phase 0 — Security containment before paid launch

The first phase should be narrowly scoped and should not change working estimation behavior. Harden subscription RLS so users cannot choose a paid `plan_id`, renewal date, provider, or active status. Restrict usage-record writes to trusted server-side functions and add database checks for nonnegative counters and valid periods. Add an idempotent server-side payment approval function that validates payment status, amount, plan, cycle, and active plan state before updating payment and subscription records in one transaction.

At the same time, require JWT verification for `ai-analyze`, add explicit auth checks inside all AI functions, replace wildcard CORS with the production origin allowlist, and enforce request-size, MIME, text-length, and response-shape validation. The AI functions should consume quota on the server and should not log uploaded content or sensitive identifiers. Replace the first-user/hard-coded-email admin bootstrap with explicit operator-controlled provisioning. Review the tracked `.env`, rotate any real secret found, remove it from Git history if necessary, and move configuration to managed deployment secrets.

**Exit criteria:** direct REST/RLS attempts to self-upgrade, alter usage counters, approve payments, invoke expensive AI anonymously, or submit oversized payloads are rejected; authorized flows pass with integration tests; no secret-bearing environment file remains tracked.

### Phase 1 — Delivery and quality stabilization

Choose one package manager for CI and local development. The lowest-friction choice is to regenerate and commit a correct npm lockfile because the README currently documents npm, although the repository also contains Bun lockfiles. Do not mix lockfiles in deployment. Add a CI workflow that runs install, type check, lint, test, and production build on pull requests and `main`.

Then reduce lint debt in descending risk order: remove `@ts-nocheck`, replace `any` at Supabase boundaries with generated `Database` types, repair hook dependency arrays, remove ineffective suppressions, and make error types explicit. Add a small shared data-access layer or typed hooks so page components do not repeatedly cast Supabase responses.

**Exit criteria:** clean reproducible install, zero lint errors, explicit TypeScript check in CI, tests passing, and a documented deploy command that matches Vercel.

### Phase 2 — Route and product-contract reconciliation

Implement or remove the `/faq`, `/privacy`, and `/terms` links; correct dashboard project-card links; remove or label the invoice quick action until invoices exist; and add a central `RequireAuth` and `RequireFeature` boundary for signed-in and plan-gated routes. Direct URLs must behave consistently with sidebar navigation. Keep the generic coming-soon page for intentionally deferred work, but update pricing, sitemap, marketing copy, and navigation so unavailable modules are not represented as completed capabilities.

Add route-level smoke tests for every declared route and every navigation target. Include authenticated and unauthenticated cases, direct refreshes, not-found cases, and project/member authorization cases.

### Phase 3 — AI and document-ingestion reliability

Fix the chat request path to use the current user access token or the shared Supabase invocation API. Build an explicit ingestion pipeline for supported formats: image vision input, PDF text extraction, plain-text parsing, DXF parsing with a confidence report, and a clear unsupported state for DWG/DOCX/XLSX until actual extractors are available. Enforce the same 20 MB limit in the browser and Edge Function, and show the user which bytes/content were analyzed.

Validate AI outputs with Zod or equivalent schemas before rendering or saving them. Store prompt/model/version/assumption metadata for saved AI results, but exclude raw sensitive documents from logs. Add retry, timeout, cancellation, and user-visible partial-failure states.

### Phase 4 — Engineering correctness and trust model

Reframe structural analysis as a preliminary screening result. Replace “100% Fully Compliant” and unconditional “Safe” labels with result states that show assumptions, input completeness, confidence, governing cases, and “requires licensed engineer review.” Create a domain-validation matrix for units, load combinations, seismic zones, wind assumptions, foundation logic, and material rates. Expand tests beyond happy-path arithmetic into property tests, unit conversions, boundary conditions, and golden fixtures reviewed by a qualified engineer.

Separate indicative market rates from authoritative rates. If real rates are introduced, store source, region, effective date, currency, and revision history; otherwise label the current deterministic model honestly.

### Phase 5 — Performance, observability, and remaining modules

Lazy-load PDF, XLSX, chart, and 3D dependencies by tab or feature rather than shipping them through the initial estimate path. Reduce the PWA precache to the shell and essential static assets. Add error tracking, structured function logs without document content, request IDs, AI latency/cost metrics, quota alerts, and admin audit logs.

Only after the core platform is secure and stable should the team implement the highest-value placeholder modules. The recommended order is invoices/payments/cash-flow, reports, procurement, site photos/inspections, BBS, AI Writer, and analytics, each backed by its own schema, RLS policy, usage accounting, tests, and route-level access control.

## 9A. Vercel, GitHub, environment, and security-baseline audit

### Deployment and GitHub

The repository has a single `main` branch with `origin` at `https://github.com/zobaerio/CivilOS-AI.git`. The checked-out commit is `c250a403c033bad34ac39d5f105d125890548c26`. The local repository contains only Dependabot and funding metadata under `.github`; there is no CI workflow that runs install, type check, lint, tests, or the production build. Recent history includes Lovable-generated changes and a version-update flow, so source-to-deployment provenance should be confirmed before treating a public bundle as the exact current `main` commit.

`vercel.json` contains only a catch-all SPA rewrite to `/index.html`. `package.json` defines `vite build` as the production build and does not specify a Vercel-specific output directory, so the default Vite `dist` output is expected. The configuration is sufficient for client-side deep links, but it does not define redirects, headers, security headers, branch selection, or environment values. The active Vercel public deployment was verified through HTTP headers and the custom-domain bundle, but the actual Vercel project settings, connected GitHub branch, build environment, and deployment dashboard status were not accessed or changed. These external settings remain an operational verification item.

### Environment-variable inventory

| Variable | Where it is expected | Classification and handling |
|---|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Tracked `.env` only | Public project identifier; do not rely on it for authorization |
| `VITE_SUPABASE_URL` | Tracked `.env`, Supabase client | Public browser configuration; currently points to `qtvwjjcyvswjwzymknlg.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Tracked `.env`, Supabase client | Publishable browser key; it is not a user/admin credential |
| `LOVABLE_API_KEY` | Supabase Edge Functions `ai-analyze`, `ai-chat`, `ai-structured` | Server-side secret reference; it must remain in Supabase function secrets and never be exposed through `VITE_*` variables |
| `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL` | Not referenced by the inspected source | Do not invent or add these unless a specifically approved server-side feature requires them |

The repository tracks `.env`, which is a hygiene risk even though the scan did not find a service-role key, private key, or actual secret value in the inspected source. Any real values in that file must be reviewed and rotated if necessary before removing the file from Git tracking. The frontend should continue to expose only publishable Supabase configuration; privileged Supabase credentials must never use a `VITE_` prefix.

### Security baseline summary

The scan found no hard-coded service-role key or private key material. The primary confirmed issues remain the subscription/usage RLS bypass, unauthenticated `ai-analyze` configuration, hard-coded admin bootstrap/identity rules, broad authenticated DML grants, and the lack of server-authoritative quota/payment transitions. URL-based values are used for invitation tokens, share tokens, OAuth redirects, and the PWA opt-out flag; these are acceptable only when backed by the existing token validation, safe redirect logic, and database policies. Direct URL access must not be treated as authorization.

Lower-severity hygiene findings include one affiliate `window.open` call without an explicit `noopener,noreferrer` feature, generated chart CSS inserted through `dangerouslySetInnerHTML`, broad use of `any`, and browser-side display of admin/payment data. These do not justify architectural replacement but should be addressed during the security and quality-hardening phase. The read-only scan did not modify production settings, disable RLS, access service-role data, or attempt destructive security tests.

## 9B. Admin authorization audit

The existing admin system uses the `user_roles` table and the `app_role` enum (`admin | user`). The main `/admin` page calls the security-definer `has_role(user.id, 'admin')` function before loading any admin data. The latest migration hardens `has_role` by requiring both an `admin` role row and a normalized email matching exactly `zobaerio24@gmail.com` or `zobaerhasan431@gmail.com`. The comparison uses `lower(trim(auth.users.email))` semantics, so case and surrounding whitespace are normalized, while plus-addresses, alternate domains, and near matches are not accepted. This is the correct server-side direction: changing profile fields, user metadata, URL parameters, local storage, or frontend state cannot create the required database role and approved email combination.

The migration history contains older bootstrap logic that assigned admin to the first user and, in one intermediate migration, referenced additional addresses including `zobaerhasan451@gmail.com` and `zobaerhasan43@gmail.com`. The current `has_role` allowlist supersedes those identities for privileged policy checks, but their historical `user_roles` rows may still exist and must be inventoried before any cleanup. The two approved addresses must not be revoked during remediation.

Admin routes are declared directly in `App.tsx` without a central route guard, so `/admin`, `/admin/billing`, and `/admin/affiliate` render their own authorization checks after the route loads. The main Admin Panel uses `has_role`, but `AdminBillingPage`, `AdminAffiliatePage`, and `DashboardSidebar` directly query `user_roles` for an `admin` row. This is an authorization-consistency defect. Historical migrations could have created a legacy admin row for the first registered user, and the direct queries may therefore show admin affordances to a stale or non-approved role holder even though the latest `has_role` function and RLS policies reject their privileged reads or writes. Database protection is stronger than the UI in the inspected paths, but all client checks should call the same email-aware helper to avoid misleading access and reduce information leakage.

The Admin Panel loads profiles, projects, ratings, sponsors, contact messages, and related identifiers only after the admin check. Admin Billing loads all visible payment rows and plans, then invokes the existing browser-side approval/rejection service. Admin Affiliate loads withdrawal records and can mark them approved/paid. The database policies are the final protection: admin-only reads and mutations use `has_role(auth.uid(),'admin')` in the inspected migrations. Nevertheless, approval and payout transitions remain non-atomic browser-side updates, and the UI exposes user IDs, transaction IDs, sender numbers, withdrawal account numbers, and payment details without a narrow purpose-specific projection or audit trail.

The safe hardening direction is to keep `user_roles`, `has_role`, and the existing admin pages, replace inconsistent raw `user_roles` checks with the canonical email-aware helper, add a shared route-level loading/denial pattern without duplicating authentication, and move payment approval/rejection and affiliate payout state transitions into narrowly scoped server-side RPCs with status/ownership checks. Any cleanup of legacy admin rows must be preceded by an inventory and explicit approval; the `has_role` email gate should remain the immediate protection.

### Required verification gates before release

Unauthorized-admin tests must cover direct navigation and refresh of `/admin`, `/admin/billing`, and `/admin/affiliate`; manipulated React state, local/session storage, URL parameters, and request bodies; direct reads and writes to protected tables; and direct calls to every privileged RPC or Edge Function. Each must fail safely without exposing protected records or allowing mutations. Authorized-admin tests must separately verify both `zobaerio24@gmail.com` and `zobaerhasan431@gmail.com` against the intended Admin Panel, billing, payment approval, subscription, affiliate, and existing administrative features, while confirming that plus-addresses, alternate domains, and near-match emails are denied.

Domain tests must run on each intended production origin for homepage, login, signup, auth callback, dashboard, billing, payment creation, admin visibility, and subscription state. The evidence must capture the Supabase project host, build revision marker, and authenticated user identity without printing secret values. Any unsupported or misconfigured domain must be reported as an external deployment/DNS/Auth configuration issue rather than papered over in frontend code.

After any approved implementation, the existing repository workflow remains mandatory: run install/build/type/lint/test checks, review only intended file changes, commit to the existing repository with a focused message, push the approved commit to `main`, allow the existing Vercel integration to deploy, and verify the deployed application and critical routes. No new Vercel project, production domain, or duplicate database may be created.

### Direct-access and payment verification findings

Direct navigation to `/admin`, `/admin/billing`, and `/admin/affiliate` does not itself grant database access. Each page performs a client-side check, and the protected table policies use `has_role(auth.uid(), 'admin')` for privileged reads or mutations. A malicious user can still load the route shell and issue direct requests, but the important database policies should deny admin-only rows and writes. The main residual risk is inconsistency: three UI surfaces check raw `user_roles` instead of the stricter email-aware helper, and privileged payment/payout mutations are browser-side sequences rather than dedicated server-side transactions.

Users submit payments through `BillingPage`, which passes `user.id` into the browser-side `paymentService.checkout`; the database RLS insert policy independently requires `auth.uid() = user_id` and `status = 'pending'`. Therefore, changing the submitted user ID through browser/API manipulation should not create a payment owned by another account, assuming the deployed database policies match the migrations. However, the service trusts client-supplied `plan`, amount, currency, billing cycle, payment method, transaction ID, and sender number; RLS does not verify that amount and plan agree with the current database plan. An attacker may be able to create a self-owned but financially false pending request, which is still an integrity issue and should be corrected by server-side plan lookup and validation.

Admin Billing reads all payment rows only after its UI check, and the database read policy allows the approved admin function to see them. Approval updates or creates a subscription and then marks the payment `verified`; rejection marks it `failed`. Both transitions are separate browser calls, do not require the payment to still be pending, do not validate plan/amount/status invariants, and do not provide atomic rollback or a payment audit event. A user-owned subscription can also be manipulated through the current RLS policies as documented in the P0 findings above. The subscription table has one row per user, references `auth.users` and `plans`, and stores status, billing cycle, start/renewal/cancellation dates, and provider metadata. The current UI recognizes active/trialing, cancelled, and expired-like states, but there is no database state machine enforcing valid transitions and no renewal worker or provider webhook path. Users can cancel their own row, while activation and other privileged changes are intended for admins; the ownership check is present, but the update policy does not restrict which columns an owner may change.

The intended payment transition is `pending` to `verified` or `failed`, but the implementation uses free-form text and does not record the approving administrator, approval timestamp, or a dedicated audit event. Admin authorization is enforced by RLS for payment updates, so an ordinary user should not approve another user’s payment directly. The remaining risk is that the approval service performs subscription activation and payment verification as separate browser calls, and neither call atomically checks that the payment remains pending or that its amount/plan/state is valid. A narrow server-side approval RPC is required before this can be called reliable.

The affiliate/referral system is also privileged. Users can view their own referrals and withdrawal history and request a withdrawal; admins can view and update withdrawals. The user page enforces minimum amount and available-balance checks only in the browser, while the database insert policy checks only `auth.uid() = user_id`. Amount, account format, available-balance calculation, and legal status transitions therefore need server-side validation. The admin affiliate page uses a raw `user_roles` admin check and then reads all withdrawals; its payout mutations should use the canonical admin helper and an audited state transition.

The existing Admin Panel lists profiles and projects but does not implement role editing, account deletion, ownership transfer, or subscription grants. This reduces the current mutation surface, but profiles/projects/payment/affiliate data are still sensitive and must remain protected by RLS. Any future user-management mutation must use dedicated server-side operations and explicit audit logging rather than exposing broad table DML to the browser.

### Cross-domain billing root cause

The source and public-bundle evidence does not show billing records keyed by hostname. Billing uses the Supabase-authenticated `user.id` for payment creation and subscription/usage reads, while admin queries read the shared Supabase project’s records. The two Vercel aliases (`civilosai.vercel.app` and `civilosai.pro.bd`) served the same HTML and byte-identical JavaScript bundle during the audit. `civilosai.lovable.app` served a different JavaScript build, but it still referenced the same Supabase project host. The `estimateai.pro.bd` domain returned Vercel `DEPLOYMENT_NOT_FOUND`.

Accordingly, when a payment is visible from one domain but not another, the most probable causes are not domain-based user identity but **different deployed code/configuration, an invalid or missing auth redirect origin, a session established against a different Supabase configuration in an older build, or an administrator using a different authenticated account**. The Vercel and Lovable builds must be compared for exact environment values and source revision in their respective deployment settings. The correct remediation sequence is to confirm one canonical Vercel deployment and Supabase project, align Supabase Auth redirect allowlists, verify the same publishable URL/key pair in every intended deployment, and ensure admin queries use the authenticated identity plus server-side `has_role`. No external Vercel, DNS, or Supabase settings were changed during this audit.

## 10A. Independent domain and deployment verification

The four listed domains were checked independently over HTTPS on 22 August 2026. These observations describe the public responses at audit time; they do not claim that any deployment has been fixed or that the domains are configured identically.

A fresh routing smoke test confirmed that the active Vercel custom domain and Lovable deployment return the SPA shell with HTTP 200 for `/`, `/auth`, `/dashboard`, `/projects`, `/billing`, `/admin`, `/admin/billing`, `/invite?token=invalid`, `/share/invalid`, and an unknown route. A follow-up check also returned HTTP 200 with the SPA shell for `/auth/callback` and both valid-format and unknown project-detail paths. The client router must still decide whether the route is authenticated, invalid, or not found after the shell loads. The Vercel catch-all rewrite is therefore functioning for deep-link delivery; it does not itself provide authorization. The same test reconfirmed that the Vercel custom domain uses `index-DnWflIDF.js`, Lovable uses the separate `index-DlWf9A0U.js`, and the custom domain’s static canonical tag still points to the unavailable `estimateai.pro.bd` host.

The existing Supabase `AuthProvider` correctly subscribes to `onAuthStateChange`, calls `getSession()`, persists the browser session through the shared client, and unsubscribes on cleanup. The authentication page’s password signup and sign-in flows are connected to the same Supabase project. Its `safeRedirect` function accepts only single-slash internal paths and rejects protocol-relative URLs, which is a sound open-redirect baseline. However, Google OAuth is mediated through the existing Lovable auth bridge with a redirect URI of `${window.location.origin}/auth`; it does not carry the original invite/dashboard redirect query. This explains the earlier invitation token-loss risk for Google sign-in and creates a domain-dependent callback requirement: every intended origin must be present in Supabase/Lovable/Google OAuth configuration, while callback state must preserve only a validated internal path.

`supabase/config.toml` explicitly sets `verify_jwt = false` for `ai-analyze`; the other AI functions do not have the same local override. This is an external-function authorization risk and must be reconciled with the function’s own bearer-token check before production use. The repository cannot verify the live Supabase Auth URL allowlist, Google OAuth authorized origins, Lovable bridge configuration, or Vercel environment variables; those are external actions to be inspected and verified in their respective dashboards, not guessed or silently changed.

The confirmed code-level OAuth defect is redirect-state loss, not a missing React route. `AuthPage` preserves internal redirects for password signup through `emailRedirectTo`, but its Google button always passes `${window.location.origin}/auth` to the existing Lovable auth bridge. It omits the current `redirect` query, so an invitee or other user who starts Google auth from a redirect-bearing URL may return to `/auth` without the original target and then be sent to `/dashboard`. The Google 404 report on non-Lovable domains is consistent with an origin not being registered in the external OAuth/Supabase configuration, with the state-loss defect making the user-visible result worse. The safe fix is to preserve a validated internal redirect through the existing OAuth callback and separately align the allowed origins/redirect URLs in Google, the Lovable bridge, and Supabase Auth; changing the router alone would not solve it.

The correct external configuration should have one confirmed Site URL/canonical application URL and an explicit allowlist for each intentionally supported origin, including `/auth` callback handling and any password-reset/signup redirect targets. Supabase documents that the Site URL is the default redirect target and that supplied redirect URLs must match the configured allowlist [24]. Google Cloud separately requires authorized JavaScript origins and exact authorized redirect URIs for web OAuth clients [25]. The list must be reviewed against the final domain policy because `estimateai.pro.bd` is currently unavailable. No dashboard configuration was accessed or changed during the audit.

The hard-coded-domain audit found `estimateai.pro.bd` in the HTML canonical/OG/structured-data metadata, `robots.txt`, and sitemap; `civilosai.lovable.app` in the README; and no hard-coded production domain in the authentication redirect code. `AuthPage`, invitation links, share links, and referral links use `window.location.origin`, which is appropriate for preserving the user’s current host only after the supported-origin policy is enforced. The one incorrect use is that Google OAuth passes the current origin but drops the internal redirect query. The source environment contract consists of the browser-exposed `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID`, plus `PROD` mode detection. A `.env` file is tracked by Git and contains those client variables; values were not printed in the audit report. No server-side `APP_URL`, `RESEND_API_KEY`, or `MAIL_FROM` is currently referenced. Even publishable client variables should be reviewed for repository hygiene, while privileged secrets must never be placed in `VITE_*` variables.

| Domain | Public response | Deployment evidence | Bundle / Supabase evidence | Audit conclusion |
|---|---|---|---|---|
| `civilosai.lovable.app` | HTTP 200 through Cloudflare/Lovable | Response included `x-deployment-id: ae3b8bba-d967-4bd2-8eae-3413efc29d20`; no Vercel server header | Bundle `index-DlWf9A0U.js`; references `qtvwjjcyvswjwzymknlg.supabase.co` | Active Lovable-hosted deployment candidate; bundle differs from the current repository build |
| `estimateai.pro.bd` | HTTP 404 | `server: Vercel` and `x-vercel-error: DEPLOYMENT_NOT_FOUND` | No HTML or bundle returned | The canonical domain configured in the repository is not currently serving the application at this hostname |
| `civilosai.vercel.app` | HTTP 307 to `https://civilosai.pro.bd/`, then HTTP 200 | Vercel response; redirected response used a Vercel cache and current deployment headers | Bundle `index-DnWflIDF.js`; references `qtvwjjcyvswjwzymknlg.supabase.co` | Vercel alias/redirect path to the custom `civilosai.pro.bd` deployment |
| `civilosai.pro.bd` | HTTP 200 | `server: Vercel`; same content length, ETag, last-modified timestamp, and bundle hash as the redirected `civilosai.vercel.app` response | Bundle `index-DnWflIDF.js`; references `qtvwjjcyvswjwzymknlg.supabase.co` | Active Vercel-hosted deployment candidate and likely target for the `civilosai.vercel.app` redirect |

The repository’s redacted `.env` and the public bundles for the two active candidates both identify the same Supabase project host, `qtvwjjcyvswjwzymknlg.supabase.co`. This is evidence that the Lovable and Vercel-hosted builds currently point at the same Supabase project, not evidence that their code or environment variables are identical. The Lovable bundle hash differs from the Vercel/custom-domain bundle hash, so they should be treated as separate deployment versions until their source commit and build provenance are confirmed. A follow-up byte comparison returned the same HTML SHA-256 and the same `index-DnWflIDF.js` source for `civilosai.vercel.app` and `civilosai.pro.bd`; the Lovable root served a different bundle and should not be treated as the same deployment.

The repository itself still documents `civilosai.lovable.app` as the live app, while its SEO metadata uses `estimateai.pro.bd` as the canonical domain and the public Vercel deployment currently serves `civilosai.pro.bd`. The first deployment-readiness task should therefore be an operational reconciliation of the Vercel project, custom domains, canonical URL, Lovable sync status, Supabase project, and environment variables. No domain, DNS, Vercel project, Supabase project, or production variable was changed during this verification.

## 11. Recommended first approved change set

If you approve implementation, the safest first change set is a contained security and build-hardening batch: database/RLS corrections for subscriptions and usage; a protected payment-approval function; explicit JWT/CORS/size validation for the AI functions; removal of tracked `.env` from version control after review; and CI/lockfile repair. It should not alter the estimate formulas, replace the current frontend, delete routes, or remove working export and project functionality.

Before that change set is started, the following operational facts should be confirmed: the canonical production domain, the actual Vercel project and build command, the Supabase project receiving the migrations, whether any tracked `.env` value has ever been used as a secret, and whether the current manual payment workflow must remain bKash/Nagad-based or is being replaced by a gateway.

## 12. Final approval request

The repository is now inspected and the implementation plan is ready. **Please approve Phase 0/Phase 1, or specify a narrower first scope, before any code changes are made.** Until approval, the working repository remains untouched and no GitHub push or Vercel deployment will occur.

## Part 3 acceptance status and implementation order

The current application does not yet satisfy the final production acceptance criteria. The audit distinguishes existing protections from unresolved gaps so that no finding is overstated as fixed.

| Acceptance area | Current status | Evidence and required next action |
|---|---|---|
| Admin identity | **Partially satisfied** | Latest `has_role` requires an admin row plus exact normalized match to the two approved emails; raw `user_roles` checks remain in three UI surfaces and historical aliases require inventory |
| Server-side authorization | **Foundation present; hardening required** | RLS and the latest security-definer helper protect important tables, but privileged payment/payout operations need dedicated server-side RPCs and consistent checks |
| Billing identity | **Satisfied in source design; deployment verification required** | Payment/subscription reads and writes use authenticated `user_id`; each intended deployment must be verified to use the same Supabase URL/key pair and session configuration |
| Payment ownership | **Partially satisfied** | RLS rejects another user’s `user_id`, but client-supplied plan, amount, and billing fields are not server-validated |
| Payment approval | **Partially satisfied** | RLS restricts updates to admins, but approval is a non-atomic browser sequence without pending-state, plan/amount, approving-admin, and audit checks |
| Subscription consistency | **Not production-ready** | Activation and payment verification can diverge; owner updates can alter protected subscription fields; no renewal/webhook state machine exists |
| Domain consistency | **Not satisfied across all listed domains** | Vercel aliases match and share the Supabase project; Lovable is a different build; `estimateai.pro.bd` returned `DEPLOYMENT_NOT_FOUND` |
| Database preservation | **Preserved during audit** | No production reset, destructive migration, role revocation, or data mutation was performed |
| Security/RLS | **Partially satisfied** | Important project/admin policies exist, but billing/usage and several broad authenticated grants need narrow server-authoritative controls |
| GitHub → Vercel workflow | **Repository path intact; external settings not fully verified** | Existing `main` branch and Vercel rewrite are present; no new project or deployment was created, and external dashboard/DNS/Auth settings remain to be verified |

### Prioritized implementation scope after approval

The recommended first approved slice is the smallest security-critical batch: unify all admin UI checks on the existing email-aware `has_role`; add server-side payment approval/rejection RPCs with pending-state, plan/amount, subscription, approving-admin, and audit-event validation; prevent user subscription/usage tampering through narrow RLS/RPC boundaries; and add adversarial tests before touching visual UX. The second slice should reconcile the canonical deployment and Supabase Auth redirect configuration across supported domains. The third slice should add explicit invitation delivery/lifecycle operations and real email provider integration. PWA/SEO and lower-risk UI improvements should follow after the security gates pass.

External actions that cannot be safely performed from the repository alone include confirming the Vercel project’s connected branch and environment values, fixing DNS or the unavailable `estimateai.pro.bd` deployment, configuring Supabase Auth redirect allowlists, verifying Google OAuth callback origins, and adding provider secrets such as `RESEND_API_KEY`, `MAIL_FROM`, or `APP_URL`. These must be completed and verified in the relevant dashboards by an authorized operator; the audit makes no claim that they have been changed.

## References

[1]: https://github.com/zobaerio/CivilOS-AI/blob/main/README.md "CivilOS AI product requirements and README"
[2]: https://github.com/zobaerio/CivilOS-AI/blob/main/src/App.tsx "CivilOS AI application router"
[3]: https://github.com/zobaerio/CivilOS-AI/blob/main/src/lib/auth.tsx "CivilOS AI authentication provider"
[4]: https://github.com/zobaerio/CivilOS-AI/blob/main/src/integrations/supabase/client.ts "Supabase browser client configuration"
[5]: https://github.com/zobaerio/CivilOS-AI/blob/main/src/pages/UploadPage.tsx "Upload and estimate input page"
[6]: https://github.com/zobaerio/CivilOS-AI/blob/main/src/lib/engineering.ts "Deterministic engineering calculations"
[7]: https://github.com/zobaerio/CivilOS-AI/blob/main/src/lib/marketRates.ts "District market-rate model"
[8]: https://github.com/zobaerio/CivilOS-AI/blob/main/supabase/migrations/20260802055227_7a1229d3-9082-4282-ba36-b2cd149ef621.sql "User bootstrap and admin role migration"
[9]: https://github.com/zobaerio/CivilOS-AI/blob/main/supabase/config.toml "Supabase Edge Function configuration"
[10]: https://github.com/zobaerio/CivilOS-AI/blob/main/supabase/migrations/20260803023830_026473cd-7908-47f8-b742-581c29f50c3a.sql "Subscription, payment, and usage RLS migration"
[11]: https://github.com/zobaerio/CivilOS-AI/blob/main/src/pages/ComingSoonPage.tsx "Coming-soon module registry"
[12]: https://github.com/zobaerio/CivilOS-AI/blob/main/supabase/migrations/20260803023830_026473cd-7908-47f8-b742-581c29f50c3a.sql#L721-L751 "Usage-record table and policies"
[13]: https://github.com/zobaerio/CivilOS-AI/blob/main/supabase/migrations/20260705070724_7bfd57f1-3910-43eb-ab5e-fd3d526024ec.sql "Project collaboration schema and RLS"
[14]: https://github.com/zobaerio/CivilOS-AI/blob/main/src/lib/billing.ts "Client billing service abstraction"
[15]: https://github.com/zobaerio/CivilOS-AI/blob/main/supabase/functions/ai-analyze/index.ts "AI file-analysis Edge Function"
[16]: https://github.com/advisories/GHSA-9jcx-v3wj-wh4m "React Router advisory"
[17]: https://github.com/advisories/GHSA-4r6h-8v6p-xvw6 "SheetJS xlsx prototype-pollution advisory"
[18]: https://github.com/advisories/GHSA-qx2v-qp2m-jg93 "PostCSS advisory"
[19]: https://github.com/zobaerio/CivilOS-AI/blob/main/vercel.json "Vercel SPA rewrite configuration"
[20]: https://civilosai.lovable.app/ "Public Lovable-hosted CivilOS AI domain checked during audit"
[21]: https://estimateai.pro.bd/ "Public canonical-domain candidate checked during audit"
[22]: https://civilosai.vercel.app/ "Public Vercel domain checked during audit"
[23]: https://civilosai.pro.bd/ "Public custom Vercel domain checked during audit"
[24]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase Auth redirect URL configuration"
[25]: https://developers.google.com/identity/protocols/oauth2/web-server "Google OAuth web application origins and redirect URIs"
