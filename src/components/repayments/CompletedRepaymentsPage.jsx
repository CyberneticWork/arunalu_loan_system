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

  useEffect(() => {
    fetch("/api/repayments/history")
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="w-full shadow-sm mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          Completed Repayments History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : data.length === 0 ? (
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
                {data.map((payment) => (
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