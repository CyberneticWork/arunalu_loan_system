"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
} from "@/components/ui/alert-dialog";
import {
  Search,
  Calendar,
  Edit,
  Trash,
  Plus,
  CalendarDays,
  Info,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { format, parse } from "date-fns";

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    type: "public",
    description: "",
    status: "active",
  });

  useEffect(() => {
    fetchHolidays();
  }, [statusFilter]);

  // Show feedback message with auto-dismiss
  const displayFeedback = (message, type) => {
    setShowFeedback({ show: true, message, type });
    setTimeout(() => {
      setShowFeedback({ show: false, message: "", type: "" });
    }, 3000);
  };

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/holidays?status=${statusFilter}`);
      const data = await response.json();
      if (data.success) setHolidays(data.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setIsLoading(false);
      displayFeedback("Failed to load holidays", "error");
    }
  };

  const updateStatus = async (holiday, newStatus) => {
    try {
      const response = await fetch("/api/holidays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: holiday.id,
          date: holiday.date,
          name: holiday.name,
          type: holiday.type,
          description: holiday.description,
          status: newStatus,
        }),
      });
      if (response.ok) {
        fetchHolidays();
        displayFeedback(
          `${holiday.name} status updated successfully`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      displayFeedback("Failed to update status", "error");
    }
  };

  const confirmDelete = (holiday) => {
    setHolidayToDelete(holiday);
    setDeleteConfirmOpen(true);
  };

  const deleteHoliday = async () => {
    if (!holidayToDelete) return;

    try {
      const response = await fetch("/api/holidays", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: holidayToDelete.id }),
      });

      if (response.ok) {
        fetchHolidays();
        setDeleteConfirmOpen(false);
        displayFeedback(
          `${holidayToDelete.name} deleted successfully`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error deleting holiday:", error);
      displayFeedback("Failed to delete holiday", "error");
    }
  };

  const handleAddHoliday = async () => {
    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setIsAddModalOpen(false);
        setFormData({
          date: "",
          name: "",
          type: "public",
          description: "",
          status: "active",
        });
        fetchHolidays();
        displayFeedback("Holiday added successfully", "success");
      }
    } catch (error) {
      console.error("Error adding holiday:", error);
      displayFeedback("Failed to add holiday", "error");
    }
  };

  const handleEditHoliday = async () => {
    try {
      const response = await fetch("/api/holidays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingHoliday.id, ...formData }),
      });
      if (response.ok) {
        setIsEditModalOpen(false);
        setEditingHoliday(null);
        setFormData({
          date: "",
          name: "",
          type: "public",
          description: "",
          status: "active",
        });
        fetchHolidays();
        displayFeedback("Holiday updated successfully", "success");
      }
    } catch (error) {
      console.error("Error editing holiday:", error);
      displayFeedback("Failed to update holiday", "error");
    }
  };

  const openEditModal = (holiday) => {
    setEditingHoliday(holiday);

    const formatDateForInput = (dateString) => {
      try {
        if (!dateString) return "";
        const normalized = String(dateString).slice(0, 10); // YYYY-MM-DD
        // Already normalized? just return it
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
        const d = parse(normalized, "yyyy-MM-dd", new Date());
        return format(d, "yyyy-MM-dd");
      } catch {
        return String(dateString).slice(0, 10);
      }
    };

    setFormData({
      date: formatDateForInput(holiday.date),
      name: holiday.name,
      type: holiday.type,
      description: holiday.description || "",
      status: holiday.status,
    });
    setIsEditModalOpen(true);
  };

  // Format date for display (no timezone shifts)
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "";
      const normalized = String(dateString).slice(0, 10); // YYYY-MM-DD
      const d = parse(normalized, "yyyy-MM-dd", new Date());
      return format(d, "MMMM d, yyyy");
    } catch {
      return String(dateString).slice(0, 10);
    }
  };

  // Get badge styling based on holiday type
  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case "public":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "religious":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "company":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const filteredHolidays = holidays.filter((holiday) =>
    holiday.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 animate-fadeIn">
      {/* Feedback Toast */}
      {showFeedback.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg animate-slideIn flex items-center gap-2
            ${
              showFeedback.type === "success"
                ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                : "bg-red-100 border-l-4 border-red-500 text-red-700"
            }`}
        >
          {showFeedback.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span>{showFeedback.message}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Holiday Management
        </h1>
        <p className="text-gray-500">
          Manage company holidays, public holidays, and special days
        </p>
      </div>

      <Card className="shadow-md border-0 overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b pb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
                Holiday Calendar
              </CardTitle>
              <CardDescription className="mt-1">
                {filteredHolidays.length}{" "}
                {filteredHolidays.length === 1 ? "holiday" : "holidays"} found
              </CardDescription>
            </div>

            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Holiday
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search holidays by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
              />
            </div>

            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md transition-all duration-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Holidays</SelectItem>
                  <SelectItem value="inactive">Inactive Holidays</SelectItem>
                  <SelectItem value="all">All Holidays</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 animate-pulse">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="ml-3 text-gray-500 font-medium">
                Loading holidays...
              </span>
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Calendar className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium mb-2">No holidays found</p>
              <p className="text-sm text-center max-w-md">
                {searchQuery
                  ? "Try adjusting your search query or filter settings"
                  : 'Add your first holiday by clicking "Add New Holiday" button'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-gray-100 shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">
                      Holiday Name
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Type
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHolidays.map((holiday) => (
                    <TableRow
                      key={holiday.id}
                      className="group transition-all duration-200 hover:bg-gray-50 animate-fadeIn"
                    >
                      <TableCell className="font-medium">
                        {holiday.name}
                      </TableCell>
                      <TableCell>{formatDate(holiday.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`transition-all duration-200 ${getTypeBadgeStyle(
                            holiday.type
                          )}`}
                        >
                          {holiday.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-28">
                          <Select
                            value={holiday.status}
                            onValueChange={(value) =>
                              updateStatus(holiday, value)
                            }
                          >
                            <SelectTrigger
                              className={`w-full h-8 px-2 text-sm transition-all duration-300
                              ${
                                holiday.status === "active"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">
                                <span className="flex items-center">
                                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                  Active
                                </span>
                              </SelectItem>
                              <SelectItem value="inactive">
                                <span className="flex items-center">
                                  <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                                  Inactive
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-gray-50 text-gray-500 border-gray-200 
        hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 
        transition-all duration-200"
                            onClick={() => openEditModal(holiday)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="ml-1.5">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-gray-50 text-gray-500 border-gray-200 
        hover:bg-red-50 hover:border-red-200 hover:text-red-600 
        transition-all duration-200"
                            onClick={() => confirmDelete(holiday)}
                          >
                            <Trash className="h-3.5 w-3.5" />
                            <span className="ml-1.5">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Holiday Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Add New Holiday
            </DialogTitle>
            <DialogDescription>
              Add a new holiday to the company calendar
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                required
                className="focus:ring-indigo-300"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">
                Holiday Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. New Year's Day"
                required
                className="focus:ring-indigo-300"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="holiday-type">Holiday Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger
                  id="holiday-type"
                  className="focus:ring-indigo-300"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Holiday</SelectItem>
                  <SelectItem value="religious">Religious Holiday</SelectItem>
                  <SelectItem value="company">Company Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add details about this holiday"
                className="resize-none focus:ring-indigo-300"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status" className="focus:ring-indigo-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleAddHoliday}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Holiday Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-indigo-600" />
              Edit Holiday
            </DialogTitle>
            <DialogDescription>Update holiday details</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-date"
                type="date"
                required
                className="focus:ring-indigo-300"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                Holiday Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g. New Year's Day"
                required
                className="focus:ring-indigo-300"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-type">Holiday Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="edit-type" className="focus:ring-indigo-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Holiday</SelectItem>
                  <SelectItem value="religious">Religious Holiday</SelectItem>
                  <SelectItem value="company">Company Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Add details about this holiday"
                className="resize-none focus:ring-indigo-300"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger
                  id="edit-status"
                  className="focus:ring-indigo-300"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleEditHoliday}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash className="h-5 w-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{holidayToDelete?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteHoliday}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
