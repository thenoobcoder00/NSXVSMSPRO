// Proxy: Get Number
app.get("/api/getnum", async (req, res) => {
  try {
    const settings = await getApiSettings();
    const targetUrl = new URL(`${settings.baseUrl}/getnum`);
    
    const rid = (req.query.rid as string) || (req.query.id as string) || "22465XXX";

    console.log(`[Proxy GetNum] Requesting operator code: ${rid} from baseUrl: ${settings.baseUrl}`);

    const response = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "mauthapi": settings.apiKey,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({ rid })
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error(`[Proxy GetNum] Failed to parse third-party JSON. Status: ${response.status}. Raw response:`, responseText);
      return res.status(502).json({
        error: `Third-party service returned non-JSON response (Status ${response.status})`,
        details: responseText.slice(0, 500)
      });
    }

    console.log("[Proxy GetNum] Parsed response successfully:", JSON.stringify(data));

    // Modified logic starts here
    const info = data?.data || data;

    const number =
      info?.full_number ||
      info?.no_plus_number ||
      info?.national_number ||
      info?.number ||
      info?.phone;

    const id =
      info?.rid ||
      info?.id ||
      data?.rid ||
      `session-${Date.now()}`;

    if (number) {
      return res.json({
        number,
        country: info?.country || "Unknown",
        id,
      });
    }

    return res.status(400).json({
      error: data?.message || data?.meta?.msg || "No virtual number available.",
      details: data,
    });
    // Modified logic ends here

  } catch (error: any) {
    console.error("Error in getnum proxy:", error);
    res.status(500).json({ error: "Failed to fetch virtual number", details: error.message });
  }
});