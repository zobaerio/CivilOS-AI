import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  Loader2, Send, Bot, User as UserIcon, Trash2, Copy, RefreshCw, Plus,
  MessageSquare, Sparkles, BookOpen, Calculator, Ruler, ClipboardList,
  FileText, HardHat, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";

interface Msg { role: "user" | "assistant"; content: string }
interface Conversation { id: string; title: string; messages: Msg[]; updatedAt: number }

const STORAGE_KEY = "civilos-ai-engineer-conversations";
const ACTIVE_KEY = "civilos-ai-engineer-active";

const CATEGORIES = [
  { icon: BookOpen, label: "BNBC Questions", prompt: "BNBC 2022 অনুযায়ী " },
  { icon: ClipboardList, label: "BOQ Help", prompt: "PWD rate অনুযায়ী BOQ prepare করতে সাহায্য করুন: " },
  { icon: Calculator, label: "RCC Calculations", prompt: "RCC design calculation করে দিন: " },
  { icon: Ruler, label: "Structural Analysis", prompt: "Structural analysis দরকার — " },
  { icon: HardHat, label: "Estimation Help", prompt: "Construction cost estimation করে দিন: " },
  { icon: FileText, label: "Drawing Questions", prompt: "Drawing / detailing সম্পর্কিত প্রশ্ন: " },
  { icon: Wrench, label: "Tender Queries", prompt: "Tender document analysis: " },
  { icon: Sparkles, label: "General Engineering", prompt: "" },
];

const TEMPLATES = [
  "Calculate RCC beam design for 5m span with 25 kN/m UDL as per BNBC 2022 & ACI 318.",
  "Generate BOQ for 2-storey RCC residential building, 1200 sft/floor in Dhaka.",
  "Explain BNBC 2022 clause on seismic zone 2 detailing for RCC frame.",
  "Check tender eligibility criteria for a PWD Class-I contractor road project.",
  "Design a T-beam footing for 800 kN column load, safe bearing 150 kN/m² per BNBC.",
  "Estimate rebar quantity (BBS) for 1200 sft slab, 5\" thick with 12mm @6\" c/c.",
];

const newId = () => `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export default function AIEngineerPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(ACTIVE_KEY) || "";
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Bootstrap first conversation
  useEffect(() => {
    if (conversations.length === 0) {
      const c: Conversation = { id: newId(), title: "New chat", messages: [], updatedAt: Date.now() };
      setConversations([c]);
      setActiveId(c.id);
    } else if (!activeId || !conversations.find(c => c.id === activeId)) {
      setActiveId(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { if (activeId) localStorage.setItem(ACTIVE_KEY, activeId); }, [activeId]);

  const active = useMemo(() => conversations.find(c => c.id === activeId), [conversations, activeId]);
  const messages = active?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);
  useEffect(() => { inputRef.current?.focus(); }, [activeId]);

  const updateActive = (updater: (c: Conversation) => Conversation) =>
    setConversations(prev => prev.map(c => c.id === activeId ? updater(c) : c));

  const send = async (text?: string, replaceLast = false) => {
    const content = (text ?? input).trim();
    if (!content || streaming || !active) return;

    let history: Msg[];
    if (replaceLast) {
      // regenerate: drop last assistant msg, keep last user
      history = active.messages.slice(0, -1);
    } else {
      history = [...active.messages, { role: "user", content }];
    }

    const draft: Msg[] = [...history, { role: "assistant", content: "" }];
    updateActive(c => ({
      ...c,
      title: c.title === "New chat" ? content.slice(0, 40) : c.title,
      messages: draft,
      updatedAt: Date.now(),
    }));
    setInput("");
    setStreaming(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: history }),
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
              updateActive(c => {
                const copy = [...c.messages];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return { ...c, messages: copy, updatedAt: Date.now() };
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chat failed");
      updateActive(c => ({ ...c, messages: c.messages.slice(0, -1) }));
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const newChat = () => {
    const c: Conversation = { id: newId(), title: "New chat", messages: [], updatedAt: Date.now() };
    setConversations(prev => [c, ...prev]);
    setActiveId(c.id);
  };

  const deleteChat = (id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (id === activeId) setActiveId(next[0]?.id ?? "");
      return next;
    });
  };

  const clearActive = () => updateActive(c => ({ ...c, messages: [], title: "New chat" }));

  const regenerate = () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (lastUser) send(lastUser.content, true);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
  };

  const [historyQuery, setHistoryQuery] = useState("");
  const filteredHistory = conversations
    .filter(c => !historyQuery || c.title.toLowerCase().includes(historyQuery.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (authLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <>
      <SEO
        title="AI Engineering Assistant — CivilOS AI"
        description="ChatGPT-style civil engineering assistant. BNBC 2020/2022, PWD/LGED rates, RCC design, BOQ & tender help — Bangla & English."
        url="/ai-engineer"
      />
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1 flex flex-col h-screen min-w-0">
            <header className="h-14 border-b flex items-center justify-between px-3 sm:px-4 shrink-0 bg-background/95 backdrop-blur sticky top-0 z-10">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger />
                <Bot className="h-4 w-4 text-accent shrink-0" />
                <div className="min-w-0">
                  <h1 className="font-heading text-sm sm:text-base font-bold leading-tight truncate">AI Engineering Assistant</h1>
                  <p className="text-[10px] text-muted-foreground leading-tight truncate">BNBC · PWD · LGED · RCC · BOQ</p>
                </div>
              </div>
              <ThemeToggle />
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-0">
              {/* Left pane: history + quick prompts */}
              <aside className="hidden lg:flex flex-col border-r bg-muted/20 min-h-0">
                <div className="p-3 space-y-2 border-b">
                  <Button onClick={newChat} className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> New chat
                  </Button>
                  <Input
                    value={historyQuery}
                    onChange={(e) => setHistoryQuery(e.target.value)}
                    placeholder="Search history..."
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">Recent</p>
                  {filteredHistory.length === 0 && (
                    <p className="text-xs text-muted-foreground px-2 py-4 text-center">No conversations</p>
                  )}
                  {filteredHistory.map(c => (
                    <div
                      key={c.id}
                      className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                        c.id === activeId ? "bg-accent/15 text-foreground" : "hover:bg-muted"
                      }`}
                      onClick={() => setActiveId(c.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{c.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t p-2 space-y-1 max-h-[45%] overflow-y-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">Quick prompts</p>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.label}
                      onClick={() => { setInput(cat.prompt); inputRef.current?.focus(); }}
                      className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition text-left"
                    >
                      <cat.icon className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </aside>

              {/* Right pane: chat */}
              <section className="flex flex-col min-h-0">
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b bg-background/50 shrink-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {active?.title || "New chat"} · {messages.length} messages
                  </p>
                  <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                      <>
                        <Button size="sm" variant="ghost" onClick={regenerate} disabled={streaming} title="Regenerate">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={clearActive} title="Clear chat">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={newChat} className="lg:hidden">
                      <Plus className="h-3.5 w-3.5 mr-1" /> New
                    </Button>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-6">
                  <div className="max-w-3xl mx-auto space-y-5">
                    {messages.length === 0 && (
                      <div className="space-y-6">
                        <div className="text-center space-y-3">
                          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                            <Sparkles className="h-8 w-8 text-accent" />
                          </div>
                          <h2 className="font-heading text-xl sm:text-2xl font-bold">Ask anything — engineer to engineer</h2>
                          <p className="text-xs sm:text-sm text-muted-foreground">BNBC 2020/2022 · PWD & LGED rates · RCC design · BOQ · Tender</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:hidden">
                          {CATEGORIES.slice(0, 8).map(cat => (
                            <button
                              key={cat.label}
                              onClick={() => { setInput(cat.prompt); inputRef.current?.focus(); }}
                              className="flex flex-col items-center gap-1 rounded-xl border bg-card px-2 py-3 text-[11px] hover:border-primary/50 transition"
                            >
                              <cat.icon className="h-4 w-4 text-accent" />
                              <span className="truncate w-full text-center">{cat.label}</span>
                            </button>
                          ))}
                        </div>

                        <Card className="p-3 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Engineering templates</p>
                          <div className="grid gap-1.5">
                            {TEMPLATES.map(t => (
                              <button
                                key={t}
                                onClick={() => send(t)}
                                className="text-left text-xs rounded-md border bg-background px-2.5 py-2 hover:border-primary/50 hover:bg-accent/5 transition"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </Card>
                      </div>
                    )}

                    {messages.map((m, i) => (
                      <div key={i} className={`flex gap-2 sm:gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`h-8 w-8 shrink-0 rounded-full grid place-items-center ${
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent/15 text-accent"
                        }`}>
                          {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`group rounded-2xl px-3 sm:px-4 py-2.5 max-w-[85%] ${
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {m.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:text-xs prose-code:text-xs prose-table:text-xs">
                              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{m.content || "…"}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                          )}
                          {m.content && (
                            <div className={`flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition ${m.role === "user" ? "justify-end" : ""}`}>
                              <button onClick={() => copy(m.content)} className="text-[10px] inline-flex items-center gap-0.5 opacity-70 hover:opacity-100" title="Copy">
                                <Copy className="h-3 w-3" /> Copy
                              </button>
                              {m.role === "assistant" && i === messages.length - 1 && !streaming && (
                                <button onClick={regenerate} className="text-[10px] inline-flex items-center gap-0.5 opacity-70 hover:opacity-100" title="Regenerate">
                                  <RefreshCw className="h-3 w-3" /> Regenerate
                                </button>
                              )}
                            </div>
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
                      placeholder="Civil engineering question likhun… (Enter to send, Shift+Enter for newline)"
                      rows={1}
                      className="min-h-[44px] max-h-40 resize-none text-sm"
                      disabled={streaming}
                    />
                    <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
                      {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Powered by Lovable AI · Verify critical calculations against BNBC / PWD schedules.
                  </p>
                </div>
              </section>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
