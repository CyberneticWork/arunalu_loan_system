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
import { Search, Calendar } from "lucide-react";

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - replace with API call
  useEffect(() => {
    setHolidays([
      { id: 1, name: "New Year", date: "2024-01-01", type: "Public" },
      { id: 2, name: "Christmas", date: "2024-12-25", type: "Religious" },
    ]);
  }, []);

  const filteredHolidays = holidays.filter((holiday) =>
    holiday.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Holiday Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by holiday name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Holiday Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell>{holiday.name}</TableCell>
                  <TableCell>{holiday.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{holiday.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Edit
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
