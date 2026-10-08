
- Per-user page data (plan, site map points, schedule, QA) syncs via useCloudState (src/lib/cloudState.ts) to the user_workspace table, with localStorage as the offline/signed-out copy — so data follows the account across devices.
- AI agents: one shared edge function `agent` (Planner → registry tool → permission/risk check → execute → verify → audit). Every agent action must be a registered tool in `supabase/functions/agent/registry.ts`; user identity comes only from the verified login; HIGH/CRITICAL tools pause for admin approval; agent tables are written only by the server.
