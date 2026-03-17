export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada en Vercel → Settings → Environment Variables" });
  }

  const { query } = req.body || {};
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "Query requerida." });
  }

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const system = `Sos un asistente financiero experto en S&P 500, NASDAQ 100 y Merval argentino.
Fecha actual: ${today}.

Cuando te pregunten por una empresa, siempre intentá incluir:
- Próximo earnings: fecha estimada y consensus EPS
- Dividendos: ex-date, payment date, monto por acción, yield anual
- Link directo a Investor Relations oficial

FORMATO DE RESPUESTA — usá solo HTML, nunca markdown:
- Tablas: <table class="ai-table"><thead><tr><th>Col</th></tr></thead><tbody><tr><td>dato</td></tr></tbody></table>
- Links: <a href="URL" target="_blank" class="ai-link">texto</a>
- Negrita: <strong>texto</strong>
- Párrafos: <p>texto</p>
- Si no tenés el dato exacto, decilo claramente. No inventes fechas ni números.
- Respondé en español, máximo 350 palabras.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
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

    const data = await r.json();

    if (!r.ok) {
      return res.status(502).json({
        error: `Anthropic ${r.status}: ${data?.error?.message || JSON.stringify(data)}`
      });
    }

    const text = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n");

    return res.status(200).json({ result: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
