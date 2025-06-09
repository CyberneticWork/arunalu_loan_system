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

  // Single field validation
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value || value.trim().length < 3)
          return "Name must be at least 3 characters";
        break;
      case "nic":
        if (!validateNIC(value))
          return "Invalid NIC format (123456789V or 123456789123)";
        break;
      case "address":
        if (!value || value.trim().length < 5)
          return "Address must be at least 5 characters";
        break;
      case "phone":
        if (!validatePhone(value))
          return "Invalid phone format (0XXXXXXXXX or +94XXXXXXXXX)";
        break;
      case "occupation":
        if (!value || value.trim().length < 2) return "Occupation is required";
        break;
      case "monthlyIncome":
        if (isNaN(Number(value)) || Number(value) <= 0)
          return "Monthly income must be greater than 0";
        break;
      case "gender":
        if (value === undefined) return "Gender is required";
        break;
      case "dob":
        if (!value) return "Date of Birth is required";
        break;
      case "relation":
        if (!value) return "Relation is required";
        break;
      case "province":
        if (!value) return "Province is required";
        break;
      case "gs":
        if (!value) return "GS Division is required";
        break;
      case "ds":
        if (!value) return "DS Office is required";
        break;
      case "district":
        if (!value) return "District is required";
        break;
      case "accountno":
        if (!value) return "Bank Account No is required";
        break;
      case "bankname":
        if (!value) return "Bank Name is required";
        break;
      default:
        return "";
    }
    return "";
  };

  // On blur handler for each field
  const handleBlur = (field) => {
    const error = validateField(field, guarantorForm[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

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

    // Gender validation
    if (guarantorForm.gender === undefined) {
      newErrors.gender = "Gender is required";
    }

    // Date of Birth validation
    if (!guarantorForm.dob) {
      newErrors.dob = "Date of Birth is required";
    }

    // Relation validation
    if (!guarantorForm.relation) {
      newErrors.relation = "Relation is required";
    }

    // Province validation
    if (!guarantorForm.province) {
      newErrors.province = "Province is required";
    }

    // GS Division validation
    if (!guarantorForm.gs) {
      newErrors.gs = "GS Division is required";
    }

    // DS Office validation
    if (!guarantorForm.ds) {
      newErrors.ds = "DS Office is required";
    }

    // District validation
    if (!guarantorForm.district) {
      newErrors.district = "District is required";
    }

    // Bank Account No validation
    if (!guarantorForm.accountno) {
      newErrors.accountno = "Bank Account No is required";
    }

    // Bank Name validation
    if (!guarantorForm.bankname) {
      newErrors.bankname = "Bank Name is required";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xl">
        <h3 className="text-xl font-semibold mb-6">
          {editingIndex !== null
            ? `Edit Guarantor ${editingIndex + 1}`
            : "Add Guarantor Information"}
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <Label className="text-base">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`text-base ${errors.name ? "border-red-500" : ""}`}
                value={guarantorForm.name}
                onChange={(e) =>
                  onChange({ ...guarantorForm, name: e.target.value })
                }
                onBlur={() => handleBlur("name")}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* NIC Number */}
            <div>
              <Label className="text-base">
                NIC Number <span className="text-red-500">*</span>
              </Label>
              <Input
                value={guarantorForm.nic}
                onChange={(e) =>
                  onChange({ ...guarantorForm, nic: e.target.value })
                }
                onBlur={() => handleBlur("nic")}
                placeholder="Enter NIC number"
                className={errors.nic ? "border-red-500" : ""}
              />
              {errors.nic && (
                <p className="text-red-500 text-xs mt-1">{errors.nic}</p>
              )}
            </div>

            {/* Address (full width) */}
            <div className="md:col-span-2">
              <Label className="text-base">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                value={guarantorForm.address}
                onChange={(e) =>
                  onChange({ ...guarantorForm, address: e.target.value })
                }
                onBlur={() => handleBlur("address")}
                placeholder="Enter address"
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <Label className="text-base">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                value={guarantorForm.phone}
                onChange={(e) =>
                  onChange({ ...guarantorForm, phone: e.target.value })
                }
                onBlur={() => handleBlur("phone")}
                placeholder="Enter phone number"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Occupation */}
            <div>
              <Label className="text-base">
                Occupation <span className="text-red-500">*</span>
              </Label>
              <Input
                value={guarantorForm.occupation}
                onChange={(e) =>
                  onChange({ ...guarantorForm, occupation: e.target.value })
                }
                onBlur={() => handleBlur("occupation")}
                placeholder="Enter occupation"
                className={errors.occupation ? "border-red-500" : ""}
              />
              {errors.occupation && (
                <p className="text-red-500 text-xs mt-1">{errors.occupation}</p>
              )}
            </div>

            {/* Monthly Income */}
            <div>
              <Label className="text-base">
                Monthly Income <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={guarantorForm.monthlyIncome}
                onChange={(e) =>
                  onChange({ ...guarantorForm, monthlyIncome: e.target.value })
                }
                onBlur={() => handleBlur("monthlyIncome")}
                placeholder="Enter monthly income"
                className={errors.monthlyIncome ? "border-red-500" : ""}
              />
              {errors.monthlyIncome && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.monthlyIncome}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <Label className="text-base">
                Gender <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-4 mt-2">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value={1}
                    checked={guarantorForm.gender === 1}
                    onChange={() => onChange({ ...guarantorForm, gender: 1 })}
                    onBlur={() => handleBlur("gender")}
                  />{" "}
                  Male
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value={0}
                    checked={guarantorForm.gender === 0}
                    onChange={() => onChange({ ...guarantorForm, gender: 0 })}
                    onBlur={() => handleBlur("gender")}
                  />{" "}
                  Female
                </label>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <Label className="text-base">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={guarantorForm.dob}
                max={new Date().toISOString().split("T")[0]} // disables future dates
                onChange={(e) =>
                  onChange({ ...guarantorForm, dob: e.target.value })
                }
                onBlur={() => handleBlur("dob")}
                className={errors.dob ? "border-red-500" : ""}
              />
              {errors.dob && (
                <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
              )}
            </div>

            {/* Relation */}
            <div>
              <Label className="text-base">
                Relation <span className="text-red-500">*</span>
              </Label>
              <select
                value={guarantorForm.relation}
                onChange={(e) =>
                  onChange({ ...guarantorForm, relation: e.target.value })
                }
                onBlur={() => handleBlur("relation")}
                className={errors.relation ? "border-red-500" : ""}
              >
                <option value="">Select</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Child</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
              {errors.relation && (
                <p className="text-red-500 text-xs mt-1">{errors.relation}</p>
              )}
            </div>

            {/* Province */}
            <div>
              <Label className="text-base">
                Province <span className="text-red-500">*</span>
              </Label>
              <Input
                value={guarantorForm.province}
                onChange={(e) =>
                  onChange({ ...guarantorForm, province: e.target.value })
                }
                onBlur={() => handleBlur("province")}
                placeholder="Province"
                className={errors.province ? "border-red-500" : ""}
              />
              {errors.province && (
                <p className="text-red-500 text-xs mt-1">{errors.province}</p>
              )}
            </div>

            {/* GS Division */}
            <div>
              <Label className="text-base">
                GS Division <span className="text-red-500">*</span>
              </Label>
              <Input
                value={guarantorForm.gs}
                onChange={(e) =>
                  onChange({ ...guarantorForm, gs: e.target.value })
                }
                onBlur={() => handleBlur("gs")}
                placeholder="GS Division"
                className={errors.gs ? "border-red-500" : ""}
              />
              {errors.gs && (
                <p className="text-red-500 text-xs mt-1">{errors.gs}</p>
              )}
            </div>

            {/* DS Office */}
            <div>
              <Label className="text-base">
                DS Office <span className="text-red-500">*</span>
              </Label>
              <Input
                value={guarantorForm.ds}
                onChange={(e) =>
                  onChange({ ...guarantorForm, ds: e.target.value })
                }
                onBlur={() => handleBlur("ds")}
                placeholder="DS Office"
                className={errors.ds ? "border-red-500" : ""}
              />
              {errors.ds && (
                <p className="text-red-500 text-xs mt-1">{errors.ds}</p>
              )}
            </div>

            {/* District */}
            <div>
              <Label className="text-base">
                District <span className="text-red-500">*</span>
              </Label>
              <Input
                value={guarantorForm.district}
                onChange={(e) =>
                  onChange({ ...guarantorForm, district: e.target.value })
                }
                onBlur={() => handleBlur("district")}
                placeholder="District"
                className={errors.district ? "border-red-500" : ""}
              />
              {errors.district && (
                <p className="text-red-500 text-xs mt-1">{errors.district}</p>
              )}
            </div>

            {/* Bank Account No */}
            <div>
              <Label className="text-base">
                Bank Account No <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={guarantorForm.accountno}
                onChange={(e) =>
                  onChange({
                    ...guarantorForm,
                    accountno: e.target.value.replace(/\D/g, ""),
                  })
                }
                onBlur={() => handleBlur("accountno")}
                placeholder="Account Number"
                className={errors.accountno ? "border-red-500" : ""}
              />
              {errors.accountno && (
                <p className="text-red-500 text-xs mt-1">{errors.accountno}</p>
              )}
            </div>

            {/* Bank Name */}
            <div>
              <Label className="text-base">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={guarantorForm.bankname}
                onChange={(e) =>
                  onChange({ ...guarantorForm, bankname: e.target.value })
                }
                onBlur={() => handleBlur("bankname")}
                placeholder="Bank Name"
                className={errors.bankname ? "border-red-500" : ""}
              />
              {errors.bankname && (
                <p className="text-red-500 text-xs mt-1">{errors.bankname}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-8">
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
