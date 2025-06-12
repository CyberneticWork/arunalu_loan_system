"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompletedRepaymentsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add filter state
  const [filters, setFilters] = useState({
    telno: "",
    location: "",
    gs: "",
    ds: "",
    loanType: "",
  });

  useEffect(() => {
    fetch("/api/repayments/history")
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      });
  }, []);

  // Filter function
  const filterData = (data) => {
    return data.filter((payment) => {
      const matchesTelno =
        !filters.telno ||
        payment.telno?.toLowerCase().includes(filters.telno.toLowerCase());
      const matchesLocation =
        !filters.location ||
        payment.location?.toLowerCase().includes(filters.location.toLowerCase());
      const matchesGS =
        !filters.gs ||
        payment.gs?.toLowerCase().includes(filters.gs.toLowerCase());
      const matchesDS =
        !filters.ds ||
        payment.ds?.toLowerCase().includes(filters.ds.toLowerCase());
      const matchesLoanType =
        !filters.loanType ||
        payment.loanType?.toLowerCase().includes(filters.loanType.toLowerCase());
      return (
        matchesTelno &&
        matchesLocation &&
        matchesGS &&
        matchesDS &&
        matchesLoanType
      );
    });
  };

  const filteredData = filterData(data);

  return (
    <Card className="w-full shadow-sm mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          Completed Repayments History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Bars */}
        <div className="mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex flex-1 gap-3">
            <input
              type="text"
              placeholder="Contact Number"
              value={filters.telno}
              onChange={(e) => setFilters({ ...filters, telno: e.target.value })}
              className="pl-4 pr-3 py-2 rounded-md border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-gray-800 transition-all duration-150 shadow-sm placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="pl-4 pr-3 py-2 rounded-md border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-gray-800 transition-all duration-150 shadow-sm placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="GS Division"
              value={filters.gs}
              onChange={(e) => setFilters({ ...filters, gs: e.target.value })}
              className="pl-4 pr-3 py-2 rounded-md border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-gray-800 transition-all duration-150 shadow-sm placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="DS Office"
              value={filters.ds}
              onChange={(e) => setFilters({ ...filters, ds: e.target.value })}
              className="pl-4 pr-3 py-2 rounded-md border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-gray-800 transition-all duration-150 shadow-sm placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Loan Type"
              value={filters.loanType}
              onChange={(e) => setFilters({ ...filters, loanType: e.target.value })}
              className="pl-4 pr-3 py-2 rounded-md border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-gray-800 transition-all duration-150 shadow-sm placeholder-gray-400"
            />
          </div>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No completed repayments found.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract No</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>GS Division</TableHead>
                  <TableHead>DS Office</TableHead>
                  <TableHead>Loan Type</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((payment) => (
                  <TableRow key={payment.id}>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}