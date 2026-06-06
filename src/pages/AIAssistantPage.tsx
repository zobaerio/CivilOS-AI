import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { Loader2, Send, Sparkles, Bot, User as UserIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "RCC slab er minimum thickness koto BNBC 2020 onujayi?",
  "1000 sqft duplex bari banate koto rod & cement lagbe?",
  "M20 concrete er mix ratio o 28-day strength bujhiye dao.",
  "Earthquake zone 2 te footing design er checklist dao.",
];

const STORAGE_KEY = "civilos-ai-chat";

const AIAssistantPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, streaming]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const ln of lines) {
          const l = ln.trim();
          if (!l.startsWith("data:")) continue;
          const data = l.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Chat failed");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const clear = () => { setMessages([]); localStorage.removeItem(STORAGE_KEY); };

  if (authLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <>
      <SEO title="AI Assistant — CivilOS AI" description="Ask any civil engineering question. BNBC 2020 aware AI assistant for engineers in Bangladesh." canonical="/ai-assistant" />
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1 flex flex-col h-screen">
            <header className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
              <SidebarTrigger />
              <Bot className="h-5 w-5 text-accent" />
              <div className="flex-1 min-w-0">
                <h1 className="font-heading font-bold leading-tight">CivilOS AI Assistant</h1>
                <p className="text-xs text-muted-foreground leading-tight">BNBC 2020 aware • Bangla & English</p>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clear}><Trash2 className="h-4 w-4" /></Button>
              )}
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-10 space-y-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                      <Sparkles className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-heading text-2xl font-bold">How can I help you today?</h2>
                      <p className="text-sm text-muted-foreground mt-1">Ask anything about civil engineering, BNBC, estimates, or design.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 max-w-xl mx-auto text-left">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => send(s)} className="rounded-xl border bg-card hover:border-primary/50 hover:bg-accent/5 transition p-3 text-sm">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`h-8 w-8 shrink-0 rounded-full grid place-items-center ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent/15 text-accent"}`}>
                      {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-background/60">
                          <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {streaming && messages[messages.length - 1]?.content === "" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pl-11">
                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                  </div>
                )}
              </div>
            </div>

            <div className="border-t bg-background/80 backdrop-blur px-3 sm:px-6 py-3 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="max-w-3xl mx-auto flex gap-2 items-end">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Civil engineering question likhun…"
                  rows={1}
                  className="min-h-[44px] max-h-40 resize-none"
                  disabled={streaming}
                />
                <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
                  {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground text-center mt-2">CivilOS AI may produce inaccuracies. Verify critical calculations.</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
};

export default AIAssistantPage;
