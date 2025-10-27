// POST /api/sms/send
// Body: { recipients: Array<{ phone: string, message: string, meta?: any }>, dryRun?: boolean }
// Returns: { results: Array<{ phone, success, provider, error? }>, dryRun }

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
    const isTwilio = provider === "twilio";
    const dryRun = forceDryRun || provider === "mock";

    let twilioClient = null;
    if (isTwilio && !dryRun) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM_NUMBER;
      if (!sid || !token || !from) {
        return Response.json(
          { code: "ERROR", message: "Twilio is not fully configured (missing SID/TOKEN/FROM)" },
          { status: 500 }
        );
      }
      try {
        // Lazy-load twilio only when used, to avoid build-time dependency if not configured
        const twilio = (await import("twilio")).default;
        twilioClient = twilio(sid, token);
      } catch (e) {
        return Response.json(
          { code: "ERROR", message: "Twilio SDK not installed. Run: npm i twilio" },
          { status: 500 }
        );
      }
    }

    const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.SMS_FROM_NUMBER || "";

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

      if (isTwilio && twilioClient) {
        try {
          await twilioClient.messages.create({ to: phone, from: fromNumber, body: message });
          results.push({ phone, success: true, provider: "twilio" });
        } catch (e) {
          console.error("Twilio send error", e);
          results.push({ phone, success: false, provider: "twilio", error: e?.message || "Unknown error" });
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
