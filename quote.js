export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker required" });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FinanceCalendar/1.0)",
        "Accept": "application/json"
      }
    });
    if (!r.ok) return res.status(502).json({ error: `Yahoo returned ${r.status}` });
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return res.status(404).json({ error: "No data found" });

    return res.status(200).json({
      ticker: meta.symbol,
      price: meta.regularMarketPrice,
      prevClose: meta.chartPreviousClose,
      currency: meta.currency,
      exchange: meta.exchangeName
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
