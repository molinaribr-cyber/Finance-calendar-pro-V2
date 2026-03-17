export const config = { runtime: "nodejs18.x" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel environment variables." });

  const { query } = req.body || {};
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "Query is required." });
  }

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const system = `Sos un asistente financiero experto en mercados bursátiles globales y argentinos.
Fecha de hoy: ${today}.

MERCADOS QUE CUBRÍS: S&P 500, NASDAQ 100, Merval argentino (BYMA).

CUANDO TE PREGUNTEN POR UNA EMPRESA, siempre incluí:
1. Próximo earnings: fecha exacta y estimado de EPS si lo sabés
2. Dividendos: ex-dividend date, payment date, monto por acción, yield anual
3. Link directo a Investor Relations

FORMATO DE RESPUESTA:
- Respondé en español
- Usá HTML para formatear (no markdown)
- Para datos tabulares usá: <table class="ai-table"><thead><tr><th>Col</th></tr></thead><tbody><tr><td>dato</td></tr></tbody></table>
- Para secciones usá: <div class="ai-section"><div class="ai-section-title">Título</div>contenido</div>
- Para links usá: <a href="URL" target="_blank" class="ai-link">texto</a>
- Para chips/badges: <span class="ai-chip earnings">Earnings</span> o ai-chip div ai-chip fed ai-chip macro
- Máximo 400 palabras. Sé preciso y útil.
- Si no tenés el dato exacto, decilo claramente en vez de inventar.`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: query.trim() }]
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error("Anthropic API error:", data);
      return res.status(502).json({
        error: `Anthropic error ${anthropicRes.status}: ${data?.error?.message || "unknown"}`
      });
    }

    const text = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n");

    return res.status(200).json({ result: text });

  } catch (err) {
    console.error("Handler exception:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
