# 🚀 CIVILOS AI --- FULL PRODUCTION MASTER PROMPT

## 20-Part Implementation & Verification Specification

**Project:** CivilOS AI\
**Tagline:** The AI Operating System for Civil Engineers\
**Preferred production domain:** https://civilosai.pro.bd\
**Existing domains:** https://civilosai.lovable.app,
https://estimateai.pro.bd, https://civilosai.vercel.app/\
**Developer portfolio:** https://zobaer.vercel.app\
**Authorized admin emails:** zobaerio24@gmail.com,
zobaerhasan431@gmail.com

------------------------------------------------------------------------

## GLOBAL RULES --- APPLY TO EVERY PART

You are working on the **EXISTING CivilOS AI project**.

-   Do NOT create a new project.
-   Do NOT rebuild the application from scratch.
-   Do NOT replace working architecture unnecessarily.
-   Do NOT delete or recreate production tables unnecessarily.
-   Preserve existing production data.
-   Inspect the existing implementation before editing.
-   Reuse existing components, database tables, routes, authentication
    and services whenever possible.
-   Make incremental, production-safe changes.
-   Never fake functionality.
-   Never claim something is fixed unless it was actually implemented
    and verified.
-   Never expose secrets in frontend code or GitHub.
-   Never put service-role keys, email API keys or private credentials
    in `VITE_*`.
-   Enforce important authorization server-side, not only in the UI.
-   After each implementation stage, run available type checks, build,
    lint/tests and browser verification where possible.
-   If something requires external configuration that you cannot access,
    clearly report the exact required action instead of pretending it
    was completed.

------------------------------------------------------------------------

# PART 1 --- COMPLETE PROJECT AUDIT & ARCHITECTURE BASELINE

Before changing code, perform a complete audit of the existing CivilOS
AI project.

Inspect:

-   complete source tree
-   package.json
-   Vite configuration
-   React Router
-   authentication
-   Supabase client
-   Supabase schema
-   migrations
-   RLS policies
-   RPC/database functions
-   Edge Functions
-   project/team system
-   invitations
-   notifications
-   billing/subscriptions
-   payment approval
-   admin panel
-   storage/file uploads
-   PWA
-   SEO
-   robots.txt
-   sitemap
-   manifest
-   Vercel configuration
-   environment variables
-   hardcoded domains
-   OAuth redirects
-   authentication callbacks
-   external links

Create a clear internal architecture map before modifying anything.

Identify:

1.  What already works.
2.  What is broken.
3.  What is duplicated.
4.  What is insecure.
5.  What depends on hardcoded domains.
6.  What depends on frontend-only authorization.
7.  What depends on external configuration.
8.  Which changes can safely reuse existing code.

Do not perform destructive migrations merely to simplify implementation.

At the end of the audit, create a concise implementation plan and then
execute it incrementally.

------------------------------------------------------------------------

# PART 2 --- PROJECT INVITATION, TEAM COLLABORATION & REAL EMAIL

CivilOS AI already has a Project Invitation / Team Collaboration system.
Fix and upgrade the existing implementation instead of creating a
duplicate.

Supported roles:

-   Owner/Admin
-   Engineer
-   Member
-   Viewer

Maintain a secure invitation record with equivalent existing fields
where available:

-   id
-   project_id
-   inviter_id
-   invited_email
-   role
-   secure token
-   status
-   created_at
-   expires_at
-   accepted_at
-   accepted_by
-   sent_at
-   last_sent_at

Invitation statuses:

-   pending
-   accepted
-   rejected
-   cancelled
-   expired

Default expiration: 7 days unless the existing product has a
configurable value.

Invitation tokens must be cryptographically secure and unpredictable.
Prevent guessing and reuse. Where practical, store only a secure hash of
the token.

When an invitation is created, send a **real email** using the existing
production architecture. Prefer Resend through a Supabase Edge
Function/server-side implementation when compatible.

Never expose:

-   RESEND_API_KEY
-   SUPABASE_SERVICE_ROLE_KEY
-   other private secrets

in client code.

Email should contain:

-   CivilOS AI branding
-   project name
-   inviter name
-   invited role
-   expiration date
-   secure Accept Invitation button
-   plain-text fallback where supported

Support:

-   existing users
-   new users
-   login/signup redirect
-   token preservation
-   acceptance
-   rejection
-   expiration
-   cancellation
-   resend
-   duplicate prevention

Acceptance must verify server-side:

-   invitation exists
-   status is pending
-   not expired
-   token valid
-   authenticated email exactly matches invited email
-   token not already used
-   project exists
-   user is allowed to join

Use an atomic transaction/RPC where appropriate:

validate → create membership → mark invitation accepted.

Prevent:

-   token reuse
-   wrong-email acceptance
-   role manipulation
-   project ID manipulation
-   duplicate pending invitations
-   unauthorized invitations

Resend should rotate/invalidate old tokens where appropriate.

Viewer must remain read-only.

------------------------------------------------------------------------

# PART 3 --- ADMIN SECURITY, BILLING, SUBSCRIPTIONS & PAYMENT APPROVAL

Only these exact normalized emails may access Admin:

-   zobaerio24@gmail.com
-   zobaerhasan431@gmail.com

Normalize with trim + lowercase, then exact comparison.

Do not grant admin access based only on:

-   localStorage
-   React state
-   URL
-   hidden menu
-   frontend role
-   editable profile metadata

Protect Admin Panel and every privileged backend operation using secure
server/database authorization and RLS.

Audit the existing user_roles/admin system. Revoke unauthorized elevated
privileges where safely appropriate without affecting the two authorized
administrators.

Inspect the billing problem where payment/subscription records may not
appear when the application is opened from domains other than the
Lovable domain.

Verify whether:

-   all domains use the same Supabase project
-   environment variables are consistent
-   hardcoded APP_URL causes problems
-   origin checks cause problems
-   user IDs are consistent
-   RLS filters records incorrectly
-   admin queries are domain-dependent
-   Vercel points to a different backend

Billing must identify users by authenticated user ID, not
hostname/domain.

Supported domains should use the same production database when intended:

-   civilosai.lovable.app
-   estimateai.pro.bd
-   civilosai.pro.bd
-   civilosai.vercel.app

Payment requests must be associated server-side with the authenticated
user.

Only authorized administrators may:

-   approve payment
-   reject payment
-   activate/cancel subscriptions
-   modify privileged billing data

Where appropriate, make payment approval atomic:

validate admin → approve payment → update subscription → record
approver/time.

If external Vercel/Supabase/DNS configuration is the actual problem,
report the exact external fix rather than claiming it was fixed.

------------------------------------------------------------------------

# PART 4 --- DOMAIN, GOOGLE OAUTH, ROUTING, CALLBACK & 404 FIX

Preferred production domain:

https://civilosai.pro.bd

Do not break the existing Lovable domain until the custom domain is
verified.

Investigate the Google OAuth 404 problem on non-Lovable domains.

Inspect:

-   Supabase Auth Site URL
-   Supabase redirect URLs
-   Google OAuth configuration
-   Google Cloud authorized origins
-   Google Cloud redirect URIs
-   React Router
-   auth callback
-   Vite
-   vercel.json
-   SPA fallback
-   environment variables
-   hardcoded URLs
-   password reset redirect
-   signup redirect
-   login redirect
-   invitation redirect

Valid routes such as:

-   /auth
-   /auth/callback
-   /dashboard
-   /projects
-   /billing
-   /invite

must work with direct navigation and refresh.

Do not create duplicate callback routes unnecessarily.

Preserve invitation tokens across login/signup.

Prevent open redirects.

Search the codebase for every occurrence of:

-   civilosai.lovable.app
-   civilosai.vercel.app
-   estimateai.pro.bd
-   civilosai.pro.bd

Classify each occurrence before changing it.

If external Google Cloud, Supabase dashboard, Vercel or DNS
configuration is required, report exact required values and verification
steps.

------------------------------------------------------------------------

# PART 5 --- SUPABASE DATABASE & RLS SECURITY AUDIT

Audit all important tables, including equivalents of:

-   profiles
-   user_roles
-   projects
-   project_members
-   invitations
-   notifications
-   subscriptions
-   billing
-   payment_requests
-   documents
-   files
-   estimates
-   BOQ
-   project data
-   admin data

Verify RLS is enabled wherever required.

Users must only access records they are authorized to access.

Project isolation is mandatory.

A user must not access another project by changing:

`project_id`

in a URL, request or client payload.

Do not trust frontend authorization.

Audit every SELECT/INSERT/UPDATE/DELETE policy.

Inspect SECURITY DEFINER functions.

For SECURITY DEFINER functions:

-   use only when necessary
-   set a safe search_path
-   validate all inputs
-   prevent privilege escalation
-   do not expose unnecessary data

Never expose service-role access to the browser.

Do not recreate production tables unnecessarily.

Create only safe incremental migrations.

------------------------------------------------------------------------

# PART 6 --- PROJECT ROLES & TEAM PERMISSIONS

Implement and verify project-level permissions.

## Owner/Admin

May:

-   manage project
-   manage team
-   invite members
-   remove members
-   change project roles
-   project settings
-   permitted project deletion

## Engineer

May access engineering/project work according to existing product
design.

Must not gain platform-admin privileges.

## Member

May collaborate according to normal project permissions.

Must not access admin-only features.

## Viewer

STRICT READ ONLY.

Viewer must not:

-   create
-   update
-   delete
-   invite
-   change roles
-   modify settings

Do not rely on frontend disabling.

Enforce permissions through RLS/server-side authorization.

Test privilege escalation by manipulating:

-   request body
-   role fields
-   project IDs
-   URLs
-   frontend state

------------------------------------------------------------------------

# PART 7 --- NOTIFICATION CENTER

Inspect the existing notification system and improve it rather than
creating a duplicate.

Support:

-   unread count
-   notification list
-   timestamps
-   read/unread state
-   mark as read
-   relevant action buttons

Invitation notification example:

"You have been invited to join ABC Construction Project as an Engineer."

Actions:

-   Accept
-   Decline

Notifications must respect user authorization.

A user must not read another user's private notifications.

Email remains the primary invitation delivery mechanism.

Avoid notification spam and unnecessary polling.

Use realtime/subscription functionality only where already supported and
appropriate.

------------------------------------------------------------------------

# PART 8 --- PWA & INSTALL CIVILOS AI

Inspect the existing PWA implementation first.

Improve it instead of creating duplicate service-worker/manifest logic.

Verify:

-   manifest.webmanifest
-   icons
-   192x192 icon
-   512x512 icon
-   service worker
-   offline app shell
-   install prompt
-   Add to Home Screen
-   Android support
-   iPhone/iPad guidance
-   desktop installation where supported

After login/signup, provide:

"Install CivilOS AI"

or:

"Add CivilOS AI to your device"

If automatic installation is unavailable, provide platform-appropriate
manual instructions.

Do NOT create fake APK/EXE downloads.

Do not describe a PWA as a native Android APK.

Ensure service-worker caching does not serve stale authenticated/private
data.

------------------------------------------------------------------------

# PART 9 --- ADVANCED SEO

Improve technical SEO without exposing private application data.

Brand:

CivilOS AI

Tagline:

The AI Operating System for Civil Engineers

Implement/improve:

-   unique title
-   meta description
-   canonical
-   Open Graph
-   Twitter/X metadata
-   favicon
-   Apple touch icon
-   robots.txt
-   sitemap.xml
-   JSON-LD

Appropriate structured data may include:

-   Organization
-   WebSite
-   SoftwareApplication

Do not invent organization information.

Natural keywords may include:

-   CivilOS AI
-   AI for Civil Engineers
-   Civil Engineering AI
-   Construction Estimation
-   BOQ Generator
-   Quantity Calculation
-   Cost Estimation
-   Construction Project Management
-   Tender Management
-   Civil Engineering Software
-   Bangladesh Construction Estimation

Do not keyword stuff.

Improve semantic HTML:

-   one clear H1
-   logical H2/H3 hierarchy
-   descriptive links
-   image alt text
-   internal linking
-   clean URLs
-   accessibility

Private/authenticated pages should use noindex where appropriate.

Do not expose dashboard content to search engines.

------------------------------------------------------------------------

# PART 10 --- PREMIUM UI/UX UPGRADE

Preserve CivilOS AI branding and existing functionality.

Improve:

-   typography
-   spacing
-   cards
-   buttons
-   forms
-   navigation
-   dashboard
-   project pages
-   footer
-   empty states
-   loading states
-   error states
-   mobile layouts

Hero section must immediately explain:

"What is CivilOS AI?"

and:

"Why should a Civil Engineer use it?"

Use tasteful feature showcase/carousel where appropriate:

-   AI Engineer
-   BOQ Generator
-   Cost Estimation
-   Quantity Calculation
-   Tender Analysis
-   Project Management
-   Site Diary
-   AI File Assistant

Avoid:

-   excessive animation
-   heavy backgrounds
-   autoplay audio
-   layout shifts
-   performance-heavy effects

Support:

-   prefers-reduced-motion
-   keyboard navigation
-   visible focus
-   accessible labels
-   adequate contrast

Do not redesign working screens unnecessarily.

------------------------------------------------------------------------

# PART 11 --- COMPLETE SECURITY HARDENING

Perform a security audit covering:

Authentication:

-   Supabase Auth
-   session handling
-   login
-   signup
-   logout
-   password reset
-   Google OAuth
-   callbacks

Authorization:

-   RLS
-   project ownership
-   membership
-   roles
-   admin access

Threats to test:

-   IDOR
-   BOLA
-   privilege escalation
-   XSS
-   HTML injection
-   SQL injection
-   open redirects
-   unauthorized RPC calls
-   client-side role manipulation
-   invitation abuse
-   token reuse
-   insecure file access
-   sensitive data leakage

Never trust IDs, roles, emails or permissions supplied solely by the
client.

------------------------------------------------------------------------

# PART 12 --- FILE UPLOAD & STORAGE SECURITY

If CivilOS AI supports uploads, audit:

-   file size
-   MIME type
-   extension
-   storage buckets
-   bucket policies
-   user authorization
-   project authorization
-   private/public access
-   file download URLs
-   deletion permissions

Prevent unauthorized access to another project's files.

Do not expose private storage publicly unless intentionally designed.

Validate uploads server-side where appropriate.

Avoid trusting the file extension alone.

Prevent malicious HTML/SVG/script content from becoming executable
content when uploaded.

Use signed URLs for private files where appropriate.

Do not store secrets inside uploaded files or metadata.

------------------------------------------------------------------------

# PART 13 --- MOBILE RESPONSIVENESS

Test and optimize:

-   Android
-   iPhone
-   tablet
-   laptop
-   desktop

Prioritize:

-   navigation
-   dashboard
-   tables
-   forms
-   modals
-   invitations
-   admin
-   billing
-   project management
-   notifications
-   PWA install UI

Avoid horizontal overflow.

Responsive tables should remain usable on small screens.

Touch targets should be appropriately sized.

Dialogs must fit small screens.

Do not break desktop layouts while fixing mobile.

------------------------------------------------------------------------

# PART 14 --- PERFORMANCE OPTIMIZATION

Inspect:

-   unnecessary React renders
-   large assets
-   image loading
-   lazy loading
-   code splitting
-   duplicate API calls
-   duplicate database queries
-   bundle size
-   caching
-   loading states

Use lazy loading for large routes/features where appropriate.

Avoid unnecessary network requests.

Avoid loading admin-only code for normal users where practical.

Optimize images.

Do not sacrifice:

-   security
-   correctness
-   authorization
-   functionality

Do not introduce aggressive caching that exposes stale/private user
data.

------------------------------------------------------------------------

# PART 15 --- AUTHENTICATION FLOW HARDENING

Verify:

-   signup
-   login
-   logout
-   Google login
-   password reset
-   session persistence
-   auth callback
-   invitation redirect
-   billing access

If user enters:

`/invite?token=XXXX`

while logged out:

preserve the token safely.

After authentication:

return to the invitation flow.

Avoid redirect loops.

Handle expired sessions cleanly.

Prevent unauthorized content flashes.

Ensure authenticated users do not get incorrectly redirected to login.

Ensure logged-out users cannot retain access to cached private data.

------------------------------------------------------------------------

# PART 16 --- ADMIN & PRIVILEGE TESTING

Verify:

`zobaerio24@gmail.com` → Admin

`zobaerhasan431@gmail.com` → Admin

Any other email → NOT Admin

Test attempts to manipulate:

-   localStorage
-   URL
-   frontend state
-   profile metadata
-   role fields
-   API requests
-   RPC parameters

Unauthorized users must fail server-side.

Test:

-   direct `/admin`
-   admin APIs
-   billing administration
-   payment approval
-   user management
-   affiliate/admin systems

Document every failed and successful security test.

------------------------------------------------------------------------

# PART 17 --- INVITATION & ROLE TESTING

Test:

-   Engineer invitation
-   Member invitation
-   Viewer invitation
-   real email
-   accept
-   reject
-   expired invitation
-   cancelled invitation
-   resend
-   duplicate invitation
-   wrong email
-   already-used token
-   unauthorized project
-   role permissions

Verify:

Viewer cannot write.

Engineer cannot access platform-admin features.

Member cannot access platform-admin features.

Only authorized project administrators can manage team members.

Attempt project-ID manipulation and role manipulation.

------------------------------------------------------------------------

# PART 18 --- DOMAIN & DEPLOYMENT TESTING

Test the intended domains:

-   https://civilosai.lovable.app
-   https://estimateai.pro.bd
-   https://civilosai.pro.bd
-   https://civilosai.vercel.app/

For each domain, where configured:

-   homepage
-   login
-   signup
-   Google login
-   callback
-   dashboard
-   projects
-   invitation
-   billing
-   payment request
-   admin
-   refresh
-   direct routes

If a domain is outside the current project/configuration, clearly
identify the external issue.

Do not claim successful verification without actual testing.

------------------------------------------------------------------------

# PART 19 --- BUILD, QA & PRODUCTION QUALITY

After implementation:

Run available:

-   TypeScript check
-   production build
-   lint
-   tests
-   route checks
-   browser verification

Fix:

-   TypeScript errors
-   broken imports
-   runtime errors
-   console errors
-   React warnings
-   broken routes
-   authentication errors
-   database/RLS errors

Review:

-   mobile UI
-   desktop UI
-   authentication
-   invitation
-   billing
-   admin security
-   PWA
-   SEO
-   performance

Do not suppress errors merely to make the build green.

------------------------------------------------------------------------

# PART 20 --- FINAL PRODUCTION AUDIT & GITHUB/VERCEL RELEASE

Perform one final end-to-end audit after all changes.

Verify:

### Architecture

Existing architecture preserved.

### Data

Production data preserved.

### Authentication

Login/signup/OAuth/reset work.

### Authorization

Server-side protection works.

### Admin

Only the two authorized admins have admin privileges.

### Team

Invitations and roles work.

### Billing

Payment/subscription records are consistent.

### Security

RLS and backend authorization prevent unauthorized access.

### Domains

Supported domains behave correctly.

### Routing

Deep links do not unexpectedly return 404.

### PWA

Install flow works.

### SEO

Public pages have correct metadata.

### UI

Responsive and accessible.

### Performance

No obvious unnecessary bottlenecks.

### Build

Production build succeeds.

------------------------------------------------------------------------

## GITHUB RELEASE REQUIREMENTS

Use the EXISTING GitHub repository.

Do NOT create a new repository.

Before committing:

1.  Review changed files.
2.  Remove debug code.
3.  Remove test credentials.
4.  Remove secrets.
5.  Check `.gitignore`.
6.  Confirm `.env` files containing secrets are not committed.
7.  Run build/checks.
8.  Review database migrations.
9.  Review Edge Functions.
10. Review `vercel.json`.

Use clear commit messages.

Example:

`feat: harden auth invitations billing and production security`

Then push to the existing GitHub repository.

------------------------------------------------------------------------

## VERCEL RELEASE REQUIREMENTS

The existing GitHub repository is connected to Vercel.

Do NOT create a new Vercel project.

After pushing:

-   verify the deployment starts
-   verify build succeeds
-   inspect deployment logs
-   inspect runtime errors
-   verify environment variables are configured
-   verify custom domain status
-   verify production routes
-   verify authentication
-   verify billing
-   verify invitation flow

If Vercel configuration is inaccessible, report exactly what must be
configured.

------------------------------------------------------------------------

## REQUIRED FINAL REPORT

After completing the full implementation, provide:

### 1. Completed

List every feature actually implemented.

### 2. Fixed

List every verified bug that was fixed.

### 3. Security

List important security improvements.

### 4. Database

List migrations/RLS/RPC changes.

### 5. Authentication

List auth/OAuth changes.

### 6. Invitation

List invitation/email changes.

### 7. Billing

List payment/subscription changes.

### 8. Domains

List domains successfully tested.

### 9. External configuration

List anything requiring manual changes in:

-   Supabase Dashboard
-   Google Cloud
-   Vercel
-   DNS
-   email provider

### 10. Environment variables

List only required variable NAMES. Never reveal values.

### 11. Build

Report build/typecheck/lint/test results.

### 12. Deployment

Report GitHub/Vercel deployment status.

### 13. Remaining issues

Do not hide unresolved issues.

------------------------------------------------------------------------

# NON-NEGOTIABLE RULE

Do not say:

"Done"

"Fixed"

"Production-ready"

unless the corresponding implementation was actually completed and
verified.

When something cannot be verified, say:

**"Implemented but not externally verified."**

When something requires external configuration, say:

**"Code-side implementation complete; external configuration
required."**

Always prioritize:

**Security → Data Integrity → Authentication → Authorization →
Functionality → Performance → UI polish**

END OF CIVILOS AI FULL PRODUCTION MASTER PROMPT
