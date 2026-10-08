# CivilOS AI Agent — Phase 1 (safe foundation)

The full brief (sections 0–31) is too large to build safely in one go. Phase 1 builds the shared core and both agents with a small set of safe, verified tools. Later phases add the higher-risk tools (delete user, code/deploy) and scheduled automations.

## What you will get

**User Agent — `/agent`** (signed-in users)
- Chat-style command box that understands Bangla, Banglish and English ("BIM Studio on করো", "আমার project গুলো দেখাও", "Notifications বন্ধ করো").
- It actually runs actions, then re-checks that they worked. If something is already on, it says so instead of repeating it.
- Tools: list features, check a feature's status, turn a feature on/off (only your own), your plan/subscription (no payment details), your projects, your permissions, notification settings on/off.
- If a feature needs a higher plan, it shows the upgrade path. It never buys anything by itself.

**Admin Agent — `/admin/ai-agent`** (allowlisted admins only)
- An "AI Operations Control Center" page, not a plain chat: Command Center, Active Tasks with a step-by-step timeline, Approvals (Approve / Reject), Activity, searchable Audit, System Health.
- Tools: system health (database reachable, users/projects counts, recent failures), recent errors (from agent failures and contact messages), search users, view one user, read-only list of tables, read selected records from approved tables only (no free-form SQL).
- Anything rated HIGH or CRITICAL stops and waits for your Approve click. Each approval covers only that one action.

**Shared safety rules (both agents)**
- Every task has a status: received → planning → awaiting approval → executing → verifying → completed (or failed / blocked / cancelled). The agent never reports success it hasn't checked.
- Each step is written to an audit log that users can't edit or delete.
- Who you are is always worked out on the server from your login, never from what the AI says.
- Instructions found inside documents or records are ignored if they break the safety rules.

## Not in Phase 1 (planned next)
- Delete/update user, subscription changes, code repair/deploy tools.
- Scheduled and event-triggered automations (daily health check, etc.).
- Long-term agent memory beyond the current task history.

## Technical details
- Tables: `agent_tasks`, `agent_steps` (audit/tool calls), `agent_approvals`, `user_feature_settings` (user_id, feature_key, enabled). RLS: users see only their own rows; admins via `has_role`. Audit rows are insert-only (by server).
- Edge function `agent` (Lovable AI Gateway, AI SDK `streamText` + tools, `stopWhen`): validates the login, picks the tool set by agent type (admin requires `has_role(uid,'admin')`), registry entries hold schema, risk, approval flag, handler and verify function. HIGH+ tools create an approval row and pause the task; `agent-approve` resumes it after re-checking admin + task ownership.
- Feature catalog reuses `src/lib/navigation.ts` modules; plan eligibility reuses `plans.limits/features` + `subscriptions`.
- Sidebar links: "AI Agent" in user menu, "AI Agent" tab in Admin.
