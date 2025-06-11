"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoanSubmissionDisplay } from "@/components/displays/LoanSubmissionDisplay";
import { GuarantorForm } from "@/components/forms/GuarantorForm";

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
    totalAmount: "",
  });

  useEffect(() => {
    // Retrieve data from sessionStorage
    const storedData = sessionStorage.getItem("loanFormData");
    if (storedData) {
      setLoanData(JSON.parse(storedData));
      // Optionally clear the data after retrieving
      sessionStorage.removeItem("loanFormData");
    }
  }, []);

  const handleEditGuarantor = (index) => {
    setEditingGuarantorIndex(index);
    setGuarantorForm(guarantors[index]);
    setShowGuarantorModal(true);
  };

  const handleStartEdit = (section) => {
    setEditingSection(section);
    if (section === "client") {
      setEditForm({
        ...editForm,
        clientName: loanData.clientInfo?.name,
        clientId: loanData.clientInfo?.id,
        clientNIC: loanData.clientInfo?.NIC,
        accountManager: loanData.selectedOfficer,
      });
    } else if (section === "loan") {
      setEditForm({
        ...editForm,
        loanType: loanData.loanType,
        loanName: loanData.loanName,
        loanCategory: loanData.selectedSubLoanCategory,
        loanDuration: loanData.loanDuration,
        loanFrequency: loanData.loanFrequency,
      });
    } else if (section === "financial") {
      setEditForm({
        ...editForm,
        loanAmount: loanData.loanAmount,
        interestRate: loanData.interestRate,
        serviceCharge: loanData.serviceCharge,
        totalAmount: loanData.totalAmount,
      });
    }
  };

  const handleSaveEdit = (section) => {
    if (section === "client") {
      setLoanData({
        ...loanData,
        clientInfo: {
          ...loanData.clientInfo,
          name: editForm.clientName,
          id: editForm.clientId,
          NIC: editForm.clientNIC,
        },
        selectedOfficer: editForm.accountManager,
      });
    } else if (section === "loan") {
      setLoanData({
        ...loanData,
        loanType: editForm.loanType,
        loanName: editForm.loanName,
        selectedSubLoanCategory: editForm.loanCategory,
        loanDuration: editForm.loanDuration,
        loanFrequency: editForm.loanFrequency,
      });
    } else if (section === "financial") {
      setLoanData({
        ...loanData,
        loanAmount: editForm.loanAmount,
        interestRate: editForm.interestRate,
        serviceCharge: editForm.serviceCharge,
        totalAmount: editForm.totalAmount,
      });
    }
    setEditingSection(null);
  };

  const handleSubmitGuarantor = () => {
    if (editingGuarantorIndex !== null) {
      const updatedGuarantors = [...guarantors];
      updatedGuarantors[editingGuarantorIndex] = guarantorForm;
      setGuarantors(updatedGuarantors);
    } else {
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

          <LoanSubmissionDisplay
            loanData={loanData}
            guarantors={guarantors}
            onAddGuarantor={() => setShowGuarantorModal(true)}
            onEditGuarantor={handleEditGuarantor}
            onRemoveGuarantor={(index) =>
              setGuarantors(guarantors.filter((_, i) => i !== index))
            }
          />

          <GuarantorForm
            showModal={showGuarantorModal}
            guarantorForm={guarantorForm}
            editingIndex={editingGuarantorIndex}
            onClose={() => {
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
            onSubmit={handleSubmitGuarantor}
            onChange={setGuarantorForm}
          />
        </CardContent>
      </Card>
    </div>
  );
}
