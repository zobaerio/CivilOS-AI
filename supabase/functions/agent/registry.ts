// CivilOS AI — Agent Tool Registry. Every agent action must go through a tool listed here.
// Identity (ctx.userId) always comes from the verified login, never from model input.
import { z } from "npm:zod@3";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type Risk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AgentType = "admin" | "user";
export interface Ctx { db: SupabaseClient; userId: string; email: string; isAdmin: boolean }
export interface AgentTool {
  name: string;
  description: string;
  agentTypes: AgentType[];
  input: z.ZodTypeAny;
  risk: Risk;
  requiresApproval: boolean;
  target?: (input: any) => string;
  handler: (ctx: Ctx, input: any) => Promise<unknown>;
  /** Re-reads real state after a write; returns true only if the change is confirmed. */
  verify?: (ctx: Ctx, input: any, result: any) => Promise<boolean>;
}

// ---------- Feature catalog (user modules) ----------
export const FEATURES: { key: string; name: string; bn: string; url: string; plan?: string; aliases: string[]; status?: "coming_soon" }[] = [
  { key: "boq", name: "BOQ & Estimation", bn: "বিওকিউ ও এস্টিমেট", url: "/boq-hub", aliases: ["boq", "boq hub", "estimation", "estimate"] },
  { key: "cost_estimator", name: "Cost Estimator", bn: "খরচ হিসাব", url: "/upload", aliases: ["cost", "building estimate"] },
  { key: "rate_analysis", name: "Rate Analysis", bn: "রেট বিশ্লেষণ", url: "/rate-analysis", aliases: ["rate"] },
  { key: "plan_generator", name: "Create Your Own Plan", bn: "নিজের প্ল্যান", url: "/plan-generator", aliases: ["plan", "floor plan"] },
  { key: "bim_studio", name: "BIM Studio 3D", bn: "বিআইএম স্টুডিও", url: "/bim-studio", aliases: ["bim", "bim studio", "3d"] },
  { key: "interior_studio", name: "Interior Studio", bn: "ইন্টেরিয়র স্টুডিও", url: "", aliases: ["interior"], status: "coming_soon" },
  { key: "site_geo", name: "Site Geo & Survey", bn: "সাইট ম্যাপ ও সার্ভে", url: "/site-geo", aliases: ["site geo", "map", "survey"] },
  { key: "scheduler", name: "Project Scheduler", bn: "প্রজেক্ট সময়সূচি", url: "/scheduler", aliases: ["scheduler", "schedule", "gantt"] },
  { key: "inventory", name: "Inventory & Materials", bn: "মালামাল ও স্টক", url: "/inventory", aliases: ["inventory", "stock", "material", "materials", "store"] },
  { key: "qa_qc", name: "QA/QC", bn: "কিউএ/কিউসি", url: "/scheduler", aliases: ["qa", "qc", "quality"] },
  { key: "live_site_audit", name: "Live Site Audit", bn: "লাইভ সাইট অডিট", url: "", aliases: ["site audit", "audit"], status: "coming_soon" },
  { key: "team_workspace", name: "Team Workspace", bn: "টিম ওয়ার্কস্পেস", url: "/projects", aliases: ["team", "workspace", "project workspace"] },
  { key: "tender", name: "Tender Analyzer", bn: "টেন্ডার বিশ্লেষণ", url: "/tender", plan: "tender", aliases: ["tender"] },
  { key: "ai_writer", name: "AI Writer", bn: "এআই রাইটার", url: "/ai-writer", plan: "ai_writer", aliases: ["writer"] },
  { key: "analytics", name: "Project Analytics", bn: "প্রজেক্ট অ্যানালিটিক্স", url: "/analytics", plan: "analytics", aliases: ["analytics", "reports"] },
  { key: "knowledge_library", name: "Knowledge Library", bn: "জ্ঞানভাণ্ডার", url: "", aliases: ["knowledge", "library"], status: "coming_soon" },
  { key: "training_corner", name: "Training Corner", bn: "ট্রেনিং কর্নার", url: "", aliases: ["training"], status: "coming_soon" },
];

export function resolveFeature(q: string) {
  const s = q.toLowerCase().trim();
  return FEATURES.find((f) => f.key === s || f.name.toLowerCase() === s || f.bn === q.trim())
    || FEATURES.find((f) => f.aliases.some((a) => s.includes(a)) || s.includes(f.name.toLowerCase()));
}

async function planFor(ctx: Ctx) {
  const { data: sub } = await ctx.db.from("subscriptions").select("status, plan_id, billing_cycle, renewal_date").eq("user_id", ctx.userId).maybeSingle();
  const active = sub && ["active", "trialing"].includes(sub.status);
  const { data: plans } = await ctx.db.from("plans").select("id, code, name, price_monthly, limits, sort_order").eq("is_active", true).order("sort_order");
  const plan = (active ? plans?.find((p) => p.id === sub!.plan_id) : null) || plans?.find((p) => p.code === "free") || null;
  return { sub: active ? sub : null, plan, plans: plans || [] };
}

const allowed = (plan: any, key?: string) => {
  if (!key) return true;
  const v = plan?.limits?.[key];
  return typeof v === "boolean" ? v : typeof v === "number" ? v !== 0 : false;
};

async function featureStatus(ctx: Ctx, f: (typeof FEATURES)[number]) {
  if (f.status === "coming_soon") return { status: "coming_soon" as const };
  const { plan, plans } = await planFor(ctx);
  if (!allowed(plan, f.plan)) {
    const upgrade = plans.find((p) => allowed(p, f.plan));
    return { status: "locked" as const, reason: "plan", current_plan: plan?.name, upgrade_plan: upgrade ? { name: upgrade.name, price_monthly_bdt: upgrade.price_monthly, path: "/billing" } : null };
  }
  const { data } = await ctx.db.from("user_feature_settings").select("enabled").eq("user_id", ctx.userId).eq("feature_key", f.key).maybeSingle();
  return { status: (data && !data.enabled ? "disabled" : "enabled") as "enabled" | "disabled" };
}

async function setFeature(ctx: Ctx, input: { feature: string }, enabled: boolean) {
  const f = resolveFeature(input.feature);
  if (!f) return { ok: false, status: "not_available", message: `No feature matches "${input.feature}".`, known: FEATURES.map((x) => x.name) };
  const before = await featureStatus(ctx, f);
  if (before.status === "coming_soon" || before.status === "locked") return { ok: false, feature: f.name, ...before };
  if ((before.status === "enabled") === enabled) return { ok: true, feature: f.name, changed: false, status: before.status, message: `${f.name} is already ${before.status}. No change was needed.` };
  const { error } = await ctx.db.from("user_feature_settings").upsert({ user_id: ctx.userId, feature_key: f.key, enabled, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return { ok: true, feature: f.name, feature_key: f.key, changed: true, status: enabled ? "enabled" : "disabled", url: f.url };
}

const NOTIF_KEYS = ["deadline_alerts", "team_invites", "member_joined", "boq_updates", "material_price", "document_uploads", "email_enabled"] as const;
const READABLE_TABLES = ["projects", "profiles", "plans", "subscriptions", "payments", "notifications", "contact_messages", "agent_tasks", "agent_steps", "usage_records", "ratings", "sponsors"] as const;
const SAFE_COLUMNS: Record<string, string> = {
  profiles: "id, display_name, referral_code, created_at",
  payments: "id, user_id, amount, currency, status, payment_provider, invoice_number, created_at",
  contact_messages: "id, subject, status, created_at",
};

export const TOOLS: AgentTool[] = [
  // ---------------- USER AGENT ----------------
  { name: "list_available_features", description: "List CivilOS AI features and their status (enabled/disabled/locked/coming_soon) for the current user.", agentTypes: ["user"], input: z.object({}), risk: "LOW", requiresApproval: false,
    handler: async (ctx) => Promise.all(FEATURES.map(async (f) => ({ key: f.key, name: f.name, bn: f.bn, url: f.url, ...(await featureStatus(ctx, f)) }))) },
  { name: "get_feature_status", description: "Check one feature's status for the current user. Accepts a name in English or Bangla, e.g. 'BIM Studio'.", agentTypes: ["user"], input: z.object({ feature: z.string() }), risk: "LOW", requiresApproval: false,
    handler: async (ctx, i) => { const f = resolveFeature(i.feature); return f ? { feature: f.name, url: f.url, ...(await featureStatus(ctx, f)) } : { status: "not_available" }; } },
  { name: "enable_feature", description: "Turn ON a feature for the current user only. Checks availability, plan and current status first.", agentTypes: ["user"], input: z.object({ feature: z.string() }), risk: "MEDIUM", requiresApproval: false, target: (i) => i.feature,
    handler: (ctx, i) => setFeature(ctx, i, true),
    verify: async (ctx, i, r) => { if (!r?.changed) return true; const f = resolveFeature(i.feature)!; return (await featureStatus(ctx, f)).status === "enabled"; } },
  { name: "disable_feature", description: "Turn OFF a feature for the current user only (hides it from their menu).", agentTypes: ["user"], input: z.object({ feature: z.string() }), risk: "MEDIUM", requiresApproval: false, target: (i) => i.feature,
    handler: (ctx, i) => setFeature(ctx, i, false),
    verify: async (ctx, i, r) => { if (!r?.changed) return true; const f = resolveFeature(i.feature)!; return (await featureStatus(ctx, f)).status === "disabled"; } },
  { name: "get_user_permissions", description: "Return the current user's role and project roles.", agentTypes: ["user"], input: z.object({}), risk: "LOW", requiresApproval: false,
    handler: async (ctx) => {
      const { data: m } = await ctx.db.from("project_members").select("project_id, role, status").eq("user_id", ctx.userId);
      return { app_role: ctx.isAdmin ? "admin" : "user", project_memberships: m || [], can: ["manage own projects", "manage own feature settings", "manage own notifications"] };
    } },
  { name: "get_user_subscription", description: "Return the current user's plan and renewal date (no payment details).", agentTypes: ["user"], input: z.object({}), risk: "LOW", requiresApproval: false,
    handler: async (ctx) => { const { sub, plan, plans } = await planFor(ctx); return { plan: plan?.name, status: sub?.status || "free", billing_cycle: sub?.billing_cycle, renewal_date: sub?.renewal_date, other_plans: plans.map((p) => ({ name: p.name, price_monthly_bdt: p.price_monthly })), upgrade_path: "/billing" }; } },
  { name: "get_user_projects", description: "List projects owned by or shared with the current user.", agentTypes: ["user"], input: z.object({}), risk: "LOW", requiresApproval: false,
    handler: async (ctx) => {
      const { data: own } = await ctx.db.from("projects").select("id, name, status, location, updated_at").eq("user_id", ctx.userId).order("updated_at", { ascending: false }).limit(30);
      const { data: mem } = await ctx.db.from("project_members").select("role, projects(id, name, status, location, updated_at)").eq("user_id", ctx.userId).eq("status", "accepted");
      return { owned: own || [], shared: (mem || []).map((m: any) => ({ role: m.role, ...m.projects })) };
    } },
  { name: "set_notification_setting", description: `Turn one of the current user's notification settings on or off. setting: one of ${NOTIF_KEYS.join(", ")} or "all".`, agentTypes: ["user"], input: z.object({ setting: z.string(), enabled: z.boolean() }), risk: "MEDIUM", requiresApproval: false, target: (i) => i.setting,
    handler: async (ctx, i) => {
      const keys = i.setting === "all" ? [...NOTIF_KEYS] : NOTIF_KEYS.filter((k) => k === i.setting);
      if (!keys.length) return { ok: false, message: "Unknown setting", options: NOTIF_KEYS };
      const patch = Object.fromEntries(keys.map((k) => [k, i.enabled]));
      const { error } = await ctx.db.from("notification_settings").upsert({ user_id: ctx.userId, ...patch, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
      return { ok: true, changed: keys, enabled: i.enabled };
    },
    verify: async (ctx, i, r) => { if (!r?.ok) return true; const { data } = await ctx.db.from("notification_settings").select("*").eq("user_id", ctx.userId).maybeSingle(); return !!data && r.changed.every((k: string) => (data as any)[k] === i.enabled); } },

  // ---------------- ADMIN AGENT ----------------
  { name: "get_system_health", description: "Database reachability, response time, counts of users/projects/tasks, failed agent tasks and new contact messages in the last 24h.", agentTypes: ["admin"], input: z.object({}), risk: "LOW", requiresApproval: false,
    handler: async (ctx) => {
      const t0 = Date.now();
      const since = new Date(Date.now() - 864e5).toISOString();
      const c = async (t: string, f?: (q: any) => any) => { let q = ctx.db.from(t).select("*", { count: "exact", head: true }); if (f) q = f(q); const { count, error } = await q; return error ? null : count; };
      const [users, projects, tasks24, failed24, msgs24, pendingPay] = await Promise.all([
        c("profiles"), c("projects"), c("agent_tasks", (q) => q.gte("created_at", since)), c("agent_tasks", (q) => q.eq("status", "failed").gte("created_at", since)),
        c("contact_messages", (q) => q.gte("created_at", since)), c("payments", (q) => q.eq("status", "pending")),
      ]);
      const ms = Date.now() - t0;
      return { database: users === null ? "unreachable" : "ok", db_response_ms: ms, users, projects, agent_tasks_24h: tasks24, agent_failures_24h: failed24, error_rate_24h: tasks24 ? +((failed24 || 0) / tasks24).toFixed(3) : 0, contact_messages_24h: msgs24, pending_payments: pendingPay, checked_at: new Date().toISOString() };
    } },
  { name: "get_recent_errors", description: "Recent failed agent steps/tasks.", agentTypes: ["admin"], input: z.object({ limit: z.number().optional() }), risk: "LOW", requiresApproval: false,
    handler: async (ctx, i) => {
      const n = Math.min(Math.max(i.limit || 20, 1), 50);
      const { data } = await ctx.db.from("agent_steps").select("created_at, agent_type, tool, error").eq("status", "error").order("created_at", { ascending: false }).limit(n);
      return { errors: data || [], note: "Only agent/tool errors are recorded here; browser errors are not collected by the server." };
    } },
  { name: "search_users", description: "Search users by display name or email (partial match).", agentTypes: ["admin"], input: z.object({ query: z.string() }), risk: "LOW", requiresApproval: false,
    handler: async (ctx, i) => {
      const q = i.query.trim().toLowerCase();
      const { data: list } = await ctx.db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const { data: profs } = await ctx.db.from("profiles").select("id, display_name");
      const names = new Map((profs || []).map((p) => [p.id, p.display_name]));
      return (list?.users || []).filter((u) => u.email?.toLowerCase().includes(q) || (names.get(u.id) || "").toLowerCase().includes(q)).slice(0, 20)
        .map((u) => ({ id: u.id, email: u.email, display_name: names.get(u.id), created_at: u.created_at, last_sign_in_at: u.last_sign_in_at }));
    } },
  { name: "get_user", description: "Get one user's account summary by id.", agentTypes: ["admin"], input: z.object({ user_id: z.string() }), risk: "LOW", requiresApproval: false, target: (i) => i.user_id,
    handler: async (ctx, i) => {
      const { data: u, error } = await ctx.db.auth.admin.getUserById(i.user_id);
      if (error || !u?.user) return { found: false };
      const [{ data: prof }, { data: roles }, { count: projects }, { data: sub }] = await Promise.all([
        ctx.db.from("profiles").select("display_name, referral_code, created_at").eq("id", i.user_id).maybeSingle(),
        ctx.db.from("user_roles").select("role").eq("user_id", i.user_id),
        ctx.db.from("projects").select("*", { count: "exact", head: true }).eq("user_id", i.user_id),
        ctx.db.from("subscriptions").select("status, billing_cycle, renewal_date, plans(name)").eq("user_id", i.user_id).maybeSingle(),
      ]);
      return { found: true, id: u.user.id, email: u.user.email, created_at: u.user.created_at, last_sign_in_at: u.user.last_sign_in_at, profile: prof, roles: (roles || []).map((r) => r.role), projects, subscription: sub };
    } },
  { name: "inspect_database_schema", description: "List the tables the admin agent may read, with their columns.", agentTypes: ["admin"], input: z.object({}), risk: "LOW", requiresApproval: false,
    handler: async (ctx) => Promise.all(READABLE_TABLES.map(async (t) => { const { data } = await ctx.db.from(t).select(SAFE_COLUMNS[t] || "*").limit(1); return { table: t, columns: data?.[0] ? Object.keys(data[0]) : "(empty)" }; })) },
  { name: "read_database_records", description: `Read recent records from an approved table (${READABLE_TABLES.join(", ")}). Optional equality filter on one column. Max 50 rows.`, agentTypes: ["admin"], input: z.object({ table: z.string(), filter_column: z.string().optional(), filter_value: z.string().optional(), limit: z.number().optional() }), risk: "LOW", requiresApproval: false, target: (i) => i.table,
    handler: async (ctx, i) => {
      if (!(READABLE_TABLES as readonly string[]).includes(i.table)) return { error: "Table not allowed", allowed: READABLE_TABLES };
      let q = ctx.db.from(i.table).select(SAFE_COLUMNS[i.table] || "*").limit(Math.min(Math.max(i.limit || 20, 1), 50));
      if (i.filter_column && i.filter_value !== undefined) { if (!/^[a-z_]+$/.test(i.filter_column)) return { error: "Bad column" }; q = q.eq(i.filter_column, i.filter_value); }
      const { data, error } = await q;
      return error ? { error: error.message } : { rows: data };
    } },
  { name: "send_user_notification", description: "Send an in-app notification to one user. Requires admin approval before it runs.", agentTypes: ["admin"], input: z.object({ user_id: z.string(), title: z.string(), message: z.string() }), risk: "HIGH", requiresApproval: true, target: (i) => i.user_id,
    handler: async (ctx, i) => {
      const { data, error } = await ctx.db.from("notifications").insert({ user_id: i.user_id, type: "admin_message", title: i.title.slice(0, 120), message: i.message.slice(0, 1000) }).select("id").single();
      if (error) throw new Error(error.message);
      return { notification_id: data.id };
    },
    verify: async (ctx, _i, r) => { const { data } = await ctx.db.from("notifications").select("id").eq("id", r?.notification_id).maybeSingle(); return !!data; } },
  // ---- Phase 2 admin tools (all approval-gated) ----
  { name: "update_user_profile", description: "Change one user's display name. Requires admin approval.", agentTypes: ["admin"], input: z.object({ user_id: z.string(), display_name: z.string().min(1).max(80) }), risk: "HIGH", requiresApproval: true, target: (i) => i.user_id,
    handler: async (ctx, i) => {
      const { data: before } = await ctx.db.from("profiles").select("display_name").eq("id", i.user_id).maybeSingle();
      if (!before) throw new Error("User profile not found");
      const { error } = await ctx.db.from("profiles").update({ display_name: i.display_name.trim() }).eq("id", i.user_id);
      if (error) throw new Error(error.message);
      return { previous: before.display_name, display_name: i.display_name.trim() };
    },
    verify: async (ctx, i) => { const { data } = await ctx.db.from("profiles").select("display_name").eq("id", i.user_id).maybeSingle(); return data?.display_name === i.display_name.trim(); } },
  { name: "change_user_subscription", description: "Set a user's plan (by plan name, e.g. 'Starter', 'Professional', or 'Free' to cancel). Does not charge money. Requires admin approval.", agentTypes: ["admin"], input: z.object({ user_id: z.string(), plan_name: z.string(), billing_cycle: z.enum(["monthly", "yearly"]).optional() }), risk: "CRITICAL", requiresApproval: true, target: (i) => i.user_id,
    handler: async (ctx, i) => {
      const { data: active } = await ctx.db.from("subscriptions").select("id, plan_id").eq("user_id", i.user_id).eq("status", "active");
      if (/^free$/i.test(i.plan_name.trim())) {
        if (active?.length) { const { error } = await ctx.db.from("subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("user_id", i.user_id).eq("status", "active"); if (error) throw new Error(error.message); }
        return { plan: "Free", cancelled: active?.length || 0 };
      }
      const { data: plan } = await ctx.db.from("plans").select("id, name").ilike("name", i.plan_name.trim()).maybeSingle();
      if (!plan) throw new Error(`Plan '${i.plan_name}' not found`);
      if (active?.length) await ctx.db.from("subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("user_id", i.user_id).eq("status", "active");
      const cycle = i.billing_cycle || "monthly";
      const renew = new Date(); renew.setMonth(renew.getMonth() + (cycle === "yearly" ? 12 : 1));
      const { data, error } = await ctx.db.from("subscriptions").insert({ user_id: i.user_id, plan_id: plan.id, status: "active", billing_cycle: cycle, payment_provider: "admin", renewal_date: renew.toISOString() }).select("id").single();
      if (error) throw new Error(error.message);
      return { plan: plan.name, plan_id: plan.id, subscription_id: data.id };
    },
    verify: async (ctx, i, r) => {
      const { data } = await ctx.db.from("subscriptions").select("plan_id").eq("user_id", i.user_id).eq("status", "active");
      return r?.plan === "Free" ? !data?.length : (data?.length === 1 && data[0].plan_id === r?.plan_id);
    } },
  { name: "delete_user", description: "Permanently delete a user account and its owned data. Irreversible. Admin accounts cannot be deleted. Requires admin approval.", agentTypes: ["admin"], input: z.object({ user_id: z.string(), reason: z.string().min(3) }), risk: "CRITICAL", requiresApproval: true, target: (i) => i.user_id,
    handler: async (ctx, i) => {
      if (i.user_id === ctx.userId) throw new Error("You cannot delete your own account via the agent");
      const { data: isAdm } = await ctx.db.rpc("has_role", { _user_id: i.user_id, _role: "admin" });
      if (isAdm) throw new Error("Admin accounts cannot be deleted");
      const { error } = await ctx.db.auth.admin.deleteUser(i.user_id);
      if (error) throw new Error(error.message);
      return { deleted: i.user_id, reason: i.reason };
    },
    verify: async (ctx, i) => { const { data } = await ctx.db.auth.admin.getUserById(i.user_id); return !data?.user; } },
  // ---- Scheduled automations (admin) ----
  { name: "list_automations", description: "List scheduled automations with on/off state, next and last run.", agentTypes: ["admin"], input: z.object({}), risk: "LOW", requiresApproval: false,
    handler: async (ctx) => { const { data } = await ctx.db.from("agent_automations").select("id, name, kind, frequency, enabled, next_run_at, last_run_at, last_status, fail_count").order("created_at"); return { automations: data || [], kinds: AUTOMATION_KINDS }; } },
  { name: "create_automation", description: `Create a scheduled automation. kind: health_check (checks database and failed tasks, alerts you only if something is wrong) or failed_tasks_report (sends you a summary of failed agent tasks). frequency: hourly, daily or weekly. Results arrive as notifications to you.`, agentTypes: ["admin"], input: z.object({ kind: z.enum(["health_check", "failed_tasks_report"]), frequency: z.enum(["hourly", "daily", "weekly"]), name: z.string().max(80).optional() }), risk: "MEDIUM", requiresApproval: false, target: (i) => i.kind,
    handler: async (ctx, i) => {
      const { data: dup } = await ctx.db.from("agent_automations").select("id").eq("kind", i.kind).eq("frequency", i.frequency).eq("owner_id", ctx.userId).eq("enabled", true).maybeSingle();
      if (dup) return { already_exists: true, id: dup.id };
      const { data, error } = await ctx.db.from("agent_automations").insert({ owner_id: ctx.userId, kind: i.kind, frequency: i.frequency, name: i.name || `${i.frequency} ${i.kind.replace(/_/g, " ")}`, next_run_at: nextRun(i.frequency) }).select("id").single();
      if (error) throw new Error(error.message);
      return { id: data.id };
    },
    verify: async (ctx, _i, r) => { const { data } = await ctx.db.from("agent_automations").select("id").eq("id", r?.id).maybeSingle(); return !!data; } },
  { name: "set_automation_enabled", description: "Turn a scheduled automation on or off by id.", agentTypes: ["admin"], input: z.object({ id: z.string(), enabled: z.boolean() }), risk: "MEDIUM", requiresApproval: false, target: (i) => i.id,
    handler: async (ctx, i) => { const { data, error } = await ctx.db.from("agent_automations").update({ enabled: i.enabled, ...(i.enabled ? { fail_count: 0 } : {}) }).eq("id", i.id).select("id"); if (error) throw new Error(error.message); if (!data?.length) throw new Error("Automation not found"); return { id: i.id, enabled: i.enabled }; },
    verify: async (ctx, i) => { const { data } = await ctx.db.from("agent_automations").select("enabled").eq("id", i.id).maybeSingle(); return data?.enabled === i.enabled; } },
  { name: "run_automation_now", description: "Run one scheduled automation immediately (for testing). Sends its notification to you.", agentTypes: ["admin"], input: z.object({ id: z.string() }), risk: "MEDIUM", requiresApproval: false, target: (i) => i.id,
    handler: async (ctx, i) => { const { data: a } = await ctx.db.from("agent_automations").select("*").eq("id", i.id).maybeSingle(); if (!a) throw new Error("Automation not found"); return await runAutomation(ctx.db, a); } },
  // ---- Agent memory (per user, per agent type) ----
  ...(["user", "admin"] as AgentType[]).flatMap((at): AgentTool[] => [
    { name: `${at}_remember`, description: "Save a short fact or preference the user asked you to remember (e.g. preferred language, default district). Overwrites the same key.", agentTypes: [at], input: z.object({ key: z.string().min(1).max(60), value: z.string().min(1).max(500) }), risk: "LOW", requiresApproval: false, target: (i) => i.key,
      handler: async (ctx, i) => { const { error } = await ctx.db.from("agent_memory").upsert({ user_id: ctx.userId, agent_type: at, key: i.key.trim().toLowerCase(), value: i.value.trim(), updated_at: new Date().toISOString() }, { onConflict: "user_id,agent_type,key" }); if (error) throw new Error(error.message); return { saved: i.key }; },
      verify: async (ctx, i) => { const { data } = await ctx.db.from("agent_memory").select("value").eq("user_id", ctx.userId).eq("agent_type", at).eq("key", i.key.trim().toLowerCase()).maybeSingle(); return data?.value === i.value.trim(); } },
    { name: `${at}_recall`, description: "List everything remembered for this user. Call at the start when preferences may matter.", agentTypes: [at], input: z.object({}), risk: "LOW", requiresApproval: false,
      handler: async (ctx) => { const { data } = await ctx.db.from("agent_memory").select("key, value, updated_at").eq("user_id", ctx.userId).eq("agent_type", at).order("updated_at", { ascending: false }).limit(50); return { memories: data || [] }; } },
    { name: `${at}_forget`, description: "Delete one remembered item by key, or key 'all' to clear everything.", agentTypes: [at], input: z.object({ key: z.string() }), risk: "MEDIUM", requiresApproval: false, target: (i) => i.key,
      handler: async (ctx, i) => { let q = ctx.db.from("agent_memory").delete().eq("user_id", ctx.userId).eq("agent_type", at); if (i.key !== "all") q = q.eq("key", i.key.trim().toLowerCase()); const { error } = await q; if (error) throw new Error(error.message); return { forgotten: i.key }; },
      verify: async (ctx, i) => { let q = ctx.db.from("agent_memory").select("id").eq("user_id", ctx.userId).eq("agent_type", at); if (i.key !== "all") q = q.eq("key", i.key.trim().toLowerCase()); const { data } = await q; return !data?.length; } },
  ]),
];

export const toolsFor = (t: AgentType) => TOOLS.filter((x) => x.agentTypes.includes(t));

// ---------- Automation runner (shared by tools and the scheduler) ----------
export const AUTOMATION_KINDS = ["health_check", "failed_tasks_report"] as const;
export const nextRun = (f: string, from = new Date()) => new Date(from.getTime() + (f === "hourly" ? 3600e3 : f === "weekly" ? 7 * 864e5 : 864e5)).toISOString();
export async function runAutomation(db: SupabaseClient, a: any) {
  const since = new Date(Date.now() - (a.frequency === "hourly" ? 3600e3 : a.frequency === "weekly" ? 7 * 864e5 : 864e5)).toISOString();
  let status = "ok", title = "", message = "", notify = false, summary: Record<string, unknown> = {};
  try {
    const t0 = Date.now();
    const { error: dbErr } = await db.from("plans").select("id").limit(1);
    const { count: failed } = await db.from("agent_tasks").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since);
    const { count: pending } = await db.from("agent_approvals").select("*", { count: "exact", head: true }).eq("status", "pending");
    summary = { database_ok: !dbErr, response_ms: Date.now() - t0, failed_tasks: failed || 0, pending_approvals: pending || 0 };
    if (a.kind === "health_check") {
      const issues = [dbErr && "database unreachable", (failed || 0) > 0 && `${failed} failed agent task(s)`, (pending || 0) > 0 && `${pending} approval(s) waiting`].filter(Boolean);
      status = dbErr || (failed || 0) > 0 ? "warning" : "ok";
      notify = issues.length > 0;
      title = "CivilOS health check: attention needed";
      message = `Issues since last check: ${issues.join(", ")}.`;
    } else {
      const { data: rows } = await db.from("agent_tasks").select("objective, error, created_at").eq("status", "failed").gte("created_at", since).order("created_at", { ascending: false }).limit(5);
      notify = true;
      title = `Agent report: ${failed || 0} failed task(s)`;
      message = (rows || []).length ? rows!.map((r) => `• ${String(r.objective).slice(0, 60)} — ${String(r.error || "").slice(0, 60)}`).join("\n") : "No failed agent tasks in this period.";
      summary.recent = rows?.length || 0;
    }
    if (notify) {
      const { error } = await db.from("notifications").insert({ user_id: a.owner_id, type: "automation", title, message: message.slice(0, 1000) });
      if (error) throw new Error(error.message);
    }
  } catch (e) { status = "error"; summary.error = e instanceof Error ? e.message : String(e); }
  const fails = status === "error" ? (a.fail_count || 0) + 1 : 0;
  await db.from("agent_automations").update({ last_run_at: new Date().toISOString(), next_run_at: nextRun(a.frequency), last_status: status, last_result: { ...summary, notified: notify }, fail_count: fails, ...(fails >= 3 ? { enabled: false } : {}) }).eq("id", a.id);
  // Audit trail
  const { data: task } = await db.from("agent_tasks").insert({ agent_type: "admin", user_id: a.owner_id, objective: `Scheduled: ${a.name}`, status: status === "error" ? "failed" : "completed", result: notify ? title : "No issues — no notification sent.", error: status === "error" ? String(summary.error) : null, started_at: new Date().toISOString(), completed_at: new Date().toISOString() }).select("id").single();
  if (task) await db.from("agent_steps").insert({ task_id: task.id, agent_type: "admin", actor_user_id: a.owner_id, kind: "automation", tool: a.kind, target: a.id, risk_level: "LOW", result_summary: summary, status: status === "error" ? "error" : "ok", error: status === "error" ? String(summary.error) : null });
  return { status, notified: notify, ...summary, disabled_after_failures: fails >= 3 };
}
