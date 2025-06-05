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
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getOfficerIdFromToken() {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem('user');
  console.log(JSON.parse(token)["id"]);
  return {name:JSON.parse(token)["roll"], id:JSON.parse(token)["id"]};
}

function convertClnToSingleId(clnId) {
  return clnId.startsWith("CLN-") ? parseInt(clnId.split("-")[1], 10) : null;
}

async function fetchCustomerById(clid) {
  try {
    const singleId = convertClnToSingleId(clid);
    if (!singleId) throw new Error('Invalid CLN ID format');
    const res = await fetch(`/api/customer/searchbyid?clid=${encodeURIComponent(singleId)}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    if (data.code !== 'SUCCESS') throw new Error(data.error || 'Not found');
    return data.customer;
  } catch (e) {
    return null;
  }
}

function encodeBase64(loginId, chooseId, customerId) {
  const data = `login=${loginId},choose=${chooseId},customer=${customerId}`;
  const encodedData = btoa(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g,
    function(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
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
    NIC: "0"
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
  const [loanType, setLoanType] = useState("Micro Loan");

  const financialProducts = [
    {
      title: "Business Loan",
      description: "Expand your business with a tailored loan.",
      icon: Building2,
      color: "bg-blue-500",
      path: `/loans/business-loan`
    },
    {
      title: "Auto Loan (Leasing)",
      description: "Flexible leasing options for your business needs.",
      icon: BarChart3,
      color: "bg-green-500",
      path: '/loans/auto-loan'
    },
    {
      title: "Equipment Loan",
      description: "Finance smartphones, laptops, and other business equipment.",
      icon: Smartphone,
      color: "bg-purple-500",
      path: '/loans/equipment-loan'
    }
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
            NIC: customer.nic
          });
          setClientData(customer);
        }
        setLoadingClient(false);
      })();
    }
  }, [clidParam]);

  // Handler for searching client by ID
  const handleClientSearch = async () => {
    setLoadingClient(true);
    setClientError("");
    const customer = await fetchCustomerById(clientIdInput.trim());
    if (customer) {
      setClientInfo({
        name: customer.fullname,
        id: params.clid,
        NIC: customer.nic
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
      croOfficers.find((officer) => officer.name === selectedOfficer)?.id || loginId;
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

  const handleAddCategory = () => {
    if (loanCategoryName.trim() && !categories.includes(loanCategoryName.trim())) {
      setCategories([...categories, loanCategoryName.trim()]);
      setLoanCategoryName("");
    }
  };

  const calculateTotal = () => {
    const amount = parseFloat(loanAmount) || 0;
    const interest = parseFloat(interestRate) || 0;
    const charge = parseFloat(serviceCharge) || 0;
    const total = amount + (amount * interest / 100) + charge;
    setTotalAmount(total);
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
                    {clientError && <p className="text-red-500 text-xs mb-2">{clientError}</p>}
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
                        <p className="font-medium">
                          {params.clid}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <IdCard className="w-5 h-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">NIC</p>
                        <p className="font-medium">
                          {clientInfo.NIC}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col justify-center">
                    <p className="text-sm text-gray-500 mb-2">Account Manager</p>
                    {officerName && (
                      <span className="text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-md border border-blue-100 mb-2">
                        Logged in as: {officerName}
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full md:w-60 flex justify-between items-center">
                          <span>{selectedOfficer}</span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-full md:w-60">
                        <div className="p-2">
                          <Input
                            placeholder="Search CRO Officer"
                            value={croSearch}
                            onChange={(e) => setCroSearch(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        {croOfficers
                          .filter((officer) =>
                            officer.name.toLowerCase().includes(croSearch.toLowerCase())
                          )
                          .map((officer) => (
                            <DropdownMenuItem
                              key={officer.id}
                              onClick={() => setSelectedOfficer(officer.name)}
                            >
                              {officer.name} ({officer.empid})
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                        <p className="text-lg font-semibold text-gray-800">{product.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                        <Button className="mt-4 text-sm">Let's Start!</Button>
                      </div>
                      <div className={`p-3 md:p-4 rounded-full ${product.color} text-white shadow-md ml-4`}>
                        <product.icon className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Move Loan Type Selector up here */}
            <div className="mb-4 w-full">
              <Label className="flex items-center mb-1 text-base">Select Loan Type</Label>
              <select
                className="border rounded-md px-3 py-1 text-gray-800 font-semibold bg-gray-50 min-h-[32px] w-full text-base"
                value={loanType}
                onChange={e => setLoanType(e.target.value)}
              >
                <option value="Micro Loan">Micro Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Daily Loan">Daily Loan</option>
                <option value="Monthly Loan">Monthly Loan</option>
                <option value="Weekly Loan">Weekly Loan</option>
                <option value="Other Loan">Other Loan</option>
              </select>
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
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                
                {/* Interest Rate */}
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input 
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="Enter rate"
                  />
                </div>
                
                {/* Service Charge */}
                <div className="space-y-2">
                  <Label>Service Charge</Label>
                  <Input 
                    type="number"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
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
                    Loan Duration (in days) <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    type="number"
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(e.target.value)}
                    placeholder="Enter duration"
                  />
                </div>
                
                {/* Loan Category */}
                <div className="space-y-2">
                  <Label>Loan Category Name</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={loanCategoryName}
                      onChange={(e) => setLoanCategoryName(e.target.value)}
                      placeholder="Enter category"
                    />
                    <Button 
                      onClick={handleAddCategory}
                      className="whitespace-nowrap"
                    >
                      + ADD
                    </Button>
                  </div>
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
              
              <div className="flex gap-4 mt-8">
                <Button 
                  onClick={calculateTotal}
                  className="bg-blue-600 hover:bg-blue-700 flex-1 py-6 flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  CALCULATE TOTAL AMOUNT
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 flex-1 py-6 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  ADD LOAN CATEGORY
                </Button>
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
    telephone: "+1 (555) 123-4567"
  });

  const croOfficers = [
    "Sarah Johnson",
    "Michael Chen",
    "Emma Rodriguez",
    "David Kim",
    "Lisa Patel"
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
                      <p className="font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-md">{clientInfo.name}</p>
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
                  <p className="text-sm text-gray-500 mb-2">Account Manager</p>
                  {officerName && (
                    <span className="text-purple-700 font-semibold bg-purple-50 px-3 py-1 rounded-md border border-purple-100 mb-2">
                      Logged in as: {officerName}
                    </span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full md:w-60 flex justify-between items-center">
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
                Finance smartphones, laptops, and other business equipment with competitive rates.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-700 mb-4">
              Quickly upgrade your business technology with flexible financing options and quick approval.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">Apply Now</Button>
          </div>
        </main>
      </div>
    </div>
  );
}