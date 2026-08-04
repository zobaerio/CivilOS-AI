import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State { failed: boolean }

class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CivilOS AI initialization failed", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary font-heading text-xl font-bold text-primary-foreground">C</div>
            <h1 className="font-heading text-xl font-bold">CivilOS AI couldn't load your workspace.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button className="mt-6" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;