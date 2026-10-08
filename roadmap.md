# CivilOS AI — Master Prompt Progress Tracker

Source of truth: uploaded files `CIVILOS_AI-_1_Number.txt` (12 phases) and `CIVILOS_AI-2_Number.txt` (73 features).
Workflow: user says "Continue" → resume from the first unchecked item, in order. Never redo checked items. Never break existing features.

## DONE (already live in the app)
- [x] Core design system, branding (CivilOS AI logo everywhere), dark/light theme
- [x] Global app structure: navbar, sidebar, footer, routing, mobile responsive
- [x] Dashboard with stats, quick actions, plan usage
- [x] Authentication: email/password + Google (managed), profiles, admin roles
- [x] Project management: /projects, project detail, save/cloud sync, share links
- [x] Team collaboration: project_members, invitations, roles
- [x] Notifications + notification settings
- [x] AI Engine: /ai-assistant, /ai-engineer (chat, image/PDF input), ai-chat/ai-analyze/ai-structured edge functions
- [x] Quantity/Estimation: upload flow, estimate engine, BOQ Generator (/boq), BOQ Hub (/boq-hub), Rate Analysis (/rate-analysis), district market rates (BDT)
- [x] BNBC 2022 load analysis: dead/live/wind/snow/earth pressure/water/earthquake + factored combinations
- [x] Tender Analysis (/tender), Site Diary (/site-diary)
- [x] Export system: Excel/PDF/CSV/Word + Google Sheets (exportUtils)
- [x] Billing: plans (Free/Starter ৳499/Professional ৳1,999), subscriptions, usage records, manual bKash/Nagad verification
- [x] Affiliate program, referrals, withdrawals
- [x] Admin panel (/admin): users, sponsors, affiliate, billing
- [x] Language: Bengali + English toggle; Currency: BDT (৳) default
- [x] SEO: meta, JSON-LD, sitemap, robots, Search Console verification
- [x] PWA: install prompt, offline, update-available flow
- [x] Security: RLS on all tables, has_role, admin allowlist, plans policy tightened
- [x] Ratings, sponsors slider, FAQ, contact page, feedback basics

## TODO — next up, in order
- [x] P5-F23: Create Your OWN Plan — guided floor-plan generation (plot size, road direction, rooms, floors) + natural language plan input + feasibility check + generated plan UI
- [x] P5: BIM Studio 3D (/bim-studio: 3D model from plan, floors slider, finishes, furniture, camera presets, image export)
- [x] P6: Site Geo (/site-geo: map search/locate/satellite, distance+area in sft/decimal/katha/bigha, plan overlay on map, GeoJSON export) + Survey Calculator (irregular plot, unit converter, levelling). GIS file import still pending.
- [x] P7: Project Scheduler (/scheduler: WBS, Gantt, FS/SS/FF/SF + lag, critical path, CSV export, QA/QC checklist). Saved per device; Live Site Audit + cloud sync pending.
- [~] P8: Inventory (DONE: /inventory stock in/out, wastage, low-stock, vendors, POs; requisitions, /equipment; TODO: invoices, contractor bills, payments, cash-flow) — & Material Management (stock in/out, wastage, low-stock alerts), requisitions, purchase orders, vendors, equipment, invoices, contractor bills, payments, cash-flow
- [ ] P9: AI Defect Detection from site photos + AI automation/risk features
- [ ] P10: Knowledge Library (BNBC/structural/geo/survey categories, search/filter) + Training Corner + professional report builder
- [ ] P11: Global units system (metric/imperial conversion, unit labels on every numeric field) + floating assistant + project import/export
- [ ] P12: Admin governance extras: announcements, audit logs, system health, usage analytics, rate limiting

## Notes
- BBS, RA Bill, Material Estimate/Cost Sheet, Gantt routes exist as Coming Soon stubs — replace with real modules when their phase arrives.
- Verify build + preview after each feature; keep Bengali/English and BDT defaults.
- [x] Plan, site map & schedule saved to user account (cross-device)
- [ ] Team sharing of schedule/site map (per project)
- [x] AI Agent Phase 1: User Agent (/agent) + Admin Control Center (/admin/ai-agent), approvals, audit
- [x] AI Agent Phase 2a: update user, change subscription, delete user (approval-gated)
- [x] AI Agent Phase 2b: agent memory (remember/recall/forget)
- [x] AI Agent Phase 2c: scheduled automations (hourly server scheduler)
