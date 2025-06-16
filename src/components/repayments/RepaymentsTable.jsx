"use client";

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
import { Search, Filter, Eye } from "lucide-react";
import PaymentModal from "./PaymentModal";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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

  return (
    <>
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Loan Repayments
          </CardTitle>
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
                placeholder="Location"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
                className="pl-3 rounded-lg border-gray-300 focus:border-blue-400 shadow-sm"
              />
              <Input
                placeholder="GS Division"
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
            <Table>
              <TableHeader>
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
                  <TableHead>Location</TableHead>
                  <TableHead>GS Division</TableHead>
                  <TableHead>DS Office</TableHead>
                  <TableHead>Loan Type</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Total Amount</TableHead>
                  {filters.paymentMode === "group" && (
                    <TableHead>Group Total</TableHead>
                  )}
                  <TableHead>Settlement</TableHead>
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
    </>
  );
}
