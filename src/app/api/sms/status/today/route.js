import { promises as fs } from "fs";
import path from "path";

function getLogsDir() {
  return path.resolve(process.cwd(), "src", "app", "api", "sms", "logs");
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  try {
    const dir = getLogsDir();
    const file = path.join(dir, `${todayKey()}.json`);
    let entries = [];
    try {
      const raw = await fs.readFile(file, "utf8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) entries = data;
    } catch (_) {
      // No log file yet – treat as empty
      entries = [];
    }

    const sentRepaymentIds = Array.from(
      new Set(
        entries
          .map((e) => e?.repaymentId)
          .filter((v) => v !== null && v !== undefined)
      )
    );

    return Response.json({ code: "SUCCESS", data: { sentRepaymentIds, entries } });
  } catch (error) {
    console.error("Failed to read today's SMS status:", error);
    return Response.json({ code: "ERROR", message: "Failed to read SMS status" }, { status: 500 });
  }
}
