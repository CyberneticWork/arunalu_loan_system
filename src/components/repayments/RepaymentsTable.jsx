"use client";
import { useEffect } from "react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Eye, Printer, FileSpreadsheet } from "lucide-react";
import PaymentModal from "./PaymentModal";
import PrintPreviewTable from "./PrintPreviewTable";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function RepaymentsTable({ data = [], onRefresh }) {
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    dateRange: "all",
    telno: "",
    location: "",
    gs: "",
    ds: "",
    loanType: "",
    paymentMode: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printData, setPrintData] = useState([]);
  const [isExcelModelOpen, setIsExcelModelOpen] = useState(false);
  const router = useRouter();

  // excel filter functions
  const [excelFilters, setExcelFilters] = useState({
    dateFrom: "",
    dateTo: "",
    loanType: "all",
    ownershipType: "all",
    status: "all",
  });
  // Filter functions
  const filterData = (data) => {
    let filtered = data.filter((payment) => {
      const matchesSearch =
        !filters.search ||
        payment.customerName
          ?.toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === "all" || payment.status === filters.status;

      const matchesTelno =
        !filters.telno ||
        payment.telno?.toLowerCase().includes(filters.telno.toLowerCase());

      const matchesLocation =
        !filters.location ||
        payment.location
          ?.toLowerCase()
          .includes(filters.location.toLowerCase());

      const matchesGS =
        !filters.gs ||
        payment.gs?.toLowerCase().includes(filters.gs.toLowerCase());

      const matchesDS =
        !filters.ds ||
        payment.ds?.toLowerCase().includes(filters.ds.toLowerCase());

      const matchesLoanType =
        !filters.loanType ||
        payment.loanType
          ?.toLowerCase()
          .includes(filters.loanType.toLowerCase());

      const matchesPaymentMode =
        filters.paymentMode === "all" ||
        payment.loanTypeMode === filters.paymentMode;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTelno &&
        matchesLocation &&
        matchesGS &&
        matchesDS &&
        matchesLoanType &&
        matchesPaymentMode
      );
    });

    // Sort by group_name if group mode is selected
    if (filters.paymentMode === "group") {
      filtered.sort((a, b) =>
        (a.group_name || "").localeCompare(b.group_name || "")
      );
    }

    return filtered;
  };

  // Get paginated data
  const filteredData = filterData(data);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Update the isPaymentDisabled logic
  const isPaymentDisabled = false; // Remove the previous limitation

  // Update the handleMultiplePayments function
  const handleMultiplePayments = (selectedIds) => {
    if (selectedIds.length === 0) return;

    // Get all selected payment records
    const selectedPayments = data.filter((payment) =>
      selectedIds.includes(payment.id)
    );

    setSelectedPayment(selectedPayments);
    setIsPaymentModalOpen(true);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  // Helper to calculate group totals
  const groupTotals = {};
  if (filters.paymentMode === "group") {
    filteredData.forEach((payment) => {
      if (!groupTotals[payment.group_name]) {
        groupTotals[payment.group_name] = 0;
      }
      groupTotals[payment.group_name] += Number(payment.Totalpay) || 0;
    });
  }

  const handlePrintPreview = async () => {
    try {
      const response = await fetch("/api/repayments/printFormData");
      const data = await response.json();
      setPrintData(data);
      setIsPrintPreviewOpen(true);
    } catch (error) {
      console.error("Error fetching print data:", error);
    }
  };
  const handleExcelModelPopup = () => {
    setIsExcelModelOpen(true);
  };

  const [loanTypes, setLoanTypes] = useState([]);
  // Add this function before the return statement
  const fetchLoanTypes = async () => {
    try {
      const response = await fetch("/api/loan-types");
      const data = await response.json();
      setLoanTypes(data);
    } catch (error) {
      console.error("Error fetching loan types:", error);
    }
  };

  // Add useEffect to fetch loan types when component mounts
  useEffect(() => {
    fetchLoanTypes();
  }, []);
  return (
    <>
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Loan Repayments
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExcelModelPopup}
              className="ml-auto"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPreview}
              className="ml-auto"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Preview
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search Bars and Buttons in One Row */}
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Contact Number"
                value={filters.telno}
                onChange={(e) =>
                  setFilters({ ...filters, telno: e.target.value })
                }
                className="pl-3 rounded-lg border-gray-300 focus:border-blue-400 shadow-sm"
              />
              <Input
                placeholder="Branch"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
                className="pl-3 rounded-lg border-gray-300 focus:border-blue-400 shadow-sm"
              />
              <Input
                placeholder="Center"
                value={filters.gs}
                onChange={(e) => setFilters({ ...filters, gs: e.target.value })}
                className="pl-3 rounded-lg border-gray-300 focus:border-blue-400 shadow-sm"
              />
              <Input
                placeholder="DS Office"
                value={filters.ds}
                onChange={(e) => setFilters({ ...filters, ds: e.target.value })}
                className="pl-3 rounded-lg border-gray-300 focus:border-blue-400 shadow-sm"
              />
              <Input
                placeholder="Loan Type"
                value={filters.loanType}
                onChange={(e) =>
                  setFilters({ ...filters, loanType: e.target.value })
                }
                className="pl-3 rounded-lg border-gray-300 focus:border-blue-400 shadow-sm"
              />
              <Select
                value={filters.paymentMode}
                onValueChange={(value) =>
                  setFilters({ ...filters, paymentMode: value })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="normal">Individual</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button
                variant="default"
                size="sm"
                className={`rounded-lg px-4 py-2 font-semibold transition-all duration-150 shadow ${
                  selectedRecords.length === 0
                    ? "bg-gray-300 cursor-not-allowed text-gray-600"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                }`}
                disabled={selectedRecords.length === 0}
                onClick={() => handleMultiplePayments(selectedRecords)}
              >
                Multiple Payments ({selectedRecords.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-blue-400 text-blue-700 hover:bg-blue-50 transition-all duration-150"
                onClick={() => router.push("/repayments/history")}
              >
                Completed History
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-white z-10 shadow">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        paginatedData.length > 0 &&
                        selectedRecords.length === paginatedData.length
                      }
                      onCheckedChange={(checked) => {
                        setSelectedRecords(
                          checked ? paginatedData.map((p) => p.id) : []
                        );
                      }}
                    />
                  </TableHead>
                  <TableHead>Contract No</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Center</TableHead>
                  <TableHead>DS Office</TableHead>
                  <TableHead>Loan Type</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  {filters.paymentMode === "group" && (
                    <TableHead>Group Total</TableHead>
                  )}
                  <TableHead>Settlement</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Arrears</TableHead>
                  <TableHead>Overpayment</TableHead>
                  <TableHead>Due Days</TableHead> 
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.includes(payment.id)}
                          onCheckedChange={(checked) => {
                            setSelectedRecords(
                              checked
                                ? [...selectedRecords, payment.id]
                                : selectedRecords.filter(
                                    (id) => id !== payment.id
                                  )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>{payment.telno}</TableCell>
                      <TableCell>{payment.customerName}</TableCell>
                      <TableCell>{payment.location}</TableCell>
                      <TableCell>{payment.gs}</TableCell>
                      <TableCell>{payment.ds}</TableCell>
                      <TableCell>{payment.loanType}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium
              ${
                payment.loanTypeMode === "group"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              }`}
                        >
                          {payment.loanTypeMode === "group"
                            ? `Group (${payment.group_name || "N/A"})`
                            : payment.loanTypeMode}
                        </span>
                      </TableCell>

                      <TableCell>
                        LKR {Number(payment.Totalpay).toLocaleString()}
                      </TableCell>
                      {filters.paymentMode === "group" && (
                        <TableCell>
                          LKR{" "}
                          {groupTotals[payment.group_name]?.toLocaleString() ||
                            "0"}
                        </TableCell>
                      )}
                      <TableCell>{payment.rate}%</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            Number(payment.remainingAmount) === 0
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          LKR {Number(payment.remainingAmount).toLocaleString()}
                        </span>
                      </TableCell>
                      {/* Paid Amount */}
                      <TableCell>
                        LKR{" "}
                        {(
                          Number(payment.Totalpay) -
                          Number(payment.remainingAmount)
                        ).toLocaleString()}
                      </TableCell>
                      {/* Arrears */}
                      <TableCell>
                        {Number(payment.balance) < 0 ? (
                          <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 font-semibold">
                            LKR{" "}
                            {Math.abs(Number(payment.balance)).toLocaleString()}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {/* Overpayment */}
                      <TableCell>
                        {Number(payment.balance) > 0 ? (
                          <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 font-semibold">
                            LKR {Number(payment.balance).toLocaleString()}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {/* Due Days */}
                      <TableCell>
                        {payment.dueDays && payment.dueDays !== "0" ? (
                          <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 font-semibold">
                            {payment.dueDays} Days
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2 ${
                            selectedRecords.length > 1
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-600"
                          }`}
                          onClick={() => handleViewPayment(payment)}
                          disabled={selectedRecords.length > 1}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Make Payment</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={11} // Update from 10 to 11 to account for new column
                      className="text-center py-10 text-gray-500"
                    >
                      No repayments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }}
        payments={
          selectedPayment
            ? Array.isArray(selectedPayment)
              ? selectedPayment
              : [selectedPayment]
            : []
        }
        isMultiple={Array.isArray(selectedPayment)}
        onPaymentComplete={onRefresh}
      />

      <PrintPreviewTable
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        data={printData}
      />

      {/* Excel Export Modal */}
      <Dialog open={isExcelModelOpen} onOpenChange={setIsExcelModelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Excel Report</DialogTitle>
            <DialogDescription>
              Select filters for your Excel export
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Date Range */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateRange" className="text-right">
                Date Range
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  type="date"
                  value={excelFilters.dateFrom}
                  max={new Date().toISOString().split("T")[0]} // Restricts to today or earlier
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setExcelFilters((prev) => ({
                      ...prev,
                      dateFrom: newStartDate,
                      // Reset end date if it's before new start date
                      dateTo:
                        prev.dateTo && prev.dateTo < newStartDate
                          ? ""
                          : prev.dateTo,
                    }));
                  }}
                  className="flex-1"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={excelFilters.dateTo}
                  min={
                    excelFilters.dateFrom ||
                    new Date().toISOString().split("T")[0]
                  }
                  onChange={(e) =>
                    setExcelFilters({
                      ...excelFilters,
                      dateTo: e.target.value,
                    })
                  }
                  className="flex-1"
                  placeholder="To"
                  disabled={!excelFilters.dateFrom} // Disable until start date is selected
                />
              </div>
            </div>

            {/* Loan Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="loanType" className="text-right">
                Loan Type
              </Label>
              <Select
                value={excelFilters.loanType}
                onValueChange={(value) =>
                  setExcelFilters({
                    ...excelFilters,
                    loanType: value,
                  })
                }
                className="col-span-3"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {loanTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ownership Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ownershipType" className="text-right">
                Ownership Type
              </Label>
              <Select
                value={excelFilters.ownershipType}
                onValueChange={(value) =>
                  setExcelFilters({
                    ...excelFilters,
                    ownershipType: value,
                  })
                }
                className="col-span-3"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ownership type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="normal">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={excelFilters.status}
                onValueChange={(value) =>
                  setExcelFilters({
                    ...excelFilters,
                    status: value,
                  })
                }
                className="col-span-3"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsExcelModelOpen(false);
                setExcelFilters({
                  dateFrom: "",
                  dateTo: "",
                  loanType: "all",
                  ownershipType: "all",
                  status: "all",
                });
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={async () => {
                try {
                  // Show loading state
                  const response = await fetch("/api/repayments/export-excel", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(excelFilters),
                  });

                  if (!response.ok) {
                    throw new Error("Export failed");
                  }

                  // Convert response to blob
                  const blob = await response.blob();

                  // Create download link
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `repayments-report-${
                    new Date().toISOString().split("T")[0]
                  }.xlsx`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);

                  // Close modal
                  setIsExcelModelOpen(false);

                  // Reset filters
                  setExcelFilters({
                    dateFrom: "",
                    dateTo: "",
                    loanType: "all",
                    ownershipType: "all",
                    status: "all",
                  });
                } catch (error) {
                  console.error("Export error:", error);
                  // Add error notification here if you have a notification system
                }
              }}
            >
              Download Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
