"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SendHorizontal, CheckCircle2, XCircle } from "lucide-react";

export default function SendSMSPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");
  const [template, setTemplate] = useState(
    "Dear {name}, we have received your payment of LKR {amount} for Loan {loanId} on {date}. Your remaining balance is LKR {settlement}.New Town Abagasdowa.If you have any issues, please contact us at +94 70 5 558 880.Thank you!"
  );

  const fetchRows = async () => {
    setLoading(true);
    try {
      // Fetch repayments and today's SMS status concurrently
      const [repRes, statusRes] = await Promise.all([
        fetch("/api/repayments/today", { cache: "no-store" }),
        fetch("/api/sms/status/today", { cache: "no-store" }),
      ]);
      const [repJson, statusJson] = await Promise.all([repRes.json(), statusRes.json()]);
      if (repJson.code !== "SUCCESS") throw new Error(repJson.message || "Failed to load repayments");
      if (statusJson.code !== "SUCCESS") throw new Error(statusJson.message || "Failed to load SMS status");

      const data = repJson.data || [];
      const sentSet = new Set((statusJson.data?.sentRepaymentIds || []).filter(Boolean));
      const merged = data.map((r) => ({ ...r, smsSent: sentSet.has(r.repaymentId) }));

      setRows(merged);
      // default-select all correct and not already sent
      const nextSelected = new Set();
      merged.forEach((r) => { if (r.isCorrect && !r.smsSent) nextSelected.add(r.repaymentId); });
      setSelected(nextSelected);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to load today's repayments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    let data = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((r) =>
        String(r.customerName || "").toLowerCase().includes(q) ||
        String(r.phone || "").toLowerCase().includes(q) ||
        String(r.loanId || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [rows, query]);

  const allVisibleIds = filtered.filter((r) => !r.smsSent).map((r) => r.repaymentId);
  const allVisibleSelected = allVisibleIds.every((id) => selected.has(id)) && allVisibleIds.length > 0;

  const toggleSelectAllVisible = () => {
    const next = new Set(selected);
    if (allVisibleSelected) {
      allVisibleIds.forEach((id) => next.delete(id));
    } else {
      allVisibleIds.forEach((id) => next.add(id));
    }
    setSelected(next);
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const formatMessage = (tpl, row) => {
    const dt = new Date(row.createdAt);
    const dateStr = dt.toLocaleDateString();
    return tpl
      .replaceAll("{name}", row.customerName || "Customer")
      .replaceAll("{amount}", (row.paidAmount ?? 0).toFixed(2))
      .replaceAll("{loanId}", String(row.loanId))
      .replaceAll("{date}", dateStr)
      .replaceAll("{settlement}", (row.settlement ?? 0).toFixed(2));
  };

  const sendTo = async (rowsToSend) => {
    if (!rowsToSend.length) {
      toast.info("No recipients selected");
      return;
    }
    setLoading(true);
    try {
      const recipients = rowsToSend.map((r) => ({
        phone: normalizePhone(r.phone),
        message: formatMessage(template, r),
        meta: { repaymentId: r.repaymentId, loanId: r.loanId }
      }));

      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients })
      });
      const json = await res.json();
      if (json.code !== "SUCCESS") throw new Error(json.message || "Send failed");
      const results = json.data?.results || [];
      const ok = results.filter((r) => r.success).length;
      const total = recipients.length;
      if (json.data?.dryRun) {
        toast.info(`Dry-run: prepared ${ok}/${total} messages. Configure SMS provider to send.`);
      } else {
        toast.success(`Sent ${ok}/${total} messages`);
        // Mark successfully sent rows as sent in local state
        const successIds = new Set(
          results.filter((x) => x.success && x.meta?.repaymentId).map((x) => x.meta.repaymentId)
        );
        setRows((prev) => prev.map((r) => (successIds.has(r.repaymentId) ? { ...r, smsSent: true } : r)));
        setSelected((prev) => {
          const next = new Set(Array.from(prev));
          successIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to send messages");
    } finally {
      setLoading(false);
    }
  };

  const sendSelected = () => {
    const rowsToSend = rows.filter((r) => selected.has(r.repaymentId) && !r.smsSent);
    sendTo(rowsToSend);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Send SMS</h1>
          <p className="text-sm text-muted-foreground">Today's repayments. Select and send confirmations individually or in bulk.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchRows} disabled={loading}>Refresh</Button>
          <Button onClick={sendSelected} disabled={loading || selected.size === 0}>
            <SendHorizontal className="h-4 w-4 mr-2" /> Send Selected ({selected.size})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 flex items-center gap-3">
          <div className="flex-1 min-w-52">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone, loan id" />
          </div>
        </div>
        {/* <div className="lg:col-span-1">
          <Textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={3} />
          <div className="text-xs text-muted-foreground mt-1">Placeholders: {`{name}`} {`{amount}`} {`{loanId}`} {`{date}`} {`{settlement}`}</div>
        </div> */}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAllVisible} aria-label="Select all" />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Loan</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">{loading ? "Loading..." : "No repayments found for today"}</TableCell>
              </TableRow>
            )}
            {filtered.map((r) => {
              const isSel = selected.has(r.repaymentId);
              return (
                <TableRow key={r.repaymentId} className={isSel ? "bg-muted/40" : ""}>
                  <TableCell>
                    <Checkbox checked={isSel} disabled={r.smsSent} onCheckedChange={() => toggleSelect(r.repaymentId)} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.customerName}</div>
                    <div className="text-xs text-muted-foreground">#{r.repaymentId} • Tx {r.transactionId || "-"}</div>
                  </TableCell>
                  <TableCell>{r.phone || "-"}</TableCell>
                  <TableCell>
                    <div>#{r.loanId}</div>
                    <div className="text-xs text-muted-foreground">{r.loanType} ({r.frequency})</div>
                  </TableCell>
                  <TableCell className="text-right">LKR {(r.paidAmount ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">LKR {(r.expectedInstallment ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    {r.isCorrect ? (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1"/>Correct</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-600"><XCircle className="h-3 w-3 mr-1"/>Different</Badge>
                    )}
                    {r.smsSent && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-600">• Sent</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {r.smsSent ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Sent</Badge>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => sendTo([r])} disabled={loading}>
                        <SendHorizontal className="h-4 w-4 mr-2" /> Send
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function normalizePhone(phone) {
  if (!phone) return "";
  const p = String(phone).replace(/[^0-9+]/g, "");
  
  // Already has country code
  if (p.startsWith("+")) return p;
  
  // Convert local Sri Lankan format to international
  if (p.startsWith("0")) {
    return "+94" + p.substring(1); // Remove 0 and add +94
  }
  
  // Number without prefix, assume Sri Lankan
  if (p.length >= 9) {
    return "+94" + p;
  }
  
  // Invalid/too short, return as-is
  return p;
}
