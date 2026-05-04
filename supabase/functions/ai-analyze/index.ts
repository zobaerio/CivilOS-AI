// AI Thinking — multimodal analyzer for any uploaded file/image
// Uses Lovable AI (Gemini 2.5 Pro) for visual + textual reasoning.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert civil & structural engineer for Bangladesh (BNBC 2020).
You receive uploads (images, floor plans, PDFs, DXF, photos, sketches) from a user building a house.
Analyse what you see CAREFULLY and respond ONLY with valid JSON of this shape:
{
  "summary": string,                         // 2-3 sentence professional summary
  "detected": {
    "buildingType": string,
    "estimatedArea_sqft": number | null,
    "estimatedFloors": number | null,
    "rooms": string[]
  },
  "engineeringNotes": string[],              // 4-8 BNBC-aligned observations
  "warnings": string[],                      // safety / code concerns
  "recommendations": string[],               // 4-8 concrete next steps
  "estimateHints": {
    "suggestedQuality": "standard" | "premium" | "luxury",
    "specialConsiderations": string[]
  }
}
Be accurate. If unsure, say so in 'warnings' rather than guessing numbers.
Never invent dimensions you cannot infer. Output JSON only, no markdown.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileName, mimeType, dataUrl, textContent, userPrompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userContent: any[] = [];
    const intro = `File: ${fileName || "(unnamed)"} • Type: ${mimeType || "unknown"}
${userPrompt ? `User request: ${userPrompt}` : "Please analyse this upload for a Bangladeshi house design."}`;
    userContent.push({ type: "text", text: intro });

    if (dataUrl && typeof dataUrl === "string" && dataUrl.startsWith("data:image")) {
      userContent.push({ type: "image_url", image_url: { url: dataUrl } });
    }
    if (textContent && typeof textContent === "string") {
      const truncated = textContent.slice(0, 60000);
      userContent.push({ type: "text", text: `\n--- File text content ---\n${truncated}` });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { summary: raw, detected: {}, engineeringNotes: [], warnings: [], recommendations: [], estimateHints: {} };
    }

    return new Response(JSON.stringify({ ok: true, analysis: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-analyze error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
