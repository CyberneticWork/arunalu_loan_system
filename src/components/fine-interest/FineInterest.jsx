"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Mapping helpers
const statusBadgeVariant = (status) => {
  switch (status) {
    case "paid":
      return "default";
    case "waived":
      return "secondary";
    default:
      return "destructive";
  }
};

export default function FineInterest() {
  const [fines, setFines] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    amount: "",
    reason: "",
    loanId: "",
    dueReferenceDate: "",
  });
  const [method, setMethod] = useState("cash");
  const [tab, setTab] = useState("fines");
  const [dueLoans, setDueLoans] = useState([]);
  const [loadingDue, setLoadingDue] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [dueAmounts, setDueAmounts] = useState({});
  const [finesPage, setFinesPage] = useState(1);
  const [finesTotal, setFinesTotal] = useState(0);
  const [duePage, setDuePage] = useState(1);
  const [dueTotal, setDueTotal] = useState(0);
  const [dueNic, setDueNic] = useState("");
  const pageSize = 15;

  const fetchFines = async (page = finesPage) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/fine-interest?action=list&page=${page}&limit=${pageSize}`
      );
      const json = await res.json();
      if (json.success) {
        setFines(json.data);
        setFinesTotal(json.total || 0);
        setFinesPage(json.page || page);
      } else {
        toast.error(json.message || "Failed to load fines");
      }
      const statsRes = await fetch("/api/fine-interest?action=stats");
      const statsJson = await statsRes.json();
      if (statsJson.success) setStats(statsJson.data);
    } catch (e) {
      toast.error("Error loading fines");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createFine = async () => {
    if (!form.customerId || !form.amount) {
      toast.error("Customer ID and Amount required");
      return;
    }
    try {
      setCreating(true);
      const res = await fetch("/api/fine-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "create",
          customerId: parseInt(form.customerId, 10),
          amount: parseFloat(form.amount),
          reason: form.reason || null,
          loanId: form.loanId ? parseInt(form.loanId, 10) : null,
          dueReferenceDate: form.dueReferenceDate || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Fine created");
        setShowCreate(false);
        setForm({
          customerId: "",
          amount: "",
          reason: "",
          loanId: "",
          dueReferenceDate: "",
        });
        fetchFines();
      } else {
        toast.error(json.message || "Failed to create fine");
      }
    } catch (e) {
      toast.error("Server error creating fine");
    } finally {
      setCreating(false);
    }
  };

  const payFine = async (fineId) => {
    try {
      setPayingId(fineId);
      const res = await fetch("/api/fine-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "pay", fineId, method }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Fine paid");
        fetchFines();
      } else {
        toast.error(json.message || "Failed to pay fine");
      }
    } catch (e) {
      toast.error("Server error paying fine");
    } finally {
      setPayingId(null);
    }
  };

  const fetchDueLoans = async (page = duePage, nic = dueNic) => {
    try {
      setLoadingDue(true);
      const nicParam = nic ? `&nic=${encodeURIComponent(nic)}` : "";
      const res = await fetch(
        `/api/fine-interest?action=due&page=${page}&limit=${pageSize}${nicParam}`
      );
      const json = await res.json();
      if (json.success) {
        setDueLoans(json.data);
        setDueTotal(json.total || 0);
        setDuePage(json.page || page);
      } else toast.error(json.message || "Failed loading due loans");
    } catch (e) {
      toast.error("Error loading due loans");
    } finally {
      setLoadingDue(false);
    }
  };

  const approveDueFine = async (loan) => {
    const amountVal = parseFloat(dueAmounts[loan.loan_id]);
    if (!amountVal || amountVal <= 0) {
      toast.error("Enter fine amount");
      return;
    }
    try {
      setApprovingId(loan.loan_id);
      const res = await fetch("/api/fine-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "approveDue",
          loanId: loan.loan_id,
          customerId: loan.customer_id,
          amount: amountVal,
          reason: `Due ${loan.dueDays} days`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Due fine approved");
        fetchDueLoans();
        fetchFines();
      } else toast.error(json.message || "Failed approving");
    } catch (e) {
      toast.error("Server error approving");
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    fetchFines();
    fetchDueLoans();
  }, []);

  const filteredFines = fines.filter(
    (f) =>
      (f.fullname || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.nic || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFinePages = Math.max(1, Math.ceil(finesTotal / pageSize));
  const totalDuePages = Math.max(1, Math.ceil(dueTotal / pageSize));

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between w-full">
            <span>Fine Management</span>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex border rounded overflow-hidden">
                <button
                  onClick={() => setTab("fines")}
                  className={`px-3 py-1 text-xs ${
                    tab === "fines" ? "bg-primary text-white" : "bg-muted"
                  }`}
                >
                  Fines
                </button>
                <button
                  onClick={() => {
                    setTab("due");
                    if (dueLoans.length === 0) fetchDueLoans();
                  }}
                  className={`px-3 py-1 text-xs ${
                    tab === "due" ? "bg-primary text-white" : "bg-muted"
                  }`}
                >
                  Due Loans
                </button>
              </div>
              {stats && tab === "fines" && (
                <>
                  <span className="text-gray-500">
                    Unpaid:{" "}
                    <strong className="text-red-600">
                      {Number(stats.total_unpaid || 0).toFixed(2)}
                    </strong>
                  </span>
                  <span className="text-gray-500">
                    Paid:{" "}
                    <strong className="text-green-600">
                      {Number(stats.total_paid || 0).toFixed(2)}
                    </strong>
                  </span>
                  <span className="text-gray-500">
                    Fines: <strong>{stats.total_fines || 0}</strong>
                  </span>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  tab === "fines" ? fetchFines() : fetchDueLoans()
                }
                disabled={loading || loadingDue}
              >
                {(loading && tab === "fines") ||
                (loadingDue && tab === "due") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tab === "fines" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by name or NIC..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Fine
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Fine</DialogTitle>
                      <DialogDescription>
                        Manually record a fine for a customer.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <Input
                        placeholder="Customer ID"
                        value={form.customerId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, customerId: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Loan ID (optional)"
                        value={form.loanId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, loanId: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Amount"
                        type="number"
                        value={form.amount}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, amount: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Reason (optional)"
                        value={form.reason}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, reason: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Due Reference Date (YYYY-MM-DD)"
                        value={form.dueReferenceDate}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            dueReferenceDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreate(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={createFine} disabled={creating}>
                        {creating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Create"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {filteredFines.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">
                  {loading ? "Loading fines..." : "No fines found"}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>NIC</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFines.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>{f.id}</TableCell>
                          <TableCell className="font-medium">
                            {f.fullname}
                          </TableCell>
                          <TableCell>{f.nic}</TableCell>
                          <TableCell>
                            LKR {Number(f.fine_amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(f.status)}>
                              {f.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{f.method || "-"}</TableCell>
                          <TableCell>
                            {new Date(f.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="space-x-2">
                            {f.status === "unpaid" && (
                              <>
                                <select
                                  className="border rounded px-1 py-0.5 text-sm"
                                  value={method}
                                  onChange={(e) => setMethod(e.target.value)}
                                >
                                  <option value="cash">Cash</option>
                                  <option value="bank">Bank</option>
                                </select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={payingId === f.id}
                                  onClick={() => payFine(f.id)}
                                >
                                  {payingId === f.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                            {f.status !== "unpaid" && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {fines.length > 0 && (
                    <div className="flex items-center justify-between mt-4 text-xs">
                      <span>
                        Page {finesPage} / {totalFinePages} (Total {finesTotal})
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={finesPage === 1 || loading}
                          onClick={() => fetchFines(finesPage - 1)}
                        >
                          Prev
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={finesPage === totalFinePages || loading}
                          onClick={() => fetchFines(finesPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" /> Manual overdue detection
                placeholder. Enhance when due schedule is stored.
              </div>
            </>
          )}
          {tab === "due" && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Input
                  placeholder="Search NIC"
                  value={dueNic}
                  onChange={(e) => setDueNic(e.target.value)}
                  className="w-48"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDuePage(1);
                    fetchDueLoans(1, dueNic);
                  }}
                  disabled={loadingDue}
                >
                  Search
                </Button>
                {dueNic && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDueNic("");
                      setDuePage(1);
                      fetchDueLoans(1, "");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {dueLoans.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">
                  {loadingDue ? "Loading..." : "No due loans found"}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>NIC</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Due Days</TableHead>
                        <TableHead>Arrears</TableHead>
                        <TableHead>Overpay</TableHead>
                        <TableHead>Last Fine Amt</TableHead>
                        <TableHead>Last Fine Date</TableHead>
                        <TableHead>Fine Amount</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dueLoans.map((l) => (
                        <TableRow key={l.loan_id}>
                          <TableCell>{l.loan_id}</TableCell>
                          <TableCell>{l.fullname}</TableCell>
                          <TableCell>{l.nic}</TableCell>
                          <TableCell>{l.type}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                l.dueDays > 10 ? "destructive" : "secondary"
                              }
                            >
                              {l.dueDays}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {l.arrears
                              ? `LKR ${Number(l.arrears).toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {l.overpayment
                              ? `LKR ${Number(l.overpayment).toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {l.lastFineAmount != null
                              ? Number(l.lastFineAmount).toFixed(2)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {l.lastFineDate
                              ? new Date(l.lastFineDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="Amount"
                              value={dueAmounts[l.loan_id] || ""}
                              onChange={(e) =>
                                setDueAmounts((d) => ({
                                  ...d,
                                  [l.loan_id]: e.target.value,
                                }))
                              }
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              disabled={approvingId === l.loan_id}
                              onClick={() => approveDueFine(l)}
                            >
                              {approvingId === l.loan_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {dueLoans.length > 0 && (
                    <div className="flex items-center justify-between mt-4 text-xs">
                      <span>
                        Page {duePage} / {totalDuePages} (Total {dueTotal})
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={duePage === 1 || loadingDue}
                          onClick={() => fetchDueLoans(duePage - 1)}
                        >
                          Prev
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={duePage === totalDuePages || loadingDue}
                          onClick={() => fetchDueLoans(duePage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="mt-3 text-xs text-gray-500 flex gap-2 items-center">
                <AlertTriangle className="h-3 w-3" /> Approve fines for due
                loans. Avoids duplicates automatically.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
