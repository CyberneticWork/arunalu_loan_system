// POST /api/sms/send
// Body: { recipients: Array<{ phone: string, message: string, meta?: any }>, dryRun?: boolean }
// Returns: { results: Array<{ phone, success, provider, error?, response? }>, dryRun }

async function sendViaTextLk(recipient, message) {
  const token = process.env.TEXTLK_API_TOKEN;
  const base = (process.env.TEXTLK_API_BASE || "https://app.text.lk/api/v3").replace(/\/$/, "");
  const senderId = process.env.TEXTLK_SENDER_ID || undefined;

  if (!token) {
    return { ok: false, error: "TEXTLK_API_TOKEN is not set" };
  }

  // Primary attempt: OAuth v3 JSON API
  try {
    const res = await fetch(`${base}/sms/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient,
        message,
        type: "plain",  // Required by text.lk API for text messages
        ...(senderId ? { sender_id: senderId } : {}),
      }),
      // Ensure we don't cache
      cache: "no-store",
    });

    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = await res.text();
    }

    if (res.ok) {
      return { ok: true, response: payload };
    }
    return { ok: false, error: `text.lk v3 error ${res.status}`, response: payload };
  } catch (e) {
    return { ok: false, error: e?.message || "Network error (text.lk v3)" };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { recipients = [], dryRun: forceDryRun } = body || {};

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return Response.json(
        { code: "ERROR", message: "No recipients provided" },
        { status: 400 }
      );
    }

    const provider = (process.env.SMS_PROVIDER || "mock").toLowerCase();
    const isTextLk = provider === "textlk" || provider === "text-lk";
    const dryRun = forceDryRun || provider === "mock";

    const results = [];

    for (const r of recipients) {
      const phone = String(r.phone || "").trim();
      const message = String(r.message || "").trim();
      if (!phone || !message) {
        results.push({ phone, success: false, provider, error: "Missing phone or message" });
        continue;
      }

      if (dryRun) {
        console.log(`[SMS DRY-RUN] To: ${phone} | Msg: ${message}`);
        results.push({ phone, success: true, provider: provider === "mock" ? "mock" : provider });
        continue;
      }

      if (isTextLk) {
        const sendRes = await sendViaTextLk(phone, message);
        if (sendRes.ok) {
          results.push({ phone, success: true, provider: "textlk", response: sendRes.response });
        } else {
          results.push({ phone, success: false, provider: "textlk", error: sendRes.error, response: sendRes.response });
        }
        continue;
      }

      // Fallback: treat as mock if unknown provider
      console.log(`[SMS MOCK] Provider ${provider} not supported in this build. To: ${phone} | Msg: ${message}`);
      results.push({ phone, success: true, provider: provider });
    }

    return Response.json({ code: "SUCCESS", data: { results, dryRun } });
  } catch (error) {
    console.error("SMS send API error:", error);
    return Response.json({ code: "ERROR", message: "Failed to send messages" }, { status: 500 });
  }
}
