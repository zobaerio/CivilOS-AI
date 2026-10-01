# CivilOS AI logo and banner rollout — final polish

## Status: mostly done
The new CivilOS AI logo is already live on the home page banner, navbar, sidebar, sign-in, loading screen, footer, 404 page, error page, favicon, and installed-app icons. Build is passing and the logo renders correctly on desktop and mobile preview.

## Remaining cleanup (from the final brand audit)
1. **Footer email** — `src/components/Footer.tsx` still shows the old brand address `support@smarthouseai.com`. Replace with the CivilOS AI contact email.
2. **Sidebar wordmark** — check `src/components/DashboardSidebar.tsx` text branding matches the logo's heading font for a consistent look.
3. **Final visual check** — confirm the home page banner logo, navbar logo, and mobile view all render sharply after the fixes.

## Technical details
- Only small text/style edits in `Footer.tsx` and possibly `DashboardSidebar.tsx`.
- No new assets needed — all logo files already exist under `public/branding/`.
- Verify with a build check and a quick desktop + mobile preview screenshot.
