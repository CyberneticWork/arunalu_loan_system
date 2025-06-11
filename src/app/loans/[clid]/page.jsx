"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Building2,
  BarChart3,
  Phone,
  UserCheck,
  ChevronDown,
  IdCard,
  Smartphone,
  Calculator,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateLoan } from "@/components/Calculations/loancalculation";

function getOfficerIdFromToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("user");
  console.log(JSON.parse(token)["id"]);
  return { name: JSON.parse(token)["roll"], id: JSON.parse(token)["id"] };
}

function convertClnToSingleId(clnId) {
  return clnId.startsWith("CLN-") ? parseInt(clnId.split("-")[1], 10) : null;
}

async function fetchCustomerById(clid) {
  try {
    const singleId = convertClnToSingleId(clid);
    if (!singleId) throw new Error("Invalid CLN ID format");
    const res = await fetch(
      `/api/customer/searchbyid?clid=${encodeURIComponent(singleId)}`
    );
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    if (data.code !== "SUCCESS") throw new Error(data.error || "Not found");
    return data.customer;
  } catch (e) {
    return null;
  }
}

function encodeBase64(loginId, chooseId, customerId) {
  const data = `login=${loginId},choose=${chooseId},customer=${customerId}`;
  const encodedData = btoa(
    encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode("0x" + p1);
    })
  );
  return encodedData;
}

export default function Home() {
  const router = useRouter();
  const params = useParams();

  const clidParam = params?.clid;
  const [selectedOfficer, setSelectedOfficer] = useState("Select CRO Officer");
  const [officerName, setOfficerName] = useState(null);
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientData, setClientData] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    name: "none",
    id: "0",
    NIC: "0",
  });

  const [loadingClient, setLoadingClient] = useState(false);
  const [clientError, setClientError] = useState("");
  const [croOfficers, setCroOfficers] = useState([]);
  const [croSearch, setCroSearch] = useState("");

  const [loanName, setLoanName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [loanDuration, setLoanDuration] = useState("");
  const [loanCategoryName, setLoanCategoryName] = useState("");
  const [categories, setCategories] = useState([]);
  const [loanFrequency, setLoanFrequency] = useState("Daily");
  const [loanType, setLoanType] = useState("");
  const [loanTypes, setLoanTypes] = useState([]);
  const [showAddLoanType, setShowAddLoanType] = useState(false);
  const [newLoanType, setNewLoanType] = useState("");
  const [addingLoanType, setAddingLoanType] = useState(false);
  const [addLoanTypeError, setAddLoanTypeError] = useState("");

  const [subLoanCategories, setSubLoanCategories] = useState([]);
  const [selectedSubLoanCategory, setSelectedSubLoanCategory] = useState("");

  const [showAddSubLoan, setShowAddSubLoan] = useState(false);
  const [newSubLoanName, setNewSubLoanName] = useState("");
  const [addingSubLoan, setAddingSubLoan] = useState(false);
  const [addSubLoanError, setAddSubLoanError] = useState("");

  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(
    "Select Account Manager"
  );

  // Handle form submission for loan application
  const handleSubmitLoan = () => {
    // Collect all form data
    const formData = {
      // Loan Information
      loanType,
      loanName,
      loanAmount: parseFloat(loanAmount) || 0,
      interestRate: parseFloat(interestRate) || 0,
      serviceCharge: parseFloat(serviceCharge) || 0,
      totalAmount,
      loanFrequency,
      loanDuration: parseInt(loanDuration) || 0,
      selectedSubLoanCategory,

      // Client Information
      clientInfo: {
        name: clientInfo.name,
        id: clientInfo.id,
        NIC: clientInfo.NIC,
      },

      // Officer Information
      selectedOfficer,
      officerName,

      // Categories & Additional Info
      categories,
      subLoanCategories,

      // Timestamp
      submittedAt: new Date().toISOString(),
    };

    // Store data in sessionStorage before navigation
    sessionStorage.setItem("loanFormData", JSON.stringify(formData));
    router.push("/loans/submitForm");
  };

  const financialProducts = [
    {
      title: "Business Loan",
      description: "Expand your business with a tailored loan.",
      icon: Building2,
      color: "bg-blue-500",
      path: `/loans/business-loan`,
    },
    {
      title: "Auto Loan (Leasing)",
      description: "Flexible leasing options for your business needs.",
      icon: BarChart3,
      color: "bg-green-500",
      path: "/loans/auto-loan",
    },
    {
      title: "Equipment Loan",
      description:
        "Finance smartphones, laptops, and other business equipment.",
      icon: Smartphone,
      color: "bg-purple-500",
      path: "/loans/equipment-loan",
    },
  ];

  // Fetch CRO officers on mount
  useEffect(() => {
    const fetchCROOfficers = async () => {
      try {
        const res = await fetch("/api/employees/cro");
        if (!res.ok) throw new Error("Failed to fetch CRO officers");
        const data = await res.json();
        if (data.code === "SUCCESS") {
          setCroOfficers(data.data);
        }
      } catch (error) {
        console.error("Error fetching CRO officers:", error);
      }
    };

    fetchCROOfficers();
  }, []);

  // Fetch managers on mount
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await fetch("/api/customer/Manager");
        if (!res.ok) throw new Error("Failed to fetch managers");
        const data = await res.json();
        if (data.code === "SUCCESS") {
          setManagers(data.data);
        }
      } catch (error) {
        console.error("Error fetching managers:", error);
      }
    };
    fetchManagers();
  }, []);

  // Fetch officer ID from JWT on mount
  useEffect(() => {
    const officerData = getOfficerIdFromToken();
    if (officerData) {
      setOfficerName(officerData.name);
    }
  }, []);

  // Fetch client info from param on mount
  useEffect(() => {
    if (clidParam) {
      (async () => {
        setLoadingClient(true);
        const customer = await fetchCustomerById(clidParam);
        if (customer) {
          setClientInfo({
            name: customer.fullname,
            id: customer.id,
            NIC: customer.nic,
          });
          setClientData(customer);
        }
        setLoadingClient(false);
      })();
    }
  }, [clidParam]);

  // Fetch loan types from API on mount
  useEffect(() => {
    fetchLoanTypes();
  }, []);

  // Fetch sub-loan categories when loanType changes
  useEffect(() => {
    const fetchSubLoanCategories = async () => {
      // Find the selected loan type object to get its id
      const selectedTypeObj = loanTypes.find((type) => type.name === loanType);
      if (!selectedTypeObj) {
        setSubLoanCategories([]);
        setSelectedSubLoanCategory("");
        return;
      }
      try {
        const res = await fetch(
          `/api/sub_loan?mainLoanId=${selectedTypeObj.id}`
        );
        if (!res.ok) throw new Error("Failed to fetch sub-loan categories");
        const data = await res.json();
        setSubLoanCategories(data);
        setSelectedSubLoanCategory(data.length > 0 ? data[0].id : "");
      } catch (error) {
        setSubLoanCategories([]);
        setSelectedSubLoanCategory("");
      }
    };
    if (loanType) fetchSubLoanCategories();
  }, [loanType, loanTypes]);

  const fetchLoanTypes = async () => {
    try {
      const res = await fetch("/api/loan-types");
      if (!res.ok) throw new Error("Failed to fetch loan types");
      const data = await res.json();
      setLoanTypes(data);
      if (data.length > 0) setLoanType(data[0].name);
    } catch (error) {
      console.error("Error fetching loan types:", error);
    }
  };

  // Handler for searching client by ID
  const handleClientSearch = async () => {
    setLoadingClient(true);
    setClientError("");
    const customer = await fetchCustomerById(clientIdInput.trim());
    if (customer) {
      setClientInfo({
        name: customer.fullname,
        id: params.clid,
        NIC: customer.nic,
      });
      setClientData(customer);
    } else {
      setClientError("Client not found");
    }
    setLoadingClient(false);
  };

  const handleEncodeData = () => {
    const officerData = getOfficerIdFromToken();
    if (!officerData || !officerData.id) {
      alert("Failed to retrieve admin ID. Please log in again.");
      return null;
    }

    const loginId = officerData.id;
    const chooseId =
      croOfficers.find((officer) => officer.name === selectedOfficer)?.id ||
      loginId;
    const customerId = clientInfo.id;

    if (!customerId) {
      alert("Customer ID is missing.");
      return null;
    }

    try {
      const encodedData = encodeBase64(loginId, chooseId, customerId);
      console.log("Encoded Data:", encodedData);
      return encodedData;
    } catch (error) {
      console.error("Error encoding data:", error);
      alert("Failed to encode data. Please try again.");
      return null;
    }
  };

  const handleAddCategory = async () => {
    setAddSubLoanError("");
    if (!newSubLoanName.trim()) {
      setAddSubLoanError("Sub-loan category name is required.");
      return;
    }
    const selectedTypeObj = loanTypes.find((type) => type.name === loanType);
    if (!selectedTypeObj) {
      setAddSubLoanError("Please select a loan type first.");
      return;
    }
    setAddingSubLoan(true);
    try {
      const res = await fetch("/api/sub_loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub_loan_name: newSubLoanName.trim(),
          mainLoanId: selectedTypeObj.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAddSubLoanError(err.error || "Failed to add sub-loan category.");
        setAddingSubLoan(false);
        return;
      }
      setNewSubLoanName("");
      setShowAddSubLoan(false);
      // Refresh sub-loan categories
      const refreshed = await fetch(
        `/api/sub_loan?mainLoanId=${selectedTypeObj.id}`
      );
      if (refreshed.ok) {
        const data = await refreshed.json();
        setSubLoanCategories(data);
        setSelectedSubLoanCategory(
          data.length > 0 ? data[data.length - 1].id : ""
        );
      }
    } catch (error) {
      setAddSubLoanError("Failed to add sub-loan category.");
    }
    setAddingSubLoan(false);
  };

  const calculateTotal = () => {
    const amount = parseFloat(loanAmount) || 0;
    const interest = parseFloat(interestRate) || 0;
    const charge = parseFloat(serviceCharge) || 0;
    const duration = parseInt(loanDuration) || 0;
    const frequency = loanFrequency;

    const result = calculateLoan({
      principal: amount,
      rate: interest,
      term: duration,
      paymentFrequency: frequency,
      serviceCharge: charge,
    });

    setTotalAmount(result.totalPayable || 0);
  };

  const handleAddLoanType = async () => {
    setAddLoanTypeError("");
    if (!newLoanType.trim()) {
      setAddLoanTypeError("Loan type name is required.");
      return;
    }
    setAddingLoanType(true);
    try {
      const res = await fetch("/api/loan-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLoanType.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAddLoanTypeError(err.error || "Failed to add loan type.");
        setAddingLoanType(false);
        return;
      }
      setNewLoanType("");
      setShowAddLoanType(false);
      await fetchLoanTypes();
    } catch (error) {
      setAddLoanTypeError("Failed to add loan type.");
    }
    setAddingLoanType(false);
  };

  // Helper function to allow only numbers
  const handleNumberInput = (e, setter) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  return (
    <>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                Financial Solutions
              </h1>
              <p className="text-sm text-gray-500">
                Select the financial product that best suits your needs.
              </p>
            </div>

            {/* Client Information Card */}
            <Card className="w-full mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-1"></div>
                <div className="flex flex-col md:flex-row justify-between p-4">
                  <div className="space-y-3">
                    {clientError && (
                      <p className="text-red-500 text-xs mb-2">{clientError}</p>
                    )}
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Client Name</p>
                        <p className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                          {clientInfo.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <UserCheck className="w-5 h-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Client ID</p>
                        <p className="font-medium">{params.clid}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <IdCard className="w-5 h-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">NIC</p>
                        <p className="font-medium">{clientInfo.NIC}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col justify-center">
                    <Label className="text-sm mb-1">
                      Select Account Manager
                    </Label>
                    <select
                      className="border rounded-md px-3 py-2 w-full mt-1"
                      value={selectedManager}
                      onChange={(e) => setSelectedManager(e.target.value)}
                    >
                      <option disabled>Select Account Manager</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.name}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
              {financialProducts.map((product, index) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    const encodedData = handleEncodeData();
                    if (encodedData) {
                      router.push(`${product.path}/${encodedData}`);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-800">
                          {product.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {product.description}
                        </p>
                        <Button className="mt-4 text-sm">Let's Start!</Button>
                      </div>
                      <div
                        className={`p-3 md:p-4 rounded-full ${product.color} text-white shadow-md ml-4`}
                      >
                        <product.icon className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Move Loan Type Selector up here */}
            <div className="mb-4 w-full">
              <Label className="flex items-center mb-1 text-base">
                Select Loan Type
              </Label>
              <div className="flex gap-2">
                <select
                  className="border rounded-md px-3 py-1 text-gray-800 font-semibold bg-gray-50 min-h-[32px] w-full text-base"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                >
                  {loanTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setShowAddLoanType(true)}
                >
                  Add New Loan Type
                </Button>
              </div>
              {/* Modal/Dialog for adding new loan type */}
              {showAddLoanType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                    <h3 className="text-lg font-semibold mb-2">
                      Add New Loan Type
                    </h3>
                    <input
                      className="border rounded-md px-3 py-2 w-full mb-2"
                      placeholder="Enter loan type name"
                      value={newLoanType}
                      onChange={(e) => setNewLoanType(e.target.value)}
                      disabled={addingLoanType}
                    />
                    {addLoanTypeError && (
                      <div className="text-red-500 text-sm mb-2">
                        {addLoanTypeError}
                      </div>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        className="bg-gray-200 text-gray-700"
                        onClick={() => {
                          setShowAddLoanType(false);
                          setNewLoanType("");
                          setAddLoanTypeError("");
                        }}
                        disabled={addingLoanType}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleAddLoanType}
                        disabled={addingLoanType}
                      >
                        {addingLoanType ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Card className="w-full overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-1"></div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Add Loan Category
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Loan Name */}
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        Loan Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        value={loanName}
                        onChange={(e) => setLoanName(e.target.value)}
                        placeholder="Enter loan name"
                      />
                    </div>

                    {/* Loan Amount */}
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        Loan Amount <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={1} 
                        value={loanAmount}
                        onChange={(e) => handleNumberInput(e, setLoanAmount)}
                        placeholder="Enter amount"
                      />
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-2">
                      <Label>Interest Rate (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={interestRate}
                        onChange={(e) => handleNumberInput(e, setInterestRate)}
                        placeholder="Enter rate"
                      />
                    </div>

                    {/* Service Charge */}
                    <div className="space-y-2">
                      <Label>Service Charge</Label>
                      <Input
                        type="number"
                        min={0} 
                        value={serviceCharge}
                        onChange={(e) => handleNumberInput(e, setServiceCharge)}
                        placeholder="Enter charge"
                      />
                    </div>

                    {/* Total Amount */}
                    <div className="space-y-2">
                      <Label>Total Amount</Label>
                      <div className="border rounded-md px-3 py-2 text-gray-800 font-bold bg-gray-50 min-h-[40px] flex items-center">
                        LKR {totalAmount.toFixed(2)}
                      </div>
                    </div>

                    {/* Loan Frequency */}
                    <div className="space-y-2">
                      <Label>Loan Frequency</Label>
                      <select
                        className="border rounded-md px-3 py-2 text-gray-800 font-bold bg-gray-50 min-h-[40px] flex items-center w-full"
                        value={loanFrequency}
                        onChange={(e) => setLoanFrequency(e.target.value)}
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Loan Duration */}
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        Loan Duration <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={1} 
                        value={loanDuration}
                        onChange={(e) => handleNumberInput(e, setLoanDuration)}
                        placeholder="Enter duration"
                      />
                    </div>

                    {/* Loan Category (Dropdown) */}
                    <div className="space-y-2">
                      <Label>Loan Category Name</Label>
                      <div className="flex gap-2">
                        <select
                          className="border rounded-md px-3 py-2 w-full"
                          value={selectedSubLoanCategory}
                          onChange={(e) =>
                            setSelectedSubLoanCategory(e.target.value)
                          }
                        >
                          {subLoanCategories.length === 0 && (
                            <option value="">
                              No sub-loan categories available
                            </option>
                          )}
                          {subLoanCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.sub_loan_name}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          onClick={() => setShowAddSubLoan(true)}
                          className="whitespace-nowrap"
                        >
                          + ADD
                        </Button>
                      </div>
                      {/* Modal/Dialog for adding new sub-loan category */}
                      {showAddSubLoan && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                            <h3 className="text-lg font-semibold mb-2">
                              Add New Sub-Loan Category
                            </h3>
                            <input
                              className="border rounded-md px-3 py-2 w-full mb-2"
                              placeholder="Enter sub-loan category name"
                              value={newSubLoanName}
                              onChange={(e) =>
                                setNewSubLoanName(e.target.value)
                              }
                              disabled={addingSubLoan}
                            />
                            {addSubLoanError && (
                              <div className="text-red-500 text-sm mb-2">
                                {addSubLoanError}
                              </div>
                            )}
                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                className="bg-gray-200 text-gray-700"
                                onClick={() => {
                                  setShowAddSubLoan(false);
                                  setNewSubLoanName("");
                                  setAddSubLoanError("");
                                }}
                                disabled={addingSubLoan}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleAddCategory}
                                disabled={addingSubLoan}
                              >
                                {addingSubLoan ? "Adding..." : "Add"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {categories.map((category, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4 mt-8">
                    <Button
                      onClick={calculateTotal}
                      className="bg-blue-600 hover:bg-blue-700 w-full py-6"
                    >
                      <Calculator className="w-5 h-5 mr-2" />
                      CALCULATE TOTAL AMOUNT
                    </Button>

                    <div
                      title={
                        !clientInfo.name || clientInfo.name === "none"
                          ? "Please select a valid client first"
                          : ""
                      }
                    >
                      <Button
                        onClick={handleSubmitLoan}
                        className="bg-green-600 hover:bg-green-700 w-full py-6"
                        disabled={
                          !clientInfo.name ||
                          clientInfo.name === "none" ||
                          totalAmount === 0
                        }
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        SUBMIT LOAN APPLICATION
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}

// Equipment Loan Component
export function EquipmentLoan() {
  const [selectedOfficer, setSelectedOfficer] = useState("Select CRO Officer");
  const [officerName, setOfficerName] = useState(null);

  const [clientInfo, setClientInfo] = useState({
    name: "Acme Corporation",
    id: "ACME-2025-0042",
    telephone: "+1 (555) 123-4567",
  });

  const croOfficers = [
    "Sarah Johnson",
    "Michael Chen",
    "Emma Rodriguez",
    "David Kim",
    "Lisa Patel",
  ];

  // Fetch officer name from JWT on mount
  useEffect(() => {
    const officerData = getOfficerIdFromToken();
    if (officerData) {
      setOfficerName(officerData.name);
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {/* Client Information Card */}
          <Card className="w-full mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-1"></div>
              <div className="flex flex-col md:flex-row justify-between p-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-purple-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Client Name</p>
                      <p className="font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-md">
                        {clientInfo.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <UserCheck className="w-5 h-5 text-purple-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Client ID</p>
                      <p className="font-medium">{clientInfo.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-purple-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Telephone</p>
                      <p className="font-medium">{clientInfo.telephone}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:ml-6 flex flex-col justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full md:w-60 flex justify-between items-center"
                      >
                        <span>{selectedOfficer}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-full md:w-60">
                      {croOfficers.map((officer, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => setSelectedOfficer(officer)}
                        >
                          {officer}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6 flex items-center">
            <div className="p-3 rounded-full bg-purple-500 text-white shadow-md mr-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                Equipment Loan
              </h1>
              <p className="text-sm text-gray-500">
                Finance smartphones, laptops, and other business equipment with
                competitive rates.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-700 mb-4">
              Quickly upgrade your business technology with flexible financing
              options and quick approval.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Apply Now
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
