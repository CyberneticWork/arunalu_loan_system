"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import provinceDistrictData from "@/lib/jsons/srt_pro_dist.json";
import bankList from "@/lib/jsons/banklist.json";
import { useRouter } from "next/navigation";

export function UpdateClient({ onSubmit, onCancel, initialNIC }) {
  // State to track the current step
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  // Province/district state
  const provinces = provinceDistrictData["Sri Lanka"].Provinces.map(
    (p) => p.name
  );
  const [selectedProvince, setSelectedProvince] = useState("");
  const [districts, setDistricts] = useState([]);
  // State to track if all required fields are complete for each section
  const [sectionStatus, setSectionStatus] = useState({
    personal: false,
    relation: false,
  });

  // Validation helpers
  const validateName = (name) => /^[A-Za-z ]+$/.test(name);
  const validateIdNo = (id) => /^\d{12}$/.test(id) || /^\d{9}[VvXx]$/.test(id);
  const validateDOB = (dob) => {
    if (!dob) return false;
    const dobDate = new Date(dob);
    const now = new Date();
    const age = now.getFullYear() - dobDate.getFullYear();
    const m = now.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dobDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };
  const validateGSDiv = (val) => /[A-Za-z]/.test(val) && /\d/.test(val);
  const validateDSOffice = (val) => /^[A-Za-z ]+$/.test(val);
  const validateRelationName = (name) => /^[A-Za-z ]+$/.test(name);
  const validateRelationAddress = (address) => address && address.length > 0;
  const validateRelationNic = (nic) =>
    /^\d{12}$/.test(nic) || /^\d{9}[VvXx]$/.test(nic);
  const validateRelationTelNo = (telNo) => /^[0-9]+$/.test(telNo);
  const validateTelNo = (telno) => /^[0-9]+$/.test(telno);

  // Error state
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const [formData, setFormData] = useState({
    prefix: "Mr",
    fullName: "",
    idNo: "",
    gender: "Male",
    dob: "",
    address1: "",
    location: "",
    telno: "",
    gsDivision: "",
    dsOffice: "",
    district: "",
    province: "",
    relationName: "",
    relationNic: "",
    relationTelNo: "",
    relationshipType: "Spouse",
    relationAddress1: "",
    relationAddress2: "",
    relationAddress3: "",
  });

  // Store customerId for spouse relation step
  const [customerId, setCustomerId] = useState(null);

  const steps = [
    { id: "personal", title: "Personal Details" },
    { id: "relation", title: "Spouse/Relation" },
    { id: "review", title: "Review & Submit" },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Check if current section is complete
    validateSection(currentStep);
  };

  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    handleChange("province", value);
    // Find districts for selected province
    const found = provinceDistrictData["Sri Lanka"].Provinces.find(
      (p) => p.name === value
    );
    setDistricts(found ? found.districts : []);
    // Clear district when province changes
    handleChange("district", "");
  };
  const handleDistrictChange = (value) => {
    handleChange("district", value);
  };

  // Validate if the current section has all required fields filled
  const validateSection = (step) => {
    if (step === 0) {
      const newErrors = {};
      if (!validateName(formData.fullName))
        newErrors.fullName = "Name must contain only letters and spaces.";
      if (!validateIdNo(formData.idNo)) newErrors.idNo = "Invalid ID format.";
      if (!validateDOB(formData.dob))
        newErrors.dob = "Must be at least 18 years old.";
      if (!formData.address1) newErrors.address1 = "Address is required.";
      if (!formData.location) newErrors.location = "Branch is required.";
      if (!validateTelNo(formData.telno))
        newErrors.telno = "Telephone No: numbers only.";
      if (!validateGSDiv(formData.gsDivision))
        newErrors.gsDivision = "Center is required";
      if (!validateDSOffice(formData.dsOffice))
        newErrors.dsOffice = "DS Office: letters only.";
      if (!formData.district) newErrors.district = "District is required.";
      if (!formData.province) newErrors.province = "Province is required.";
      setErrors(newErrors);
      const isPersonalComplete = Object.keys(newErrors).length === 0;
      setSectionStatus((prev) => ({ ...prev, personal: isPersonalComplete }));
      return isPersonalComplete;
    } else if (step === 1) {
      const newErrors = {};
      if (!validateRelationName(formData.relationName))
        newErrors.relationName = "Name must contain only letters and spaces.";
      if (!validateRelationNic(formData.relationNic))
        newErrors.relationNic = "Invalid NIC format.";
      if (!validateRelationTelNo(formData.relationTelNo))
        newErrors.relationTelNo = "Telephone No: numbers only.";
      if (!formData.relationshipType)
        newErrors.relationshipType = "Relationship type required.";
      if (!validateRelationAddress(formData.relationAddress1))
        newErrors.relationAddress1 = "Address is required.";
      setErrors(newErrors);
      const isRelationComplete = Object.keys(newErrors).length === 0;
      setSectionStatus((prev) => ({ ...prev, relation: isRelationComplete }));
      return isRelationComplete;
    }

    return true;
  };

  // Auto-search and fill on NIC input
  useEffect(() => {
    // Only trigger if NIC is valid
    if (validateIdNo(formData.idNo)) {
      async function fetchCustomer(nic) {
        try {
          const res = await fetch(`/api/customer/${nic}`);
          if (!res.ok) return; // Not found, do not overwrite
          const data = await res.json();
          if (data.customer) {
            // Set province/district state for dropdowns
            if (data.customer.province)
              setSelectedProvince(data.customer.province);
            if (data.customer.province) {
              const found = provinceDistrictData["Sri Lanka"].Provinces.find(
                (p) => p.name === data.customer.province
              );
              setDistricts(found ? found.districts : []);
            }
            setFormData((prev) => ({
              ...prev,
              prefix: data.customer.prefix || "Mr",
              fullName: data.customer.fullname || "",
              idNo: data.customer.nic || "",
              gender: data.customer.gender === 1 ? "Male" : "Female",
              dob: data.customer.dob ? data.customer.dob.slice(0, 10) : "",
              address1: data.customer.address || "",
              location: data.customer.location || "",
              telno: data.customer.telno || "",
              gsDivision: data.customer.gs || "",
              dsOffice: data.customer.ds || "",
              district: data.customer.district || "",
              province: data.customer.province || "",
              relationName: data.spouse?.name || "",
              relationNic: data.spouse?.nic || "",
              relationTelNo: data.spouse?.telno || "",
              relationshipType: data.spouse?.relation || "Spouse",
              relationAddress1: data.spouse?.address || "",
            }));
          }
        } catch (e) {
          // Ignore errors for auto-search
        }
      }
      fetchCustomer(formData.idNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.idNo]);

  // Auto-fill on load if NIC is provided
  useEffect(() => {
    async function fetchCustomer(nic) {
      try {
        const res = await fetch(`/api/customer/${nic}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        if (data.customer) {
          // Set province/district state for dropdowns
          if (data.customer.province)
            setSelectedProvince(data.customer.province);
          if (data.customer.province) {
            const found = provinceDistrictData["Sri Lanka"].Provinces.find(
              (p) => p.name === data.customer.province
            );
            setDistricts(found ? found.districts : []);
          }
          setFormData((prev) => ({
            ...prev,
            prefix: data.customer.prefix || "Mr",
            fullName: data.customer.fullname || "",
            idNo: data.customer.nic || "",
            gender: data.customer.gender === 1 ? "Male" : "Female",
            dob: data.customer.dob ? data.customer.dob.slice(0, 10) : "",
            address1: data.customer.address || "",
            location: data.customer.location || "",
            telno: data.customer.telno || "",
            gsDivision: data.customer.gs || "",
            dsOffice: data.customer.ds || "",
            district: data.customer.district || "",
            province: data.customer.province || "",
            relationName: data.spouse?.name || "",
            relationNic: data.spouse?.nic || "",
            relationTelNo: data.spouse?.telno || "",
            relationshipType: data.spouse?.relation || "Spouse",
            relationAddress1: data.spouse?.address || "",
          }));
        }
      } catch (e) {
        setApiError("Failed to auto-fill client data.");
      }
    }
    if (initialNIC) fetchCustomer(initialNIC);
  }, [initialNIC]);

  const handleNext = async () => {
    // Only proceed if current section is valid
    if (validateSection(currentStep)) {
      setCurrentStep((current) => current + 1);
    } else {
      setApiError("Please fill in all required fields before proceeding.");
    }
  };

  const handlePrevious = () => {
    setCurrentStep((current) => Math.max(0, current - 1));
  };

  const getSpousePayload = () => {
    return {
      name: formData.relationName || "",
      address: formData.relationAddress1 || "",
      telno: formData.relationTelNo || "",
      relation: formData.relationshipType || "",
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(sectionStatus.personal && sectionStatus.relation)) {
      setApiError("Please complete all required fields before submitting.");
      return;
    }
    setApiError("");
    const payload = {
      prefix: formData.prefix,
      fullname: formData.fullName,
      nic: formData.idNo,
      gender: formData.gender === "Male" ? 1 : 0,
      dob: formData.dob,
      location: formData.location,
      address: formData.address1,
      telno: formData.telno,
      gs: formData.gsDivision,
      ds: formData.dsOffice,
      district: formData.district,
      province: formData.province,
      status: "pending",
      createby: "system",
      editby: "system",
      spouse: getSpousePayload(),
    };
    try {
      const res = await fetch("/api/update-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.code !== "SUCCESS") {
        setApiError(data.error || "Failed to update customer");
        return;
      }
      if (onSubmit) onSubmit(payload);
    } catch (e) {
      setApiError("Network or server error. Please try again.");
    }
  };

  const [branches, setBranches] = useState([]);

  // Add useEffect to fetch branches when component mounts
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches");
        const data = await res.json();
        if (data.code === "SUCCESS") {
          setBranches(data.data);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchBranches();
  }, []);

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border",
                  currentStep === index
                    ? "bg-blue-600 text-white border-blue-600"
                    : currentStep > index
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-400 border-gray-300"
                )}
              >
                {currentStep > index ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-1 w-20 sm:w-40",
                    currentStep > index ? "bg-green-500" : "bg-gray-200"
                  )}
                ></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div
              key={`label-${step.id}`}
              className={cn(
                "text-xs font-medium text-center w-10 sm:w-20",
                currentStep === index
                  ? "text-blue-600"
                  : currentStep > index
                  ? "text-green-500"
                  : "text-gray-500"
              )}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPersonalDetails = () => {
    return (
      <Card className="shadow-lg border-2 border-blue-100 animate-fade-in">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="text-blue-500 h-6 w-6 animate-bounceIn" />{" "}
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Row 0 - Prefix + Name + ID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="prefix" className="text-sm font-medium">
                Prefix <span className="text-red-500">*</span>
              </Label>
              <select
                id="prefix"
                value={formData.prefix}
                onChange={(e) => handleChange("prefix", e.target.value)}
                required
                className="border rounded px-2 py-2 w-full focus:ring-2 focus:ring-blue-300 transition"
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Miss">Miss</option>
                <option value="Ms">Ms</option>
                <option value="Rev">Rev</option>
                <option value="Dr">Dr</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Customer Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Full Name"
                required
                className="focus:ring-2 focus:ring-blue-300 transition"
              />
              {errors.fullName && (
                <p className="text-xs text-red-600 animate-shake">
                  {errors.fullName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNo" className="text-sm font-medium">
                ID No <span className="text-red-500">*</span>
              </Label>
              <Input
                id="idNo"
                value={formData.idNo}
                onChange={(e) => handleChange("idNo", e.target.value)}
                placeholder="National ID"
                required
                className="focus:ring-2 focus:ring-blue-300 transition"
              />
              {errors.idNo && (
                <p className="text-xs text-red-600 animate-shake">
                  {errors.idNo}
                </p>
              )}
            </div>
          </div>

          {/* Row 6-7 - Gender, DOB, Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Gender <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => handleChange("gender", value)}
                className="flex space-x-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male" className="font-normal">
                    Male
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female" className="font-normal">
                    Female
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-sm font-medium">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="pl-9 focus:ring-2 focus:ring-blue-300 transition"
                  required
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.dob && (
                <p className="text-xs text-red-600 animate-shake">
                  {errors.dob}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Branch <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.location}
                onValueChange={(value) => handleChange("location", value)}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.shortcode}>
                      {branch.branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location && (
                <p className="text-xs text-red-600">{errors.location}</p>
              )}
            </div>
          </div>

          {/* Row 8-12 - Address */}
          <div className="space-y-3">
            <Label htmlFor="address1" className="text-sm font-medium">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address1"
              value={formData.address1}
              onChange={(e) => handleChange("address1", e.target.value)}
              placeholder="House No., Street, City"
              required
              className="focus:ring-2 focus:ring-blue-300 transition"
            />
            {errors.address1 && (
              <p className="text-xs text-red-600 animate-shake">
                {errors.address1}
              </p>
            )}
          </div>
          {/* Row X - Telephone No */}
          <div className="space-y-2">
            <Label
              htmlFor="telno"
              className="text-sm font-medium flex items-center gap-1"
            >
              Telephone No <span className="text-red-500">*</span>
              <span className="ml-1 text-gray-400" title="Only numbers allowed">
                ?
              </span>
            </Label>
            <Input
              id="telno"
              value={formData.telno}
              onChange={(e) => handleChange("telno", e.target.value)}
              placeholder="Telephone No"
              required
              className="focus:ring-2 focus:ring-blue-300 transition"
            />
            {errors.telno && (
              <p className="text-xs text-red-600 animate-shake">
                {errors.telno}
              </p>
            )}
          </div>

          {/* Row 9-10 - GS Division and DS Office */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="gsDivision" className="text-sm font-medium">
                GS Division <span className="text-red-500">*</span>
              </Label>
              <Input
                id="gsDivision"
                value={formData.gsDivision}
                onChange={(e) => handleChange("gsDivision", e.target.value)}
                placeholder="e.g. 70B"
                required
                className="focus:ring-2 focus:ring-blue-300 transition"
              />
              {errors.gsDivision && (
                <p className="text-xs text-red-600 animate-shake">
                  {errors.gsDivision}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dsOffice" className="text-sm font-medium">
                DS Office <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dsOffice"
                value={formData.dsOffice}
                onChange={(e) => handleChange("dsOffice", e.target.value)}
                placeholder="e.g. Katana"
                required
                className="focus:ring-2 focus:ring-blue-300 transition"
              />
              {errors.dsOffice && (
                <p className="text-xs text-red-600 animate-shake">
                  {errors.dsOffice}
                </p>
              )}
            </div>
          </div>

          {/* Row 9-10 - District and Province */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="province" className="text-sm font-medium">
                Province <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedProvince || formData.province}
                onValueChange={handleProvinceChange}
              >
                <SelectTrigger
                  id="province"
                  className="focus:ring-2 focus:ring-blue-300 transition"
                >
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.province && (
                <p className="text-xs text-red-600 animate-shake">
                  {errors.province}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="district" className="text-sm font-medium">
                District <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.district}
                onValueChange={handleDistrictChange}
                disabled={!selectedProvince || districts.length === 0}
              >
                <SelectTrigger
                  id="district"
                  className="focus:ring-2 focus:ring-blue-300 transition"
                >
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.district && (
                <p className="text-xs text-red-600 animate-shake">
                  {errors.district}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-gradient-to-r from-blue-50 to-blue-100 rounded-b-xl">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="hover:bg-red-50 transition"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white shadow-md transition"
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderRelationDetails = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spouse/Relation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="relationName" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="relationName"
                value={formData.relationName}
                onChange={(e) => handleChange("relationName", e.target.value)}
                placeholder="Full Name"
                required
              />
              {errors.relationName && (
                <p className="text-xs text-red-600">{errors.relationName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationNic" className="text-sm font-medium">
                NIC <span className="text-red-500">*</span>
              </Label>
              <Input
                id="relationNic"
                value={formData.relationNic}
                onChange={(e) => handleChange("relationNic", e.target.value)}
                placeholder="NIC"
                required
              />
              {errors.relationNic && (
                <p className="text-xs text-red-600">{errors.relationNic}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationAddress1" className="text-sm font-medium">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="relationAddress1"
              value={formData.relationAddress1}
              onChange={(e) => handleChange("relationAddress1", e.target.value)}
              placeholder="Address"
              required
            />
            {errors.relationAddress1 && (
              <p className="text-xs text-red-600">{errors.relationAddress1}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationTelNo" className="text-sm font-medium">
              Telephone No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="relationTelNo"
              value={formData.relationTelNo}
              onChange={(e) => handleChange("relationTelNo", e.target.value)}
              placeholder="Telephone No"
              required
            />
            {errors.relationTelNo && (
              <p className="text-xs text-red-600">{errors.relationTelNo}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationshipType" className="text-sm font-medium">
              Relationship <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.relationshipType}
              onValueChange={(value) => handleChange("relationshipType", value)}
            >
              <SelectTrigger id="relationshipType">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Parent">Parent</SelectItem>
                <SelectItem value="Sibling">Sibling</SelectItem>
                <SelectItem value="Child">Child</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.relationshipType && (
              <p className="text-xs text-red-600">{errors.relationshipType}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            onClick={handlePrevious}
            variant="outline"
            className="flex items-center"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <Button type="button" onClick={handleNext}>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderReviewSection = () => {
    const allSectionsComplete =
      sectionStatus.personal && sectionStatus.relation;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review & Submit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Section Status</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full mr-2",
                    sectionStatus.personal ? "bg-green-500" : "bg-red-500"
                  )}
                ></div>
                <span>
                  Personal Details:{" "}
                  {sectionStatus.personal ? "Complete" : "Incomplete"}
                </span>
              </div>
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full mr-2",
                    sectionStatus.relation ? "bg-green-500" : "bg-red-500"
                  )}
                ></div>
                <span>
                  Spouse/Relation Details:{" "}
                  {sectionStatus.relation ? "Complete" : "Incomplete"}
                </span>
              </div>
            </div>
          </div>

          {!allSectionsComplete && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-sm text-red-800">
                Please complete all required fields in previous sections before
                submitting.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            onClick={handlePrevious}
            variant="outline"
            className="flex items-center"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <Button
            type="submit"
            disabled={!allSectionsComplete}
            className={cn(
              !allSectionsComplete && "opacity-50 cursor-not-allowed"
            )}
          >
            Submit
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalDetails();
      case 1:
        return renderRelationDetails();
      case 2:
        return renderReviewSection();
      default:
        return renderPersonalDetails();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {apiError && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
          {apiError}
        </div>
      )}
      {renderStepIndicator()}
      {renderCurrentStep()}
    </form>
  );
}
