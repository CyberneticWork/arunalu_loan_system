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
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const router = useRouter();

  // Filter functions
  const filterData = (data) => {
    return data.filter((payment) => {
      const matchesSearch =
        !filters.search ||
        payment.contractid
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        payment.customerName
          ?.toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === "all" || payment.status === filters.status;

      return matchesSearch && matchesStatus;
    });
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

  return (
    <>
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Loan Repayments
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-end justify-between">
            {/* Left side with search and filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by contract number or customer..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 sm:flex gap-3">
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.dateRange}
                  onValueChange={(value) =>
                    setFilters({ ...filters, dateRange: value })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right side with Multiple Payments button */}
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className={`${
                  selectedRecords.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={selectedRecords.length === 0}
                onClick={() => handleMultiplePayments(selectedRecords)}
              >
                Multiple Payments ({selectedRecords.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
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
                            selectedRecords.length > 2
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
