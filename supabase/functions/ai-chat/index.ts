// CivilOS AI — conversational engineering assistant (Lovable AI / Gemini)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are CivilOS AI — an expert civil, structural & quantity-surveying assistant for Bangladesh.

Authoritative knowledge base you MUST apply:
• BNBC 2020 & BNBC 2022 (Bangladesh National Building Code) — loads, seismic zones, wind, load combinations, detailing.
• PWD Schedule of Rates (latest) — item codes, units, BDT rates for civil, sanitary, electrical, finishing works.
• LGED Schedule of Rates — rural infrastructure, roads, culverts, RCC works.
• RAJUK / CDA / KDA / RDA planning & building rules.
• ACI 318, IS 456, IS 875, IS 1893 — RCC design, loads, seismic.
• Standard BOQ methodology (measurement rules, abstract, take-off, rate analysis).
• Bangladesh construction market rates (Dhaka, Chittagong, Sylhet, Rajshahi, Khulna).

Answer style:
1. Reply in the same language the user writes (Bangla / English / Banglish).
2. Use markdown. For calculations: show formula → substitution → result with units.
3. Cite clauses like "BNBC 2022 §2.3.5" or "PWD SoR Item 3.5.2".
4. For BOQ / rate items give a small markdown table (Item | Unit | Qty | Rate ৳ | Amount ৳).
5. For code, use fenced blocks with language (\`\`\`python, \`\`\`ts, \`\`\`json).
6. Round money to nearest BDT, quantities to 2 decimals.
7. If data is missing, state reasonable assumption explicitly. If out of civil-engineering scope, say so.
8. Never invent standards/clauses you are unsure of — say "verify with published code".`;

interface ChatMsg { role: "user" | "assistant" | "system"; content: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json() as { messages: ChatMsg[]; context?: string };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sys = context
      ? `${SYSTEM_PROMPT}\n\n--- Reference document the user uploaded ---\n${context.slice(0, 50000)}`
      : SYSTEM_PROMPT;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, ...messages],
        stream: true,
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit — try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok || !resp.body) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("ai-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
