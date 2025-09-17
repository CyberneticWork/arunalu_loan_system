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
import { Search, UserX, UserCheck, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function BlacklistCustomers() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customerIdToAdd, setCustomerIdToAdd] = useState("");
  const [useNic, setUseNic] = useState(false);

  // Fetch blacklisted customers from API
  const fetchBlacklistedCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/blacklist-customers");
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data);
      } else {
        setError(data.message || "Failed to fetch blacklisted customers");
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Error fetching blacklisted customers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add customer to blacklist
  const handleAddToBlacklist = async () => {
    if (!customerIdToAdd.trim()) {
      toast.error("Please enter a customer ID");
      return;
    }

    try {
      setActionLoading(customerIdToAdd);

      const response = await fetch("/api/blacklist-customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          useNic
            ? { nic: customerIdToAdd.trim(), action: "blacklist" }
            : { customerId: parseInt(customerIdToAdd), action: "blacklist" }
        ),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Customer added to blacklist successfully");
        setShowAddDialog(false);
        setCustomerIdToAdd("");
        fetchBlacklistedCustomers(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to add customer to blacklist");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
      console.error("Error adding customer to blacklist:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Remove customer from blacklist
  const handleRemoveFromBlacklist = async (customerId) => {
    try {
      setActionLoading(customerId);

      const response = await fetch("/api/blacklist-customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId,
          action: "unblacklist",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Customer removed from blacklist successfully");
        fetchBlacklistedCustomers(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to remove customer from blacklist");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
      console.error("Error removing customer from blacklist:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBlacklistedCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.nic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading blacklisted customers...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
            <span className="text-red-500">{error}</span>
            <Button
              variant="outline"
              className="ml-4"
              onClick={fetchBlacklistedCustomers}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserX className="h-5 w-5 mr-2" />
            Blacklisted Customers ({customers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name or NIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserX className="h-4 w-4 mr-2" />
                  Add to Blacklist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Customer to Blacklist</DialogTitle>
                  <DialogDescription>
                    Enter the customer ID or NIC to add them to the blacklist.
                    This will prevent them from getting new loans.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={useNic ? "Enter NIC" : "Enter Customer ID"}
                      value={customerIdToAdd}
                      onChange={(e) => setCustomerIdToAdd(e.target.value)}
                      type={useNic ? "text" : "number"}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUseNic((v) => !v);
                        setCustomerIdToAdd("");
                      }}
                    >
                      {useNic ? "Use ID" : "Use NIC"}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddToBlacklist}
                    disabled={actionLoading === customerIdToAdd}
                  >
                    {actionLoading === customerIdToAdd ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserX className="h-4 w-4 mr-2" />
                    )}
                    Add to Blacklist
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No blacklisted customers found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.fullname}
                    </TableCell>
                    <TableCell>{customer.nic}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.gender === 1 ? "default" : "secondary"
                        }
                      >
                        {customer.gender === 1 ? "Male" : "Female"}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.location || "N/A"}</TableCell>
                    <TableCell>{formatDate(customer.createat)}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === customer.id}
                          >
                            {actionLoading === customer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <UserCheck className="h-4 w-4 mr-2" />
                            )}
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove from Blacklist
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove{" "}
                              {customer.fullname} from the blacklist? This will
                              allow them to apply for loans again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleRemoveFromBlacklist(customer.id)
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Remove from Blacklist
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
