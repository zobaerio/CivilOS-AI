import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Bot, RotateCcw, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string; status?: string };
const STORE = (t: string) => `civilos.agent.${t}`;

export const STATUS_TONE: Record<string, string> = {
  completed: "bg-primary/15 text-primary", failed: "bg-destructive/15 text-destructive", awaiting_approval: "bg-accent/20 text-accent-foreground",
  executing: "bg-secondary text-secondary-foreground", planning: "bg-secondary text-secondary-foreground", cancelled: "bg-muted text-muted-foreground", blocked: "bg-destructive/15 text-destructive",
};

export async function callAgent(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("agent", { body });
  if (error) {
    let msg = error.message;
    try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return data as any;
}

export default function AgentConsole({ agentType, examples, onTask }: { agentType: "admin" | "user"; examples: string[]; onTask?: () => void }) {
  const { lang } = useI18n();
  const T = (en: string, bn: string) => (lang === "bn" ? bn : en);
  const [msgs, setMsgs] = useState<Msg[]>(() => { try { return JSON.parse(localStorage.getItem(STORE(agentType)) || "[]"); } catch { return []; } });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(STORE(agentType), JSON.stringify(msgs.slice(-40))); end.current?.scrollIntoView({ block: "end" }); }, [msgs, agentType]);
  useEffect(() => { box.current?.focus(); }, [busy]);

  const send = async (text = input) => {
    const m = text.trim(); if (!m || busy) return;
    const history = msgs.slice(-10).map(({ role, content }) => ({ role, content }));
    setMsgs((p) => [...p, { role: "user", content: m }]); setInput(""); setBusy(true);
    try {
      const r = await callAgent({ action: "run", agent_type: agentType, message: m, history });
      setMsgs((p) => [...p, { role: "assistant", content: r.reply || T("(no reply)", "(উত্তর নেই)"), status: r.status }]);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      toast.error(err);
      setMsgs((p) => [...p, { role: "assistant", content: `⚠️ ${err}`, status: "failed" }]);
    } finally { setBusy(false); onTask?.(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[420px] rounded-xl border bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2 text-sm font-medium"><Bot className="h-4 w-4 text-primary" />{agentType === "admin" ? "Admin Agent" : T("Your Agent", "আপনার এজেন্ট")}</div>
        {msgs.length > 0 && <Button size="sm" variant="ghost" onClick={() => setMsgs([])}><RotateCcw className="h-3.5 w-3.5 mr-1" />{T("New", "নতুন")}</Button>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgs.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <p className="text-sm text-muted-foreground">{T("Tell the agent what to do — it will act, check the result and report back.", "এজেন্টকে কাজ বলুন — সে কাজ করবে, ফল যাচাই করবে আর জানাবে।")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {examples.map((e) => <Button key={e} variant="outline" size="sm" className="h-auto py-1.5 whitespace-normal text-left" onClick={() => send(e)}>{e}</Button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => m.role === "user" ? (
          <div key={i} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3.5 py-2 text-sm whitespace-pre-wrap">{m.content}</div></div>
        ) : (
          <div key={i} className="max-w-[92%] space-y-1">
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground"><ReactMarkdown>{m.content}</ReactMarkdown></div>
            {m.status && <Badge variant="secondary" className={`text-[10px] ${STATUS_TONE[m.status] || ""}`}>{m.status === "awaiting_approval" && <ShieldAlert className="h-3 w-3 mr-1" />}{m.status.replace("_", " ")}</Badge>}
          </div>
        ))}
        {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{T("Planning, running tools and verifying…", "পরিকল্পনা, কাজ ও যাচাই চলছে…")}</div>}
        <div ref={end} />
      </div>
      <form className="border-t p-3 flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Textarea ref={box} value={input} onChange={(e) => setInput(e.target.value)} rows={1} className="min-h-[44px] max-h-32 resize-none"
          placeholder={agentType === "admin" ? T("e.g. Check system health", "যেমন: সিস্টেম হেলথ দেখাও") : T("e.g. Turn on BIM Studio", "যেমন: BIM Studio on করো")}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} disabled={busy} />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={busy || !input.trim()} aria-label="Send">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
      </form>
    </div>
  );
}
