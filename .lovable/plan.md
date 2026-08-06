# "Update available" notification for new app versions

When a new version of CivilOS AI is deployed, users who already have the app open (or installed on their phone) keep seeing the old cached version until they manually reload. This adds a friendly prompt that tells them an update is ready and lets them apply it with one tap.

## What the user will see

- A small notification appears at the bottom of the screen: "New version available — Update now / Later".
- Tapping **Update now** reloads the app instantly on the newest version.
- Tapping **Later** dismisses it; the prompt returns on the next visit while the update is still pending.
- Also shows a one-time "App ready to work offline" confirmation the first time the app is cached.
- The prompt only appears on the published site, never inside the Lovable editor preview.

## Technical approach

1. `src/lib/registerPwa.ts` — keep the existing environment guards; extend the `registerSW` call with `onNeedRefresh` and `onOfflineReady` callbacks. Store the returned `updateSW` function and expose the state through a small event/callback module so React can react to it.
2. `src/lib/pwa.tsx` — extend `PwaProvider` / `PwaContext` with `updateReady: boolean`, `offlineReady: boolean`, and `applyUpdate()` (calls `updateSW(true)`, which activates the waiting worker and reloads). Wire it to the registration module via a subscribe function so no duplicate registration occurs.
3. New `src/components/UpdateAvailable.tsx` — a compact toast-style card (uses existing sonner toast with action buttons, styled with design tokens) rendered from `src/App.tsx` next to `InstallCivilOS`. Shows on `updateReady`, with Update now / Later actions.
4. Periodic check: in the registration wrapper, use `onRegisteredSW` to poll `registration.update()` every ~60 minutes and on `visibilitychange` back to visible, so long-lived tabs discover new deployments without a manual refresh.

No backend, database, or business-logic changes.
