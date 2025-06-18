"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function RequestDetailModal({
  request,
  onClose,
  onApprove,
  onReject,
}) {
  const {
    id,
    currentCustomerData,
    pendingCustomerData,
    currentSpouseData,
    pendingSpouseData,
  } = request;

  const formatGender = (gender) => {
    if (gender === 1) return "Male";
    if (gender === 0) return "Female";
    return "N/A";
  };

  // State for rejection note
  const [rejectionNote, setRejectionNote] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const handleReject = () => {
    if (rejectionNote.trim() === "") {
      setRejectionError("Please provide a reason for rejection.");
      return;
    }
    onReject(id, rejectionNote);
  };

  // Helper function to highlight changes
  const highlightChanges = (current, pending, field) => {
    if (current[field] !== pending[field]) {
      return true;
    }
    return false;
  };

  // Data comparison sections
  const DataComparison = ({ title, current, pending, fields }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 border-b pb-2">
          {title} (Current)
        </h3>
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col">
            <span className="text-sm text-gray-500">{field.label}</span>
            <span className="font-medium">
              {field.format ? field.format(current[field.key]) : (current[field.key] || "N/A")}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 border-b pb-2">
          {title} (Pending)
        </h3>
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col">
            <span className="text-sm text-gray-500">{field.label}</span>
            <span
              className={`font-medium ${highlightChanges(current, pending, field.key) ? 'text-blue-600' : ''}`}
            >
              {field.format ? field.format(pending[field.key]) : (pending[field.key] || "N/A")}
              {highlightChanges(current, pending, field.key) && (
                <Badge variant="outline" className="ml-2 bg-blue-50">Changed</Badge>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const customerFields = [
    { key: "fullname", label: "Full Name" },
    { key: "nic", label: "NIC" },
    { key: "gender", label: "Gender", format: formatGender },
    { key: "dob", label: "Date of Birth" },
    { key: "telno", label: "Tel No" },
    { key: "address", label: "Address" },
    { key: "gs", label: "GS" },
    { key: "ds", label: "DS" },
    { key: "district", label: "District" },
    { key: "province", label: "Province" },
  ];

  const spouseFields = [
    { key: "name", label: "Name" },
    { key: "relation", label: "Relation" },
    { key: "telno", label: "Tel No" },
    { key: "address", label: "Address" },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="text-xl">Request #{id}</span>
            <Badge className="ml-3 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              Pending Review
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer">Customer Details</TabsTrigger>
            <TabsTrigger value="spouse">Spouse Details</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="mt-4">
            <DataComparison
              title="Customer Information"
              current={currentCustomerData}
              pending={pendingCustomerData}
              fields={customerFields}
            />
          </TabsContent>

          <TabsContent value="spouse" className="mt-4">
            <DataComparison
              title="Spouse Information"
              current={currentSpouseData || {}}
              pending={pendingSpouseData || {}}
              fields={spouseFields}
            />
          </TabsContent>
        </Tabs>

        {rejectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{rejectionError}</AlertDescription>
          </Alert>
        )}

        {rejectionNote !== "" && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Rejection Reason</h4>
            <Textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Enter detailed reason for rejection..."
              className="w-full resize-none"
            />
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between sm:gap-0">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="flex gap-2">
            {rejectionNote === "" ? (
              <Button
                variant="destructive"
                onClick={() => setRejectionNote(" ")}
              >
                Reject
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setRejectionNote("")}>
                  Cancel Rejection
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  Confirm Reject
                </Button>
              </>
            )}
            <Button variant="default" onClick={() => onApprove(id)}>
              Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}