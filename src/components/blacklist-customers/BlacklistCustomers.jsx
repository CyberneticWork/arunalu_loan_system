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
import { Search, UserX } from "lucide-react";

export default function BlacklistCustomers() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - replace with API call
  useEffect(() => {
    setCustomers([
      {
        id: 1,
        name: "John Doe",
        nic: "123456789V",
        reason: "Defaulted Loan",
        dateBlacklisted: "2023-10-01",
      },
      {
        id: 2,
        name: "Jane Smith",
        nic: "987654321V",
        reason: "Fraud",
        dateBlacklisted: "2023-09-15",
      },
    ]);
  }, []);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Blacklisted Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button>
              <UserX className="h-4 w-4 mr-2" />
              Add to Blacklist
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>NIC</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date Blacklisted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.nic}</TableCell>
                  <TableCell>{customer.reason}</TableCell>
                  <TableCell>{customer.dateBlacklisted}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View Details
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
