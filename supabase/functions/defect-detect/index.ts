// AI Defect Detection — analyses a site photo for construction defects.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PROMPT = `You are a senior civil/structural QA inspector in Bangladesh (BNBC 2020).
Inspect the construction site photo and list visible defects: cracks (hairline/structural/shrinkage),
honeycombing, exposed or corroded rebar, spalling, dampness/seepage, efflorescence, poor masonry joints,
misalignment, inadequate cover, formwork issues, unsafe scaffolding/missing PPE.
Only report what is actually visible; if the image is not a construction scene, return no defects and say so in summary.
Write summary, description and action in LANGUAGE.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "overallRisk", "defects"],
  properties: {
    summary: { type: "string" },
    overallRisk: { type: "string", enum: ["low", "medium", "high", "critical"] },
    defects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "severity", "location", "description", "action"],
        properties: {
          type: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          location: { type: "string" },
          description: { type: "string" },
          action: { type: "string" },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { dataUrl, note, lang } = await req.json();
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return json({ error: "Image required" }, 400);
    if (dataUrl.length > 8_000_000) return json({ error: "Image too large (max ~6MB)" }, 400);
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "AI not configured" }, 500);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "defects", strict: true, schema: SCHEMA } },
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: PROMPT.replace("LANGUAGE", lang === "bn" ? "Bengali" : "English") + (note ? `\nInspector note: ${String(note).slice(0, 500)}` : "") },
            { type: "input_image", image_url: dataUrl },
          ],
        }],
      }),
    });
    if (!resp.ok || !resp.body) {
      const t = await resp.text();
      const msg = resp.status === 429 ? "Too many requests, try again shortly." : resp.status === 402 ? "AI credits exhausted." : `AI error (${resp.status})`;
      console.error("gateway", resp.status, t.slice(0, 500));
      return json({ error: msg }, resp.status);
    }
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        const d = l.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
          if (ev.type === "response.failed" || ev.type === "error") return json({ error: "AI analysis failed" }, 502);
        } catch { /* ignore */ }
      }
    }
    if (!out) return json({ error: "AI returned no result" }, 502);
    return json(JSON.parse(out));
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
