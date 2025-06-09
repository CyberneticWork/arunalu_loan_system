"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GuarantorForm({
  showModal,
  guarantorForm,
  editingIndex,
  onClose,
  onSubmit,
  onChange,
}) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {editingIndex !== null 
            ? `Edit Guarantor ${editingIndex + 1}` 
            : 'Add Guarantor Information'}
        </h3>

        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={guarantorForm.name}
              onChange={(e) => onChange({ ...guarantorForm, name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>

          <div>
            <Label>NIC Number</Label>
            <Input
              value={guarantorForm.nic}
              onChange={(e) => onChange({ ...guarantorForm, nic: e.target.value })}
              placeholder="Enter NIC number"
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={guarantorForm.address}
              onChange={(e) => onChange({ ...guarantorForm, address: e.target.value })}
              placeholder="Enter address"
            />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input
              value={guarantorForm.phone}
              onChange={(e) => onChange({ ...guarantorForm, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <Label>Occupation</Label>
            <Input
              value={guarantorForm.occupation}
              onChange={(e) => onChange({ ...guarantorForm, occupation: e.target.value })}
              placeholder="Enter occupation"
            />
          </div>

          <div>
            <Label>Monthly Income</Label>
            <Input
              type="number"
              value={guarantorForm.monthlyIncome}
              onChange={(e) => onChange({ ...guarantorForm, monthlyIncome: e.target.value })}
              placeholder="Enter monthly income"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={onSubmit}
          >
            {editingIndex !== null ? 'Update Guarantor' : 'Add Guarantor'}
          </Button>
        </div>
      </div>
    </div>
  );
}