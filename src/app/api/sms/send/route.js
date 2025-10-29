// POST /api/sms/send
// Body: { recipients: Array<{ phone: string, message: string, meta?: any }>, dryRun?: boolean }
// Returns: { results: Array<{ phone, success, provider, error?, response?, meta? }>, dryRun }

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

function getLogsDir() {
  // Keep logs under the existing folder in the repo. Falls back to project root if not found.
  const base = path.resolve(process.cwd(), "src", "app", "api", "sms", "logs");
  return base;
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function appendSendLog(entries) {
  if (!entries || entries.length === 0) return;
  const dir = getLogsDir();
  const file = path.join(dir, `${todayKey()}.json`);
  try {
    await fs.mkdir(dir, { recursive: true });
    let current = [];
    try {
      const raw = await fs.readFile(file, "utf8");
      current = JSON.parse(raw);
      if (!Array.isArray(current)) current = [];
    } catch (_) {
      // file may not exist yet – that's fine
    }
    // Avoid duplicates by repaymentId+phone+hash
    const seen = new Set(current.map((e) => `${e.repaymentId || ""}|${e.phone}|${e.msgHash || ""}`));
    for (const e of entries) {
      const key = `${e.repaymentId || ""}|${e.phone}|${e.msgHash || ""}`;
      if (!seen.has(key)) {
        current.push(e);
        seen.add(key);
      }
    }
    await fs.writeFile(file, JSON.stringify(current, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to append SMS send log:", err);
  }
}

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
    const successLogEntries = [];

    for (const r of recipients) {
      const phone = String(r.phone || "").trim();
      const message = String(r.message || "").trim();
      if (!phone || !message) {
        results.push({ phone, success: false, provider, error: "Missing phone or message", meta: r.meta });
        continue;
      }

      if (dryRun) {
        console.log(`[SMS DRY-RUN] To: ${phone} | Msg: ${message}`);
        results.push({ phone, success: true, provider: provider === "mock" ? "mock" : provider, meta: r.meta });
        continue;
      }

      if (isTextLk) {
        const sendRes = await sendViaTextLk(phone, message);
        if (sendRes.ok) {
          const msgHash = crypto.createHash("sha1").update(message).digest("hex");
          const entry = {
            at: new Date().toISOString(),
            phone,
            repaymentId: r?.meta?.repaymentId || null,
            loanId: r?.meta?.loanId || null,
            msgHash,
            provider: "textlk",
          };
          successLogEntries.push(entry);
          results.push({ phone, success: true, provider: "textlk", response: sendRes.response, meta: r.meta });
        } else {
          results.push({ phone, success: false, provider: "textlk", error: sendRes.error, response: sendRes.response, meta: r.meta });
        }
        continue;
      }

      // Fallback: treat as mock if unknown provider
      console.log(`[SMS MOCK] Provider ${provider} not supported in this build. To: ${phone} | Msg: ${message}`);
      results.push({ phone, success: true, provider: provider, meta: r.meta });
    }

    // Append logs only when we actually sent via a real provider (not dryRun)
    if (!dryRun && successLogEntries.length > 0) {
      await appendSendLog(successLogEntries);
    }

    return Response.json({ code: "SUCCESS", data: { results, dryRun } });
  } catch (error) {
    console.error("SMS send API error:", error);
    return Response.json({ code: "ERROR", message: "Failed to send messages" }, { status: 500 });
  }
}
