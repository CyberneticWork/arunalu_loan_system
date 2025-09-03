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
import { Search, Plus } from "lucide-react";

export default function FineInterest() {
  const [fines, setFines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - replace with API call
  useEffect(() => {
    setFines([
      {
        id: 1,
        loanId: "LN-001",
        customerName: "John Doe",
        fineAmount: 500,
        status: "Pending",
      },
      {
        id: 2,
        loanId: "LN-002",
        customerName: "Jane Smith",
        fineAmount: 200,
        status: "Paid",
      },
    ]);
  }, []);

  const filteredFines = fines.filter((fine) =>
    fine.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Fine Interest Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Fine
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Fine Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFines.map((fine) => (
                <TableRow key={fine.id}>
                  <TableCell>{fine.loanId}</TableCell>
                  <TableCell>{fine.customerName}</TableCell>
                  <TableCell>Rs. {fine.fineAmount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        fine.status === "Paid" ? "default" : "destructive"
                      }
                    >
                      {fine.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
