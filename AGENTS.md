
- Per-user page data (plan, site map points, schedule, QA) syncs via useCloudState (src/lib/cloudState.ts) to the user_workspace table, with localStorage as the offline/signed-out copy — so data follows the account across devices.
