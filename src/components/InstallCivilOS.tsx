import { useEffect, useState } from "react";
import { Download, MonitorDown, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { usePwaInstall } from "@/lib/pwa";

const DISMISSED_KEY = "civilos-install-prompt-dismissed";

export default function InstallCivilOS({ triggerOnly = false }: { triggerOnly?: boolean }) {
  const { user } = useAuth();
  const { canInstall, isInstalled, isIos, install } = usePwaInstall();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (triggerOnly || !user || isInstalled) return;
    if (window.localStorage.getItem(DISMISSED_KEY) === user.id) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [isInstalled, triggerOnly, user]);

  useEffect(() => {
    if (triggerOnly) return;
    const show = () => setOpen(true);
    window.addEventListener("civilos:show-install", show);
    return () => window.removeEventListener("civilos:show-install", show);
  }, [triggerOnly]);

  if (isInstalled) return null;

  const close = () => {
    if (user) window.localStorage.setItem(DISMISSED_KEY, user.id);
    setOpen(false);
  };
  const beginInstall = async () => {
    const accepted = await install();
    if (accepted) setOpen(false);
    else if (!canInstall) setOpen(true);
  };

  if (triggerOnly) {
    return (
      <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new Event("civilos:show-install"))} className="w-full justify-start gap-2">
        <Download className="h-4 w-4" /> Install CivilOS AI
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => next ? setOpen(true) : close()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary sm:mx-0">
            <MonitorDown className="h-7 w-7" />
          </div>
          <DialogTitle>Install CivilOS AI</DialogTitle>
          <DialogDescription>
            Open your civil engineering workspace from your home screen with a focused, app-like experience.
          </DialogDescription>
        </DialogHeader>
        {!canInstall && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            {isIos ? (
              <p className="flex gap-2"><Share className="mt-0.5 h-4 w-4 shrink-0" /> In Safari, tap Share, then choose “Add to Home Screen”.</p>
            ) : (
              <p className="flex gap-2"><Smartphone className="mt-0.5 h-4 w-4 shrink-0" /> Open the browser menu and choose “Install app” or “Add to Home screen”.</p>
            )}
          </div>
        )}
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="ghost" onClick={close}>Not now</Button>
          <Button onClick={beginInstall} disabled={!canInstall}>
            <Download className="mr-2 h-4 w-4" /> {canInstall ? "Install" : "Use browser menu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}