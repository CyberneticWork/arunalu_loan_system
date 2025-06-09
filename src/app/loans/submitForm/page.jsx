"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoanSubmissionPage() {
  const [loanData, setLoanData] = useState(null);
  const [showGuarantorModal, setShowGuarantorModal] = useState(false);
  const [guarantors, setGuarantors] = useState([]);
  const [guarantorForm, setGuarantorForm] = useState({
    name: "",
    nic: "",
    address: "",
    phone: "",
    occupation: "",
    monthlyIncome: "",
  });
  const [editingGuarantorIndex, setEditingGuarantorIndex] = useState(null);
  const [editingSection, setEditingSection] = useState(null); // 'client', 'loan', or 'financial'
  const [editForm, setEditForm] = useState({
    // Client Information
    clientName: "",
    clientId: "",
    clientNIC: "",
    accountManager: "",

    // Loan Details
    loanType: "",
    loanName: "",
    loanCategory: "",
    loanDuration: "",
    loanFrequency: "",

    // Financial Details
    loanAmount: "",
    interestRate: "",
    serviceCharge: "",
    totalAmount: ""
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    const encodedData = searchParams.get("data");
    if (encodedData) {
      const decodedData = JSON.parse(decodeURIComponent(atob(encodedData)));
      setLoanData(decodedData);
    }
  }, [searchParams]);

  const handleEditGuarantor = (index) => {
    setEditingGuarantorIndex(index);
    setGuarantorForm(guarantors[index]);
    setShowGuarantorModal(true);
  };

  const handleStartEdit = (section) => {
    setEditingSection(section);
    if (section === 'client') {
      setEditForm({
        ...editForm,
        clientName: loanData.clientInfo?.name,
        clientId: loanData.clientInfo?.id,
        clientNIC: loanData.clientInfo?.NIC,
        accountManager: loanData.selectedOfficer
      });
    } else if (section === 'loan') {
      setEditForm({
        ...editForm,
        loanType: loanData.loanType,
        loanName: loanData.loanName,
        loanCategory: loanData.selectedSubLoanCategory,
        loanDuration: loanData.loanDuration,
        loanFrequency: loanData.loanFrequency
      });
    } else if (section === 'financial') {
      setEditForm({
        ...editForm,
        loanAmount: loanData.loanAmount,
        interestRate: loanData.interestRate,
        serviceCharge: loanData.serviceCharge,
        totalAmount: loanData.totalAmount
      });
    }
  };

  const handleSaveEdit = (section) => {
    if (section === 'client') {
      setLoanData({
        ...loanData,
        clientInfo: {
          ...loanData.clientInfo,
          name: editForm.clientName,
          id: editForm.clientId,
          NIC: editForm.clientNIC
        },
        selectedOfficer: editForm.accountManager
      });
    } else if (section === 'loan') {
      setLoanData({
        ...loanData,
        loanType: editForm.loanType,
        loanName: editForm.loanName,
        selectedSubLoanCategory: editForm.loanCategory,
        loanDuration: editForm.loanDuration,
        loanFrequency: editForm.loanFrequency
      });
    } else if (section === 'financial') {
      setLoanData({
        ...loanData,
        loanAmount: editForm.loanAmount,
        interestRate: editForm.interestRate,
        serviceCharge: editForm.serviceCharge,
        totalAmount: editForm.totalAmount
      });
    }
    setEditingSection(null);
  };

  if (!loanData) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Loan Application Summary
            </h1>
            <p className="text-sm text-gray-500">
              Review the loan application details below
            </p>
          </div>

          {/* Client Information Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b flex justify-between items-center">
              <span>Client Information</span>
              {editingSection !== 'client' ? (
                <Button
                  onClick={() => handleStartEdit('client')}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingSection(null)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSaveEdit('client')}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Save
                  </Button>
                </div>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editingSection === 'client' ? (
                <>
                  <div>
                    <Label>Client Name</Label>
                    <Input
                      value={editForm.clientName}
                      onChange={(e) => setEditForm({...editForm, clientName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Client ID</Label>
                    <Input
                      value={editForm.clientId}
                      onChange={(e) => setEditForm({...editForm, clientId: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>NIC</Label>
                    <Input
                      value={editForm.clientNIC}
                      onChange={(e) => setEditForm({...editForm, clientNIC: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Account Manager</Label>
                    <Input
                      value={editForm.accountManager}
                      onChange={(e) => setEditForm({...editForm, accountManager: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm text-gray-500">Client Name</label>
                    <p className="font-medium">{loanData.clientInfo?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Client ID</label>
                    <p className="font-medium">{loanData.clientInfo?.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">NIC</label>
                    <p className="font-medium">{loanData.clientInfo?.NIC}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Account Manager</label>
                    <p className="font-medium">{loanData.selectedOfficer}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Loan Details Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b">
              Loan Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Loan Type</label>
                <p className="font-medium">{loanData.loanType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Loan Name</label>
                <p className="font-medium">{loanData.loanName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Loan Category</label>
                <p className="font-medium">
                  {loanData.selectedSubLoanCategory}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Loan Duration</label>
                <p className="font-medium">{loanData.loanDuration} days</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">
                  Payment Frequency
                </label>
                <p className="font-medium">{loanData.loanFrequency}</p>
              </div>
            </div>
          </div>

          {/* Financial Details Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b">
              Financial Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Loan Amount</label>
                <p className="font-medium">
                  LKR{" "}
                  {Number(loanData.loanAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Interest Rate</label>
                <p className="font-medium">{loanData.interestRate}%</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Service Charge</label>
                <p className="font-medium">
                  LKR{" "}
                  {Number(loanData.serviceCharge).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Total Amount</label>
                <p className="font-medium text-green-700">
                  LKR{" "}
                  {Number(loanData.totalAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Guarantor Information Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b flex justify-between items-center">
              <span>Guarantor Information</span>
              <Button
                onClick={() => setShowGuarantorModal(true)}
                disabled={guarantors.length >= 2}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Guarantor {guarantors.length}/2
              </Button>
            </h2>

            {guarantors.length === 0 ? (
              <p className="text-sm text-gray-500">No guarantors added yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guarantors.map((guarantor, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">Guarantor {index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => handleEditGuarantor(index)}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-gray-500">Name:</span>{" "}
                        {guarantor.name}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">NIC:</span>{" "}
                        {guarantor.nic}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Phone:</span>{" "}
                        {guarantor.phone}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Occupation:</span>{" "}
                        {guarantor.occupation}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Monthly Income:</span>{" "}
                        LKR {Number(guarantor.monthlyIncome).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleEditGuarantor(index)}
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          setGuarantors(
                            guarantors.filter((_, i) => i !== index)
                          );
                        }}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Submission Date</p>
                <p className="font-medium">
                  {new Date(loanData.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Print Details
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Confirm & Process
                </button>
              </div>
            </div>
          </div>

          {/* Guarantor Modal */}
          {showGuarantorModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                  {editingGuarantorIndex !== null 
                    ? `Edit Guarantor ${editingGuarantorIndex + 1}` 
                    : 'Add Guarantor Information'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={guarantorForm.name}
                      onChange={(e) =>
                        setGuarantorForm({
                          ...guarantorForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <Label>NIC Number</Label>
                    <Input
                      value={guarantorForm.nic}
                      onChange={(e) =>
                        setGuarantorForm({
                          ...guarantorForm,
                          nic: e.target.value,
                        })
                      }
                      placeholder="Enter NIC number"
                    />
                  </div>

                  <div>
                    <Label>Address</Label>
                    <Input
                      value={guarantorForm.address}
                      onChange={(e) =>
                        setGuarantorForm({
                          ...guarantorForm,
                          address: e.target.value,
                        })
                      }
                      placeholder="Enter address"
                    />
                  </div>

                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={guarantorForm.phone}
                      onChange={(e) =>
                        setGuarantorForm({
                          ...guarantorForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <Label>Occupation</Label>
                    <Input
                      value={guarantorForm.occupation}
                      onChange={(e) =>
                        setGuarantorForm({
                          ...guarantorForm,
                          occupation: e.target.value,
                        })
                      }
                      placeholder="Enter occupation"
                    />
                  </div>

                  <div>
                    <Label>Monthly Income</Label>
                    <Input
                      type="number"
                      value={guarantorForm.monthlyIncome}
                      onChange={(e) =>
                        setGuarantorForm({
                          ...guarantorForm,
                          monthlyIncome: e.target.value,
                        })
                      }
                      placeholder="Enter monthly income"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowGuarantorModal(false);
                      setGuarantorForm({
                        name: "",
                        nic: "",
                        address: "",
                        phone: "",
                        occupation: "",
                        monthlyIncome: "",
                      });
                      setEditingGuarantorIndex(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      if (editingGuarantorIndex !== null) {
                        // Update existing guarantor
                        const updatedGuarantors = [...guarantors];
                        updatedGuarantors[editingGuarantorIndex] = guarantorForm;
                        setGuarantors(updatedGuarantors);
                      } else {
                        // Add new guarantor
                        setGuarantors([...guarantors, guarantorForm]);
                      }
                      setShowGuarantorModal(false);
                      setGuarantorForm({
                        name: "",
                        nic: "",
                        address: "",
                        phone: "",
                        occupation: "",
                        monthlyIncome: "",
                      });
                      setEditingGuarantorIndex(null);
                    }}
                  >
                    {editingGuarantorIndex !== null ? 'Update Guarantor' : 'Add Guarantor'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
