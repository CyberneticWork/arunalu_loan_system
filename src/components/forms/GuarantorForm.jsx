"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Validation utility functions
const validateNIC = (nic) => {
  if (!nic) return false;
  const oldNICRegex = /^[0-9]{9}[VvXx]$/;
  const newNICRegex = /^[0-9]{12}$/;
  return oldNICRegex.test(nic) || newNICRegex.test(nic);
};

const validatePhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^(?:\+94|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
};

export function GuarantorForm({
  showModal,
  guarantorForm,
  editingIndex,
  onClose,
  onSubmit,
  onChange,
}) {
  const [errors, setErrors] = useState({});

  if (!showModal) return null;

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!guarantorForm.name || guarantorForm.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    // NIC validation
    if (!validateNIC(guarantorForm.nic)) {
      newErrors.nic = "Invalid NIC format (123456789V or 123456789123)";
    }

    // Address validation
    if (!guarantorForm.address || guarantorForm.address.trim().length < 5) {
      newErrors.address = "Address must be at least 5 characters";
    }

    // Phone validation
    if (!validatePhone(guarantorForm.phone)) {
      newErrors.phone = "Invalid phone format (0XXXXXXXXX or +94XXXXXXXXX)";
    }

    // Occupation validation
    if (
      !guarantorForm.occupation ||
      guarantorForm.occupation.trim().length < 2
    ) {
      newErrors.occupation = "Occupation is required";
    }

    // Monthly Income validation
    const income = Number(guarantorForm.monthlyIncome);
    if (isNaN(income) || income <= 0) {
      newErrors.monthlyIncome = "Monthly income must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {editingIndex !== null
            ? `Edit Guarantor ${editingIndex + 1}`
            : "Add Guarantor Information"}
        </h3>

        <div className="space-y-4">
          <div>
            <Label>
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={guarantorForm.name}
              onChange={(e) =>
                onChange({ ...guarantorForm, name: e.target.value })
              }
              placeholder="Enter full name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label>
              NIC Number <span className="text-red-500">*</span>
            </Label>
            <Input
              value={guarantorForm.nic}
              onChange={(e) =>
                onChange({ ...guarantorForm, nic: e.target.value })
              }
              placeholder="Enter NIC number"
              className={errors.nic ? "border-red-500" : ""}
            />
            {errors.nic && (
              <p className="text-red-500 text-xs mt-1">{errors.nic}</p>
            )}
          </div>

          <div>
            <Label>
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              value={guarantorForm.address}
              onChange={(e) =>
                onChange({ ...guarantorForm, address: e.target.value })
              }
              placeholder="Enter address"
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <Label>
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              value={guarantorForm.phone}
              onChange={(e) =>
                onChange({ ...guarantorForm, phone: e.target.value })
              }
              placeholder="Enter phone number"
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label>
              Occupation <span className="text-red-500">*</span>
            </Label>
            <Input
              value={guarantorForm.occupation}
              onChange={(e) =>
                onChange({ ...guarantorForm, occupation: e.target.value })
              }
              placeholder="Enter occupation"
              className={errors.occupation ? "border-red-500" : ""}
            />
            {errors.occupation && (
              <p className="text-red-500 text-xs mt-1">{errors.occupation}</p>
            )}
          </div>

          <div>
            <Label>
              Monthly Income <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              value={guarantorForm.monthlyIncome}
              onChange={(e) =>
                onChange({ ...guarantorForm, monthlyIncome: e.target.value })
              }
              placeholder="Enter monthly income"
              className={errors.monthlyIncome ? "border-red-500" : ""}
            />
            {errors.monthlyIncome && (
              <p className="text-red-500 text-xs mt-1">
                {errors.monthlyIncome}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
          >
            {editingIndex !== null ? "Update Guarantor" : "Add Guarantor"}
          </Button>
        </div>
      </div>
    </div>
  );
}
