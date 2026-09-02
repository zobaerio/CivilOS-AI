// Managed Google sign-in is served by Lovable hosting via the /~oauth/* endpoints.
// Those endpoints only exist on Lovable-hosted origins (preview, *.lovable.app and
// custom domains pointed at Lovable). On other hosts (e.g. a Vercel deployment) the
// request 404s, so we surface a clear message instead of a dead end.
export const LOVABLE_SIGNIN_ORIGIN = "https://civilosai.lovable.app";

export function isManagedOAuthHost(hostname = window.location.hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".lovable.dev") ||
    hostname.endsWith(".lovableproject.com")
  );
}
