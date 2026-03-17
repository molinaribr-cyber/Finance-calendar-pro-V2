export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      status: "ERROR",
      problem: "ANTHROPIC_API_KEY no está configurada en Vercel → Settings → Environment Variables"
    });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 20,
        messages: [{ role: "user", content: "Say OK" }]
      })
    });
    const d = await r.json();
    if (r.ok) {
      return res.status(200).json({ status: "OK", message: "API conectada y funcionando correctamente." });
    } else {
      return res.status(200).json({ status: "ERROR", httpStatus: r.status, detail: d?.error?.message });
    }
  } catch (e) {
    return res.status(200).json({ status: "ERROR", problem: e.message });
  }
}
