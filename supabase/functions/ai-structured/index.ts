// CivilOS AI — structured JSON responses for Tender Analysis & BOQ generation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  tender: `You are CivilOS AI tender analyst. Given a tender document text, return JSON ONLY (no markdown fences) with shape:
{
  "summary": "3-5 sentence executive summary",
  "boq_items": [{"item":"","unit":"","qty":0,"notes":""}],
  "risks": [{"title":"","severity":"low|medium|high","detail":""}],
  "deadlines": [{"event":"","date":"YYYY-MM-DD or text","notes":""}]
}
Focus on Bangladesh PWD / RAJUK / BNBC context. If a field is unknown, return empty array.`,
  boq: `You are CivilOS AI BOQ generator for Bangladesh civil works (PWD rate schedule basis).
Given a project description, return JSON ONLY:
{
  "summary":"short scope summary",
  "boq_items":[{"item":"","unit":"","qty":0,"rate_bdt":0,"amount_bdt":0,"notes":""}],
  "total_bdt":0,
  "assumptions":["..."]
}
Use realistic PWD rates. amount = qty*rate_bdt. total = sum of amounts.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { mode, input } = await req.json() as { mode: "tender" | "boq"; input: string };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const sys = SYSTEM_PROMPTS[mode];
    if (!sys || !input || typeof input !== "string") {
      return new Response(JSON.stringify({ error: "mode (tender|boq) and input required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: input.slice(0, 60000) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit — try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-structured error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
